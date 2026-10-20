#!/usr/bin/env python3
"""Project public bibliography metadata into the academic site's reading index.

Only the catalog and its existing reading-data JSON are read. No note bodies,
downloaded files, personal routes, or translations enter the public output.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import parse_qsl, urlsplit


REPORT_FIELDS = (
    "id", "title", "short", "company", "date", "source", "category",
    "technologies", "keywords", "core_order", "selected",
)
CATEGORY_FIELDS = ("id", "title")
# Explicit public publisher/repository hosts from the source bibliography.
# New hosts require review instead of being accepted by a broad suffix match.
ALLOWED_HOSTS = frozenset({
    "aclanthology.org", "ai.azure.com", "ai.google.dev", "anthropic.com",
    "arxiv.org", "blog.google", "cohere.com", "data.x.ai", "deepmind.google",
    "deploymentsafety.openai.com", "developers.google.com",
    "docs.aws.amazon.com", "github.com", "huggingface.co", "microsoft.ai",
    "mistral.ai", "openai.com", "qwenlm.github.io", "raw.githubusercontent.com",
    "research.meta.ai", "research.nvidia.com", "seed.bytedance.com",
    "storage.googleapis.com", "www.ai21.com", "www.amazon.science",
    "www.anthropic.com", "www.deepseek.com", "www.microsoft.com",
    "www.minimax.io", "x.ai",
})
SHARED_HOST_OWNERS = {
    "github.com": {
        "01-ai", "alibaba-nlp", "baichuan-inc", "bytedance-seed",
        "deepseek-ai", "ibm-granite", "meta-llama", "minimax-ai",
        "moonshotai", "paddlepaddle", "qwenlm", "stepfun-ai",
        "tencent-hunyuan", "wan-video",
    },
    "raw.githubusercontent.com": {
        "01-ai", "baichuan-inc", "ibm-granite", "qwenlm",
    },
    "huggingface.co": {
        "cohereforai", "coherelabs", "deepseek-ai", "google", "meta-models",
        "microsoft", "minimaxai", "mistralai", "moonshotai", "nvidia",
        "qwen", "stepfun-ai", "tencent", "zai-org",
    },
    "storage.googleapis.com": {"deepmind-media"},
}
SENSITIVE_QUERY_KEYS = {
    "access_token", "api_key", "apikey", "auth", "authorization",
    "key", "password", "secret", "signature", "token",
}
PRIVATE_MARKERS = (
    "file://", "dev-knowledge-base", "bytetech.info", "larkoffice.com",
    "feishu.cn", "knowledge_notes/", "foundation_notes/", "personalRoute",
)


class ReadingDataParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.inside = False
        self.parts: list[str] = []
        self.matches = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "script" and dict(attrs).get("id") == "reading-data":
            self.matches += 1
            self.inside = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "script":
            self.inside = False

    def handle_data(self, data: str) -> None:
        if self.inside:
            self.parts.append(data)


def sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def require_text(value: object, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Missing or invalid text field: {field}")
    if any(ord(char) < 32 and char not in "\t\n\r" for char in value):
        raise ValueError(f"Control character in field: {field}")
    return value


def public_url(value: object) -> str:
    url = require_text(value, "source")
    parts = urlsplit(url)
    if (
        parts.scheme != "https"
        or parts.hostname not in ALLOWED_HOSTS
        or parts.username is not None
        or parts.password is not None
        or parts.port not in (None, 443)
    ):
        raise ValueError("Source is not an approved public HTTPS URL")
    if any(key.lower() in SENSITIVE_QUERY_KEYS for key, _ in parse_qsl(parts.query)):
        raise ValueError("Source URL has a credential-like query parameter")
    owners = SHARED_HOST_OWNERS.get(parts.hostname)
    if owners is not None:
        owner = parts.path.lstrip("/").split("/", 1)[0].lower()
        if owner not in owners:
            raise ValueError("Repository owner or storage bucket requires review")
    return url


def source_url(catalog: dict, selected: dict | None) -> tuple[str, str]:
    if selected and selected.get("source"):
        return public_url(selected["source"]), "reading-data.source"
    metadata = catalog.get("metadata_url", "")
    if metadata and urlsplit(metadata).hostname == "arxiv.org":
        return public_url(metadata), "catalog.metadata_url"
    return public_url(catalog.get("source_url")), "catalog.source_url"


def display_year(value: object) -> str | None:
    if value in (None, ""):
        return None
    if not isinstance(value, str) or not re.match(r"^(?:19|20)\d{2}(?:-|$)", value):
        raise ValueError("Invalid catalog date; cannot project a year")
    return value[:4]


def write_json(path: Path, data: object) -> bytes:
    content = (json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_bytes(content)
    temporary.replace(path)
    return content


def assert_private_audit_ignored(root: Path) -> None:
    result = subprocess.run(
        ["git", "check-ignore", "-q", "_preview/source-audit.json"],
        cwd=root, capture_output=True, check=False,
    )
    if result.returncode:
        raise RuntimeError("The local _preview audit must be Git-ignored before export")


def export(source: Path, root: Path) -> dict:
    assert_private_audit_ignored(root)
    inputs = {
        "catalog": source / "catalog.json",
        "reading": source / "01_优先级阅读指南.html",
    }
    raw = {name: path.read_bytes() for name, path in inputs.items()}
    catalog = json.loads(raw["catalog"].decode("utf-8-sig"))
    parser = ReadingDataParser()
    parser.feed(raw["reading"].decode("utf-8-sig"))
    if parser.matches != 1:
        raise ValueError("Expected exactly one reading-data JSON element")
    reading = json.loads("".join(parser.parts))
    if not isinstance(catalog, list):
        raise ValueError("Catalog must be a list")

    catalog_ids = [require_text(row.get("id"), "catalog.id") for row in catalog]
    selected_rows = reading["papers"]
    selected_ids = [require_text(row.get("id"), "reading.id") for row in selected_rows]
    if len(set(catalog_ids)) != len(catalog_ids):
        raise ValueError("Duplicate catalog IDs")
    if len(set(selected_ids)) != len(selected_ids):
        raise ValueError("Duplicate selected report IDs")
    if not set(selected_ids).issubset(catalog_ids):
        raise ValueError("Selected reports missing from the catalog")
    if reading.get("catalogCount") != len(catalog):
        raise ValueError("Reading catalogCount disagrees with the catalog")
    selected_by_id = {row["id"]: row for row in selected_rows}
    core = reading["core"]
    if len(core) != len(set(core)) or not set(core).issubset(selected_ids):
        raise ValueError("Core IDs must be unique selected report IDs")
    categories = [
        {field: require_text(row.get(field), f"category.{field}") for field in CATEGORY_FIELDS}
        for row in reading["categories"]
    ]
    category_ids = {row["id"] for row in categories}
    if len(category_ids) != len(categories):
        raise ValueError("Duplicate category IDs")
    tech_labels = {
        row["id"]: require_text(row.get("label"), "technology.label")
        for row in reading["technologies"]
    }

    reports = []
    source_fields: Counter = Counter()
    missing_years = []
    missing_technologies = []
    missing_keywords = []
    source_groups: defaultdict = defaultdict(list)
    for row in catalog:
        report_id = row["id"]
        selected = selected_by_id.get(report_id)
        preferred = selected or row
        title = require_text(preferred.get("title"), f"{report_id}.title")
        source_link, source_field = source_url(row, selected)
        source_fields[source_field] += 1
        year = display_year(preferred.get("date") or row.get("date"))
        if year is None:
            missing_years.append(report_id)
        technologies = (
            [tech_labels[tech] for tech in selected.get("technologies", [])]
            if selected else []
        )
        keywords = (
            [require_text(item.get("keyword"), f"{report_id}.keyword")
             for item in selected.get("focus", [])]
            if selected else []
        )
        category = selected["category"] if selected else None
        if selected and category not in category_ids:
            raise ValueError(f"Unknown selected category for {report_id}")
        core_order = selected.get("core_order", 0) if selected else 0
        expected_order = core.index(report_id) + 1 if report_id in core else 0
        if core_order != expected_order:
            raise ValueError(f"Core ordering mismatch for {report_id}")
        if selected and not technologies:
            missing_technologies.append(report_id)
        if selected and not keywords:
            missing_keywords.append(report_id)
        report = {
            "id": report_id,
            "title": title,
            "short": require_text(selected["short"], f"{report_id}.short") if selected else title,
            "company": require_text(row.get("company"), f"{report_id}.company"),
            "date": year,
            "source": source_link,
            "category": category,
            "technologies": technologies,
            "keywords": keywords,
            "core_order": core_order,
            "selected": selected is not None,
        }
        if tuple(report) != REPORT_FIELDS:
            raise AssertionError("Public report field whitelist changed")
        reports.append(report)
        source_groups[source_link].append(report_id)

    output = {"reports": reports, "core": core, "categories": categories}
    serialized = json.dumps(output, ensure_ascii=False)
    if any(marker.lower() in serialized.lower() for marker in PRIVATE_MARKERS):
        raise ValueError("Private content marker found in public metadata")
    if re.search(r"\b[A-Za-z]:[\\/]", serialized):
        raise ValueError("Local drive path found in public metadata")
    for name, path in inputs.items():
        if sha256(path.read_bytes()) != sha256(raw[name]):
            raise RuntimeError("Source changed during export; rerun from a stable input")

    output_path = root / "_data" / "reading.json"
    output_bytes = write_json(output_path, output)
    audit = {
        "kind": "public-bibliography-projection",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "complete",
        "claim_eligibility": "no_new_academic_claim",
        "guide": "Guide: no material change",
        "inputs": {
            name: {"path": str(inputs[name]), "sha256": sha256(content)}
            for name, content in raw.items()
        },
        "exporter_sha256": sha256(Path(__file__).read_bytes()),
        "output": {
            "path": "_data/reading.json",
            "sha256": sha256(output_bytes),
            "bytes": len(output_bytes),
        },
        "counts": {
            "catalog": len(catalog),
            "exported": len(reports),
            "selected": sum(row["selected"] for row in reports),
            "core": len(core),
            "categories": len(categories),
            "companies": len({row["company"] for row in reports}),
        },
        "field_whitelist": list(REPORT_FIELDS),
        "category_field_whitelist": list(CATEGORY_FIELDS),
        "projections": {
            "company": "catalog.company; unchanged label",
            "date": "First four digits of existing date, or null; a catalog year, not a release date",
            "technologies": "Existing reading-data technology IDs projected to their existing labels",
            "keywords": "Existing focus[].keyword only",
            "category": "Existing selected category ID; null outside the selection",
            "core_order": "Existing selected core_order, checked against core[]; zero otherwise",
        },
        "source_field_counts": dict(sorted(source_fields.items())),
        "url_domain_counts": dict(sorted(Counter(
            urlsplit(row["source"]).hostname for row in reports
        ).items())),
        "approved_hosts": sorted(ALLOWED_HOSTS),
        "missing": {
            "source": [],
            "title": [],
            "company": [],
            "year": missing_years,
            "selected_technologies": missing_technologies,
            "selected_keywords": missing_keywords,
        },
        "duplicate_source_urls": [
            {"source": url, "ids": ids}
            for url, ids in source_groups.items() if len(ids) > 1
        ],
        "checks": {
            "catalog_ids_unique": True,
            "selected_ids_resolve": True,
            "core_order_matches": True,
            "all_urls_approved_public_https": True,
            "shared_host_owners_reviewed": True,
            "source_inputs_unchanged": True,
            "strict_field_whitelist": True,
            "no_private_markers_or_drive_paths": True,
            "audit_git_ignored": True,
        },
        "excluded_fields": [
            "body", "why", "question", "focus.note", "focus.term", "focus.page",
            "personalRoute", "path", "href", "local_path", "translations",
            "PDF contents", "knowledge-base contents",
        ],
        "scope": (
            "Metadata projection only. Existing source URLs and technique labels are retained; "
            "no network availability check, new literature classification, or source-content claim."
        ),
    }
    write_json(root / "_preview" / "source-audit.json", audit)
    return audit


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True, help="Local report archive directory")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    audit = export(args.source.resolve(strict=True), root)
    print(json.dumps({
        "status": audit["status"], "counts": audit["counts"],
        "missing_years": len(audit["missing"]["year"]),
        "selected_without_technology_labels": len(audit["missing"]["selected_technologies"]),
        "selected_without_keywords": len(audit["missing"]["selected_keywords"]),
        "duplicate_source_groups": len(audit["duplicate_source_urls"]),
        "output": audit["output"]["path"],
    }, ensure_ascii=True))


if __name__ == "__main__":
    main()
