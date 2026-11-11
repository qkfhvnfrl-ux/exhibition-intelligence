#!/usr/bin/env python3
"""Extract factual BDSV IDEX 2025 names/booths from a previously downloaded HTML.

Usage: python scripts/collect-idex-bdsv.py /path/to/bdsv.html
Does not contact the network, reproduce descriptions/logos, or infer participation.
"""
import collections
import hashlib
import html
import json
from pathlib import Path
import re
import sys


def extract(path):
    raw = Path(path).read_bytes()
    source = raw.decode('utf-8')
    if '<title>IDEX 2025 – BDSV Exhibitor directory</title>' not in source:
        raise ValueError('Expected BDSV IDEX 2025 title is missing; inspect edition first')
    rows = []
    for block in source.split('<div class="exhibitor-data">')[1:]:
        name = re.search(r'<div class="name">\s*<a href="([^"]+)">(.*?)</a>', block, re.S)
        booth = re.search(r'<div class="booth">Booth:\s*(.*?)</div>', block, re.S)
        if not name or not booth:
            raise ValueError('Unparsed exhibitor block; do not silently lose a row')
        link = name.group(1)
        if not re.fullmatch(r'/show/idex-2025/\d+', link):
            raise ValueError('Unexpected profile path: ' + link)
        rows.append({
            'id': 'listing-idex-2025-bdsv-' + link.rsplit('/', 1)[1],
            'rawName': html.unescape(name.group(2)).strip(),
            'profileUrl': 'https://bdsv-exhibitions.eu' + link,
            'boothCodes': [html.unescape(booth.group(1)).strip()],
        })
    if len({x['id'] for x in rows}) != len(rows):
        raise ValueError('Duplicate profile ids')
    filters = re.findall(r'<input[^>]*name="iframe_search_form\[filterAz\]"[^>]*>', source)
    alpha = []
    for field in filters:
        value = re.search(r'value="([^"]*)"', field).group(1)
        key = value.replace('FILTER_', '')
        label = {'': 'All', 'NUM': '0-9'}.get(key, key)
        count = len(rows) if label == 'All' else sum(
            (x['rawName'][0].isdigit() if label == '0-9' else x['rawName'][0].upper() == label)
            for x in rows)
        disabled = 'disabled=' in field
        if label != 'All' and disabled != (count == 0):
            raise ValueError('All-view rows disagree with alphabet filter: ' + label)
        alpha.append({'label': label, 'disabled': disabled, 'rawEntryCount': count})
    if [x['label'] for x in alpha] != ['All', '0-9', *'ABCDEFGHIJKLMNOPQRSTUVWXYZ']:
        raise ValueError('Missing alphabet controls')
    if re.search(r'rel=["\']next|class=["\'][^"\']*pagination', source, re.I):
        raise ValueError('Pagination found; do not claim this All-view is complete')
    return {'sourceSha256': hashlib.sha256(raw).hexdigest(), 'rawEntryCount': len(rows),
            'distinctProfileCount': len({x['profileUrl'] for x in rows}),
            'distinctBoothCount': len({b for x in rows for b in x['boothCodes']}),
            'alphabetCoverage': alpha, 'rows': rows}


if __name__ == '__main__':
    print(json.dumps(extract(sys.argv[1]), ensure_ascii=False, indent=2))
