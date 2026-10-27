import copy
import json
from pathlib import Path
import tempfile
import unittest

from policy import ORIGIN, canonical, input_fingerprint, permitted, sha, validate_manifest
from server_manifest import export
from sync import verified_object
from transform_mirror import remote_url


def fixture():
    contents = {'index.html': b'<html>Home</html>', 'resume/index.html': b'<html>Resume</html>',
                'assets/js/minimal.js': b'/* public script */'}
    files = [{'path': name, 'bytes': len(data), 'sha256': sha(data)} for name, data in contents.items()]
    return {'schema': 1, 'origin': ORIGIN, 'release': 'one', 'files': files,
            'bytes': sum(len(data) for data in contents.values())}, contents


class MirrorTests(unittest.TestCase):
    def test_only_public_light_paths(self):
        for path in ('reading/web/a/index.html', 'cv/Yecheng_CV.pdf', 'assets/reading/a.json',
                     'assets/js/reading-sync.js', 'assets/js/site-curation.js', '../index.html',
                     '/index.html', 'writing/../secret.json', 'assets/.env',
                     'assets/config.pem', 'writing/paper.PDF'):
            with self.subTest(path=path):
                self.assertFalse(permitted(path))
        for path in ('index.html', 'writing/ppo-long-horizon/index.html', 'assets/js/minimal.js'):
            self.assertTrue(permitted(path))

    def test_manifest_rejects_invalid_digest_size_duplicate(self):
        for mutate in (lambda m: m['files'][0].update(sha256='bad'),
                       lambda m: m['files'][0].update(bytes=-1),
                       lambda m: m['files'].append(m['files'][0]),
                       lambda m: m.update(bytes=1)):
            manifest, _ = fixture()
            mutate(manifest)
            with self.assertRaises(ValueError):
                validate_manifest(manifest)

    def test_report_only_release_change_does_not_publish(self):
        manifest, _ = fixture()
        layout = {'revision': 1, 'placements': {'writing:a': 'featured'}}
        before = input_fingerprint(manifest, layout, 'code')
        manifest['release'] = 'new-reports-only'
        self.assertEqual(before, input_fingerprint(manifest, layout, 'code'))

    def test_layout_only_and_transform_changes_publish(self):
        manifest, _ = fixture()
        layout = {'revision': 1, 'placements': {'writing:a': 'featured'}}
        before = input_fingerprint(manifest, layout, 'code')
        layout['placements']['writing:a'] = 'archive'
        self.assertNotEqual(before, input_fingerprint(manifest, layout, 'code'))
        self.assertNotEqual(before, input_fingerprint(manifest, layout, 'new-code'))

    def test_verified_cache_avoids_download(self):
        manifest, contents = fixture()
        item = manifest['files'][0]
        with tempfile.TemporaryDirectory() as folder:
            cache = Path(folder)
            (cache / item['sha256']).write_bytes(contents[item['path']])
            data, downloaded = verified_object(item, cache, lambda *_: self.fail('Network used'))
            self.assertEqual(data, contents[item['path']])
            self.assertFalse(downloaded)

    def test_corrupt_cache_redownload_and_corrupt_remote_rejection(self):
        manifest, contents = fixture()
        item = manifest['files'][0]
        with tempfile.TemporaryDirectory() as folder:
            cache = Path(folder)
            (cache / item['sha256']).write_bytes(b'bad')
            with self.assertRaises(ValueError):
                verified_object(item, cache, lambda *_: b'bad')
            self.assertEqual((cache / item['sha256']).read_bytes(), b'bad')
            _, downloaded = verified_object(item, cache, lambda *_: contents[item['path']])
            self.assertTrue(downloaded)
            self.assertEqual((cache / item['sha256']).read_bytes(), contents[item['path']])

    def test_export_noop_and_failed_release_keep_published_manifest(self):
        manifest, contents = fixture()
        with tempfile.TemporaryDirectory() as folder:
            release = Path(folder) / 'release'
            site = release / 'site'
            for name, data in contents.items():
                path = site / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(data)
            source = release / 'manifest.json'
            source.write_bytes(canonical(manifest))
            state = Path(folder) / 'state.json'
            self.assertTrue(export(release, state))
            public = site / 'github-pages-sync-manifest.json'
            saved = public.read_bytes()
            self.assertFalse(export(release, state))
            manifest['files'][0]['sha256'] = '0' * 64
            source.write_bytes(canonical(manifest))
            with self.assertRaises(ValueError):
                export(release, state)
            self.assertEqual(saved, public.read_bytes())

    def test_reading_query_anchor_and_private_cv(self):
        self.assertEqual(remote_url('/reading/history/?lang=zh#today', 'index.html'),
                         ORIGIN + '/reading/history/?lang=zh#today')
        self.assertEqual(remote_url('/cv/research-paper.pdf', 'index.html'),
                         ORIGIN + '/cv/research-paper.pdf')
        with self.assertRaises(ValueError):
            remote_url('/cv/Yecheng_CV.pdf', 'index.html')


if __name__ == '__main__':
    unittest.main()
