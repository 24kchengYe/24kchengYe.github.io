"""Export a public, metadata-only learning collection from the selected index.

No linked note is opened; no excerpt, internal URL, or local path enters output.
The separate audit is local build evidence and must not be published with data.
Uses Python's standard library only. Arguments are paths, not network sources.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
from pathlib import Path
from urllib.parse import urlsplit


BOOKS = {
    'sec-001': ({'zh': '模型解读', 'en': 'Foundation models', 'ja': '基盤モデル'}, ['GPT', 'DeepSeek', 'Qwen', 'Gemini']),
    'sec-002': ({'zh': '架构与长上下文', 'en': 'Architecture & context', 'ja': 'アーキテクチャと長文脈'}, ['Transformer', 'MoE', 'RoPE', 'MLA']),
    'sec-003': ({'zh': '推理与部署', 'en': 'Inference & systems', 'ja': '推論とシステム'}, ['PagedAttention', 'FlashAttention', 'GPTQ', 'Speculative Decoding']),
    'sec-004': ({'zh': '训练与对齐', 'en': 'Training & alignment', 'ja': '学習とアラインメント'}, ['PPO', 'GRPO', 'DPO', 'OPD']),
    'sec-005': ({'zh': '评测与验证', 'en': 'Evaluation & verification', 'ja': '評価と検証'}, ['LLM-as-a-Judge', 'Rubrics', 'Benchmarks']),
    'sec-006': ({'zh': 'Agent', 'en': 'Agents', 'ja': 'エージェント'}, ['ReAct', 'Agentic RL', 'Memory', 'Skills']),
    'sec-007': ({'zh': '代码与软件工程', 'en': 'Code & software engineering', 'ja': 'コードとソフトウェア工学'}, ['SWE-agent', 'SWE-RL', 'CodeLLM', 'Verifiers']),
    'sec-008': ({'zh': '综述与教程', 'en': 'Surveys & tutorials', 'ja': 'サーベイとチュートリアル'}, ['Agentic RL', 'Context Engineering', 'Test-time Scaling']),
    'sec-009': ({'zh': '多模态', 'en': 'Multimodal learning', 'ja': 'マルチモーダル学習'}, ['VLM', 'DiT', 'World Models']),
    'sec-010': ({'zh': '具身智能', 'en': 'Embodied AI', 'ja': '身体性AI'}, ['VLA', 'Robot Learning', 'Reward Models']),
}

SECTIONS = {
    '基础理论': {'zh': '基础理论', 'en': 'Foundations', 'ja': '基礎理論'},
    'PEFT': {'zh': '参数高效微调', 'en': 'Parameter-efficient fine-tuning', 'ja': 'パラメータ効率の高い微調整'},
    '思考 & 推理 & 熵（Thinking & Reasoning & Entrophy）': {'zh': '推理与熵', 'en': 'Reasoning & entropy', 'ja': '推論とエントロピー'},
    '并行 & 群体思考（Group & Parallel Thinking）': {'zh': '并行与群体推理', 'en': 'Parallel & collective reasoning', 'ja': '並列・集団推論'},
    'Self Play & teach & evolve': {'zh': '自博弈与自训练', 'en': 'Self-play & self-training', 'ja': '自己対戦と自己学習'},
    'SFT Theory & Experiment': {'zh': '监督微调', 'en': 'Supervised fine-tuning', 'ja': '教師あり微調整'},
    'OPD(On-Policy Distillation)': {'zh': '在线策略蒸馏', 'en': 'On-policy distillation', 'ja': 'オンポリシー蒸留'},
    'Direct Alignment Algorithms': {'zh': '偏好优化', 'en': 'Preference optimization', 'ja': '選好最適化'},
    'RL Alignment Algorithms': {'zh': '策略优化', 'en': 'Policy optimization', 'ja': '方策最適化'},
    'Pretrain': {'zh': '预训练', 'en': 'Pretraining', 'ja': '事前学習'},
    'Rubrics & Reward & Critic Model': {'zh': '奖励与评价模型', 'en': 'Rubrics & reward models', 'ja': 'ルーブリックと報酬モデル'},
    'Prompt Optimization&Evolve': {'zh': '提示词优化', 'en': 'Prompt optimization', 'ja': 'プロンプト最適化'},
    'Data Engineering': {'zh': '数据工程', 'en': 'Data engineering', 'ja': 'データエンジニアリング'},
    'Long-Horizen Agent': {'zh': '长程任务', 'en': 'Long-horizon tasks', 'ja': '長期タスク'},
    'Self-evolve Agent': {'zh': '自进化 Agent', 'en': 'Self-evolving agents', 'ja': '自己進化エージェント'},
    'Group-evolve Agent': {'zh': '协作与群体进化', 'en': 'Collective evolution', 'ja': '集団的進化'},
    'SubAgents': {'zh': '子 Agent', 'en': 'Subagents', 'ja': 'サブエージェント'},
    'Basic Agent Theory': {'zh': 'Agent 基础', 'en': 'Agent foundations', 'ja': 'エージェントの基礎'},
    'How to train agents': {'zh': 'Agent 训练', 'en': 'Training agents', 'ja': 'エージェントの学習'},
    'Agent Application Framework': {'zh': '应用框架', 'en': 'Application frameworks', 'ja': '応用フレームワーク'},
    'CodeLLM': {'zh': '代码模型', 'en': 'Code models', 'ja': 'コードモデル'},
    'CodeAgent': {'zh': '编程 Agent', 'en': 'Coding agents', 'ja': 'コーディングエージェント'},
}

# Names clarify catalog labels without carrying over the index's commentary.
TITLE_OVERRIDES = {
    'toc-001': 'GPT-3', 'toc-002': 'DeepSeek-R1',
    'toc-003': 'DeepSeek-V3: Scaling Challenges and Hardware',
    'toc-004': 'DeepSeek-V3.2', 'toc-005': 'DeepSeek-V4',
    'toc-006': 'DeepSeek-OCR / DeepSeek-OCR 2', 'toc-007': 'DeepSeekMath',
    'toc-008': 'GLM-4.5', 'toc-009': 'GLM-5', 'toc-010': 'GLM-5.1',
    'toc-011': 'GLM-5V-Turbo', 'toc-012': 'Qwen3 / Qwen3-VL',
    'toc-013': 'Kimi K2 / K2.5', 'toc-014': 'MiniMax-M1',
    'toc-015': 'MiniMax-M2', 'toc-016': 'LongCat-Flash-Thinking-2601',
    'toc-017': 'ERNIE 5.0', 'toc-018': 'WideSeek-R1',
    'toc-019': 'UI-TARS / UI-TARS 2', 'toc-020': 'EvoCUA',
    'toc-021': 'MiniCPM-V 4.5', 'toc-022': 'MinerU2.5',
    'toc-023': 'STEP3-VL-10B', 'toc-024': 'InternVL3.5',
    'toc-025': 'Youth_LLM', 'toc-026': 'Seed1.5-Thinking',
    'toc-027': 'Seed-Prover 1.5', 'toc-028': 'Seedream 4.0',
    'toc-029': 'Gemini 2.5', 'toc-030': 'MiMo', 'toc-031': 'QwenLong-L1',
    'toc-032': 'Baichuan-M3', 'toc-033': 'Qwen2.5-Omni',
    'toc-034': 'SmolLM2', 'toc-035': 'MedXIAOHE',
    'toc-036': 'Qwen3-Coder-Next', 'toc-037': 'Phi-4 Reasoning Vision 15B',
    'toc-038': 'Penguin-VL', 'toc-039': 'Seedance 2.0',
    'toc-040': 'OpenSeeker-v2', 'toc-042': 'Mixture of Experts',
    'toc-045': 'YaRN', 'toc-059': '分布式训练',
    'toc-062': 'FlashAttention / FlashAttention-2',
    'toc-068': 'Multi-Token Prediction via Self-Distillation',
    'toc-074': 'Scaling Laws for Neural Language Models',
    'toc-075': 'Training Compute-Optimal Large Language Models',
    'toc-175': 'A Survey of Direct Preference Optimization',
    'toc-176': 'Proximal Policy Optimization',
    'toc-177': 'Group Relative Policy Optimization',
    'toc-348': 'Agentic RL 的梯度反传',
    'toc-428': 'The Landscape of Agentic Reinforcement Learning for LLMs',
    'toc-043': 'RoFormer / RoPE', 'toc-046': 'Ring Attention / Blockwise Transformer',
    'toc-048': 'FASA', 'toc-051': 'QLoRA', 'toc-052': 'Position Interpolation',
    'toc-053': 'MoE Experts 与 Routers 的辅助损失', 'toc-054': 'Kimi Linear',
    'toc-058': 'Attention Residuals', 'toc-061': 'vLLM / PagedAttention',
    'toc-063': 'Fast Inference from Transformers via Speculative Decoding',
    'toc-073': 'Adam 定律与文本频率', 'toc-077': '语言模型的单射性与可逆性',
    'toc-079': 'PhysiCo：物理概念理解评测', 'toc-082': '原子任务与组合推理',
    'toc-083': 'LLM-as-a-Judge 的上下文效应', 'toc-085': '自然语言反馈学习',
    'toc-093': 'Why Fine-Tuning Encourages Hallucinations and How to Fix It',
    'toc-098': 'LoRA 的学习与遗忘', 'toc-106': 'Grokking 与 Multi-Hop 数据增强',
    'toc-107': '强化学习评测中的数据污染', 'toc-115': 'RLVR 与推理能力评估',
    'toc-120': 'Reasoning Models Struggle to Control their Chains of Thought',
    'toc-128': '小模型推理的强化学习', 'toc-130': '高熵 Token 与强化学习',
    'toc-136': 'Parallel Scaling Laws', 'toc-137': 'MetaStone-S1',
    'toc-141': '小模型递归推理', 'toc-142': '群体强化学习与经验共享',
    'toc-143': '推理模型的同伴学习', 'toc-152': 'Reinforcement Learning via Self-Distillation',
    'toc-151': 'Self-Distillation Enables Continual Learning', 'toc-153': 'SOAR',
    'toc-158': 'SFT 与 RL 的记忆和泛化', 'toc-159': '面向 RL 的 SFT',
    'toc-174': 'Direct Preference Optimization', 'toc-188': 'Length-Unbiased Sequence Policy Optimization',
    'toc-189': '组相对优势估计的偏差', 'toc-214': 'Are We on the Right Way to Assessing LLM-as-a-Judge?',
    'toc-221': 'Exploring Reasoning Reward Model for Agents',
    'toc-236': 'LLM 数据整理综述', 'toc-244': 'SWE-Milestone / EvoClaw',
    'toc-304': 'Retrospective Harness Optimization',
    'toc-src-2608-24876': '长程 Agent 编排的经验与工作记忆',
    'toc-323': 'Agent READMEs', 'toc-324': 'Agentic Reasoning for Large Language Models',
    'toc-364': 'Recursive Multi-Agent Systems', 'toc-373': 'OpenClaw',
    'toc-382': 'Croto', 'toc-390': 'PDB：精确调试基准', 'toc-396': 'DeepSeek-Coder',
    'toc-398': 'CodeDPO', 'toc-399': 'SWE-RM', 'toc-400': 'Agent-RLVR',
    'toc-401': 'SWE-RL', 'toc-402': 'SWE-Fixer', 'toc-403': 'CodeArena',
    'toc-404': 'RPG / RPG-Encoder', 'toc-411': '长上下文多轮 SWE Agent 的强化学习',
    'toc-429': '测试时扩展综述', 'toc-432': '上下文工程综述',
    'toc-449': 'Advancing Open-source World Models', 'toc-450': 'PaperBanana',
    'toc-451': 'Vision-DeepResearch', 'toc-453': '大模型的极端多标签分类',
    'toc-455': 'Green-VLA',
}

# Explicit, source-supported identity where the collection uses a bare ID.
BARE_ID_OVERRIDES = {'toc-177': ['2402.03300']}
REPORT_EXCLUSIONS = {
    'toc-004': 'V3.2 title/identifier conflicts with V2 date/description; do not associate reports.'
}

# Corrections are explicit metadata amendments, not silent edits to the source.
# Their primary-page identities were checked by the separate source audit.
SOURCE_CORRECTIONS = {
    'toc-037': {
        'urls': ['https://arxiv.org/abs/2603.03975'],
        'reason': 'Source arXiv 2403.03975 is unrelated; Phi-4-reasoning-vision-15B is arXiv 2603.03975.',
        'verifiedAgainst': 'https://arxiv.org/abs/2603.03975',
        'verifiedOn': '2026-10-23',
    },
    'toc-056': {
        'urls': ['https://arxiv.org/abs/2503.10622'],
        'reason': 'Source arXiv 2310.17143 is unrelated; Transformers without Normalization is arXiv 2503.10622.',
        'verifiedAgainst': 'https://arxiv.org/abs/2503.10622',
        'verifiedOn': '2026-10-23',
    },
    'toc-012': {
        'urls': ['https://github.com/QwenLM/Qwen3'],
        'reason': 'The source Markdown labels Qwen3 but targets Qwen2; retain the Qwen3 repository only.',
        'verifiedAgainst': 'https://github.com/QwenLM/Qwen3',
        'verifiedOn': '2026-10-23',
    },
    'toc-175': {
        'urls': ['https://arxiv.org/abs/2503.11701'],
        'reason': 'The chapter explicitly introduces A Survey of Direct Preference Optimization; other algorithm IDs in its prose are references, not co-primary sources.',
        'verifiedAgainst': 'https://arxiv.org/abs/2503.11701',
        'verifiedOn': '2026-10-23',
    },
}

ARXIV = re.compile(r'(?:arxiv\.org/(?:abs|pdf|html)/|arxiv\s*[:：]\s*)(\d{4}\.\d{4,5})(?:v\d+)?', re.I)
PAPER_LABEL = re.compile(r'(?:论文(?:链接|地址|原文|与资产|与代码|/代码|/代码/数据)?|原始(?:论文|报告)|arXiv|Paper|DOI|资源|版本/状态|早期版本)', re.I)
ASSET_LABEL = re.compile(r'(?:官方(?:代码仓库|仓库|代码|资源仓库|资源|资料仓库|配套资料库|项目页|资产|产物|发布|数据集|平台|资料)|代码仓库|代码与模型|论文专属代码|公开资产|开放资产|项目页|项目主页|Apple Research)', re.I)
PRIVATE_HOSTS = ('larkoffice.com', 'feishu.cn', 'feishu.net', 'bytetech.info', 'bytedance.net', 'bytedance.com')
RUNTIME_FIELDS = {'id', 'title', 'section', 'sourceUrls', 'reportIds'}


def clean(text):
    text = re.sub(r'\[\[\d+\]\]\(https?://[^)]*\)', '', text)
    text = html.unescape(re.sub(r'<[^>]+>', '', text))
    text = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', text)
    text = re.sub(r'[*`#]', '', text).strip(' \t\n🌟⭐')
    return re.sub(r'\s+', ' ', text).strip()


def public_urls(text):
    # The collection has numbered citation decorations unrelated to a paper's
    # own identity, e.g. a podcast footnote on a valid arXiv metadata line.
    text = re.sub(r'\[\[\d+\]\]\(https?://[^)]*\)', '', text)
    found = []
    # Markdown destination extraction avoids labels that contain displayed URLs.
    candidates = re.findall(r'\]\(<?(https?://[^\s<>]+?)>?\)', text)
    candidates += re.findall(r'https?://[^\s<>\[\]()（）；，。｜|]+', text)
    for candidate in candidates:
        url = html.unescape(candidate).rstrip('*.,;：:')
        p = urlsplit(url)
        host = (p.hostname or '').lower()
        if p.scheme not in ('http', 'https') or not host or p.username or p.password:
            continue
        if any(host == d or host.endswith('.' + d) for d in PRIVATE_HOSTS):
            continue
        if host in ('localhost', '127.0.0.1', '0.0.0.0') or re.fullmatch(r'[\d.]+', host):
            continue
        match = ARXIV.search(url)
        if match:
            url = 'https://arxiv.org/abs/' + match.group(1)
        if url not in found:
            found.append(url)
    return found


def source_metadata(body, ident):
    paper_lines, asset_lines = [], []
    for rawline in body.splitlines():
        line = clean(rawline).lstrip('- ').strip()
        # Restrict sources to explicit metadata; do not mine summary citations.
        label = re.split(r'[:：]', line, maxsplit=1)[0].strip()
        label = re.sub(r'[（(](?:字体需要加粗|加粗)[）)]', '', label)
        if PAPER_LABEL.fullmatch(label):
            paper_lines.append(rawline)
        elif ASSET_LABEL.fullmatch(label):
            # A framework merely used in experiments is not the paper's source.
            if not re.search(r'未(?:提供|公开|找到)|暂无|暂未|实验实现基于', line):
                asset_lines.append(rawline)
    primary = []
    for line in paper_lines:
        for url in public_urls(line):
            if url not in primary:
                primary.append(url)
    identifiers = set(ARXIV.findall('\n'.join(paper_lines)))
    identifiers.update(BARE_ID_OVERRIDES.get(ident, []))
    for arxiv in sorted(identifiers):
        url = 'https://arxiv.org/abs/' + arxiv
        if url not in primary:
            primary.append(url)
    # One or several co-primary papers may inhabit the same catalog chapter.
    # Only use official assets when no paper source was recorded.
    fallback = []
    if not primary:
        for line in asset_lines:
            for url in public_urls(line):
                if url not in fallback:
                    fallback.append(url)
    return primary or fallback, sorted(identifiers), ('paper-metadata' if primary else 'official-asset-metadata' if fallback else 'unlinked')


def neutral_title(ident, raw_title, body):
    if ident in TITLE_OVERRIDES:
        return TITLE_OVERRIDES[ident], 'curated-label'
    # Exact English titles are often the first metadata line in this collection.
    for rawline in body.splitlines()[1:14]:
        line = clean(rawline).lstrip('- ').strip()
        explicit = re.match(r'^(?:论文原名|英文原标题|英文标题|英文题目|论文原题|原文标题|论文标题|Title)\s*[:：]\s*(.+)$', line, re.I)
        if explicit:
            value = explicit.group(1).strip(' “”—')
            if len(value) > 3 and 'http' not in value:
                return value, 'explicit-title-metadata'
        if re.match(r'^\s*-\s+[^*]', rawline) and not re.search(r'[\u3400-\u9fff]|https?://', line):
            if len(line) >= 8 and not re.match(r'^(?:arXiv|DOI|GitHub|Source|Authors|Year)\b', line, re.I):
                return line, 'english-title-line'
    title = clean(raw_title)
    # Long translated editorial headlines beginning with a named method become
    # a method label. Do not reuse their empirical conclusion as a public title.
    named = re.match(r'^([A-Za-z][A-Za-z0-9²³&+_. /()\-‐‑–]*?)\s*[：:]\s*', title)
    if named and len(named.group(1)) <= 65:
        return named.group(1).strip(), 'method-label'
    title = re.sub(r'^(?:🌟|深度解读|通俗解读|人话解读|【通俗解读】|\[通俗解读\])\s*', '', title)
    title = re.sub(r'（剧透[：:].*?）', '', title)
    return title, 'source-heading'


def report_lookup(path):
    rows = json.loads(path.read_text(encoding='utf-8'))
    if isinstance(rows, dict):
        rows = rows.get('reports', rows.get('entries', []))
    result = {}
    for row in rows:
        urls = ' '.join(str(row.get(k, '')) for k in ('source', 'source_url', 'metadata_url', 'pdf_url', 'arxiv_latest_revision'))
        for ident in ARXIV.findall(urls):
            if row.get('id'):
                result.setdefault(ident, set()).add(row['id'])
    return result


def export(source, reports):
    raw = source.read_text(encoding='utf-8')
    lookup = report_lookup(reports)
    anchors = list(re.finditer(r'<a id="([^"]+)"\s*></a>', raw))
    books, audit_entries, empty_anchors = {}, [], []
    category = subsection = ''
    for i, marker in enumerate(anchors):
        ident = marker.group(1)
        end = anchors[i + 1].start() if i + 1 < len(anchors) else len(raw)
        body = raw[marker.end():end]
        heading = re.search(r'^#{1,6}\s+(.+)$', body, re.M)
        if ident.startswith('sec-'):
            category, subsection = ident, ''
            if ident in BOOKS:
                titles, topics = BOOKS[ident]
                books[ident] = {'id': ident, 'title': titles, 'topics': topics, 'chapters': []}
            continue
        if ident.startswith('sub-'):
            subsection = clean(heading.group(1)) if heading else ''
            continue
        if not ident.startswith('toc-'):
            continue
        if not heading:
            empty_anchors.append(ident)
            continue
        if category not in books:
            raise ValueError(f'Chapter {ident} has unknown topic {category}')
        title, title_basis = neutral_title(ident, heading.group(1), body)
        urls, arxivs, url_basis = source_metadata(body, ident)
        correction = None
        if ident in SOURCE_CORRECTIONS:
            amendment = SOURCE_CORRECTIONS[ident]
            correction = {
                'fromUrls': urls,
                'toUrls': amendment['urls'],
                'reason': amendment['reason'],
                'verifiedAgainst': amendment['verifiedAgainst'],
                'verifiedOn': amendment['verifiedOn'],
            }
            urls = list(amendment['urls'])
            # Associations use only corrected identities; stale identifiers
            # must not survive in either the public mapping or audit evidence.
            arxivs = sorted(set(ARXIV.findall(' '.join(urls))))
            url_basis = 'audited-source-correction'
        related = sorted({report for arxiv in arxivs for report in lookup.get(arxiv, [])})
        if ident in REPORT_EXCLUSIONS:
            related = []
        chapter = {'id': ident, 'title': title, 'section': SECTIONS.get(subsection, subsection), 'sourceUrls': urls, 'reportIds': related}
        assert set(chapter) == RUNTIME_FIELDS
        books[category]['chapters'].append(chapter)
        audit_entries.append({
            'id': ident, 'book': category,
            'source_line': raw[:marker.start()].count('\n') + 1,
            'title_basis': title_basis, 'source_basis': url_basis,
            'arxiv_ids': arxivs, 'source_url_count': len(urls),
            'report_ids': related,
            **({'source_correction': correction} if correction else {}),
            **({'report_exclusion': REPORT_EXCLUSIONS[ident]} if ident in REPORT_EXCLUSIONS else {}),
        })
    payload = {'schemaVersion': 1, 'books': list(books.values())}
    entries = [e for book in payload['books'] for e in book['chapters']]
    ids = [e['id'] for e in entries]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate source chapter IDs')
    source_count = len(re.findall(r'^###\s+', raw, re.M))
    if len(entries) != source_count:
        raise ValueError(f'Source has {source_count} chapter headings, export has {len(entries)}')
    public = json.dumps(payload, ensure_ascii=False)
    for forbidden in ('file://', 'linked-docs/', 'foundation_notes/', 'larkoffice.com', 'feishu.cn', 'bytetech.info', 'D:/', 'D:\\', 'C:/', 'C:\\'):
        if forbidden in public:
            raise ValueError(f'Private-data gate failed: {forbidden}')
    audit = {
        'schema_version': 1,
        'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'reports_sha256': hashlib.sha256(reports.read_bytes()).hexdigest(),
        'exporter_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'source_count': source_count, 'export_count': len(entries), 'book_count': len(books),
        'linked_count': sum(bool(e['sourceUrls']) for e in entries),
        'unlinked_count': sum(not e['sourceUrls'] for e in entries),
        'associated_chapter_count': sum(bool(e['reportIds']) for e in entries),
        'source_correction_count': sum('source_correction' in e for e in audit_entries),
        'book_counts': {book['id']: len(book['chapters']) for book in books.values()},
        'empty_anchors': empty_anchors,
        'claim_scope': 'Metadata catalog; source URLs extracted locally, not independently revalidated online. No paper conclusions exported.',
        'guide_impact': 'no material change',
        'entries': audit_entries,
    }
    return payload, audit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('source', 'reports', 'output', 'audit'):
        parser.add_argument('--' + name, required=True, type=Path)
    args = parser.parse_args()
    if args.output.resolve() in {args.source.resolve(), args.reports.resolve()} or args.audit.resolve() in {args.source.resolve(), args.reports.resolve()}:
        parser.error('Outputs must not overwrite inputs')
    payload, audit = export(args.source, args.reports)
    for path, data in ((args.output, payload), (args.audit, audit)):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: audit[key] for key in ('book_count', 'source_count', 'export_count', 'linked_count', 'unlinked_count', 'associated_chapter_count')}, ensure_ascii=False))


if __name__ == '__main__':
    main()
