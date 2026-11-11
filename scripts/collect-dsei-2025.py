#!/usr/bin/env python3
"""Collect only the public 2025 DSEI directory, with explicit pagination checks.

Requires Python 3 and lxml. Raw copyrighted HTML is kept in --cache (outside
the repository); only factual rows, source hashes and coverage are published.
Usage: python scripts/collect-dsei-2025.py --cache /tmp/dsei-2025 [--fetch]
Without --fetch, use dsei-N.html and dsei-fetch-log.json from an earlier run.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import urllib.request
from urllib.parse import urljoin
from lxml import html

BASE = 'https://www.dsei.co.uk/visit/exhibiting-companies'
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--cache', type=Path, required=True)
parser.add_argument('--fetch', action='store_true')
args = parser.parse_args()
args.cache.mkdir(parents=True, exist_ok=True)
now = lambda: datetime.now(timezone.utc).isoformat()

def get_page(page):
    url = BASE + f'?page={page}&azLetterField='
    with urllib.request.urlopen(url, timeout=60) as response:
        raw = response.read()
        final = response.url
        status = response.status
    (args.cache / f'dsei-{page}.html').write_bytes(raw)
    return {'page': page, 'url': url, 'finalUrl': final, 'status': status,
            'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(), 'fetchedAt': now()}

if args.fetch:
    log = [get_page(1)]
    first = html.fromstring((args.cache / 'dsei-1.html').read_bytes())
    last = first.xpath('//a[@element="last"]/@data-page')
    if not last:
        raise ValueError('No explicit last-page proof; review the current HTML before collecting.')
    for page in range(2, int(last[0]) + 1):
        log.append(get_page(page))
    (args.cache / 'dsei-fetch-log.json').write_text(json.dumps(log, indent=2) + '\n')
log = json.loads((args.cache / 'dsei-fetch-log.json').read_text())
entries, sources, units, trees = [], [], [], []
for source in sorted(log, key=lambda x: x['page']):
    page = source['page']
    raw = (args.cache / f'dsei-{page}.html').read_bytes()
    assert hashlib.sha256(raw).hexdigest() == source['sha256'], f'Raw hash mismatch page {page}'
    tree = html.fromstring(raw)
    trees.append(tree)
    assert tree.xpath('//h1[contains(normalize-space(.),"2025 Exhibiting Companies")]'), 'Wrong edition'
    source_id = f'src-dsei-2025-directory-p{page}'
    sources.append({'id': source_id, 'url': source['url'],
                    'title': f'2025 Exhibiting Companies — page {page}', 'publisher': 'DSEI / Clarion Events',
                    'role': 'organizer_directory', 'edition': '2025', 'editionStatus': 'confirmed',
                    'accessStatus': 'accessible', 'coverageScope': 'full_directory',
                    'acquiredAt': source['fetchedAt'], 'sha256': source['sha256'],
                    'rights': {'status': 'link_only', 'notes': 'No reuse licence established on public directory/footer. Original HTML, logos, photos and descriptions are not republished; retain factual identifiers and source links.'},
                    'editionEvidence': 'Body h1: 2025 Exhibiting Companies; global header logo is 2027.',
                    'byteCount': source['bytes'], 'independenceGroup': 'dsei-official-directory-2025'})
    cards = tree.xpath('//li[@data-content-i-d and contains(@class,"m-exhibitors-list__items__item")]')
    # Second parser check: regex count of source IDs and title cards must agree.
    assert len(cards) == len(re.findall(rb'<li[^>]+data-content-i-d="\d+"', raw))
    page_entries = []
    for ordinal, card in enumerate(cards, 1):
        source_key = card.get('data-content-i-d')
        title = card.xpath('.//h2/a')[0]
        name = ' '.join(title.text_content().split())
        raw_stand = ' '.join(' '.join(card.xpath('.//*[contains(@class,"meta__stand")]/text()')).split())
        booth_text = re.sub(r'^Stand:\s*', '', raw_stand)
        codes = [s.strip() for s in booth_text.split(',') if s.strip()]
        profile_match = re.search(r"openRemoteModal\('([^']+)'", title.get('href', ''))
        assert profile_match, f'Missing profile locator {source_key}'
        locator = f'page={page}; row={ordinal}; li[data-content-i-d="{source_key}"]'
        entry = {'id': f'dsei-2025-official-{source_key}', 'sourceId': source_id,
                 'sourceLocator': locator, 'rawName': name, 'rawBoothText': raw_stand,
                 'boothCodes': codes, 'profileUrl': urljoin('https://www.dsei.co.uk/', profile_match[1]),
                 'participationStatus': 'listed',
                 'relevance': {'status': 'pending', 'reason': 'Official directory registration only; individual vehicle-system relevance not reviewed. Global filter categories are not company-level evidence.', 'categories': []},
                 'evidence': [{'kind': 'fact', 'sourceId': source_id, 'sourceLocator': locator,
                               'claim': 'Official directory name and any listed stand code only.',
                               'support': 'single_source', 'independenceGroup': 'dsei-official-directory-2025'}]}
        entries.append(entry)
        page_entries.append(entry)
    active = tree.xpath('//li[contains(@class,"pagination__list__item--active")]/a/@data-page')
    # Some site revisions express the active page on the link; saved source uses li.
    if not active:
        active = tree.xpath('//a[contains(@class,"--active")]/@data-page')
    next_pages = tree.xpath('//a[@element="next"]/@data-page')
    units.append({'id': f'dsei-2025-page-{page}', 'kind': 'page_all_letters', 'url': source['url'],
                  'status': 'complete', 'firstLabel': page_entries[0]['rawName'],
                  'lastLabel': page_entries[-1]['rawName'], 'rawEntryCount': len(page_entries),
                  'nextPage': int(next_pages[0]) if next_pages else None,
                  'acquiredAt': source['fetchedAt'], 'sha256': source['sha256']})
last = int(trees[0].xpath('//a[@element="last"]/@data-page')[0])
assert [u['id'] for u in units] == [f'dsei-2025-page-{p}' for p in range(1, last + 1)]
assert units[-1]['nextPage'] is None
assert all(u['nextPage'] == i + 2 for i, u in enumerate(units[:-1]))
assert len({e['id'] for e in entries}) == len(entries), 'Duplicate source card IDs across pages'
sources.extend([
    {'id': 'src-dsei-2025-directory-access-policy',
     'url': 'https://dsei25.freshdesk.com/support/solutions/articles/79000147177-why-can-t-i-receive-a-pdf-of-the-attendees-or-exhibitors-at-dsei-',
     'title': 'Why can’t I receive a PDF of the attendees or exhibitors at DSEI?',
     'publisher': 'DSEI official helpdesk', 'role': 'organizer_access_information',
     'edition': '2025', 'editionStatus': 'confirmed', 'accessStatus': 'accessible', 'coverageScope': 'guide',
     'acquiredAt': '2026-11-11', 'acquiredAtPrecision': 'date', 'publishedOrModifiedAt': '2025-09-05',
     'rights': {'status': 'link_only', 'notes': 'Helpdesk says detailed resources require verified login and no PDF/download is offered; it separately links the public company list. No login bypass attempted.'}},
    {'id': 'src-dsei-2025-post-event-report-page',
     'url': 'https://www.dsei.co.uk/about/2025-post-event-report',
     'title': '2025 Post Event Report', 'publisher': 'DSEI / Clarion Events',
     'role': 'organizer_report_landing_page', 'edition': '2025', 'editionStatus': 'confirmed',
     'accessStatus': 'accessible', 'coverageScope': 'guide', 'acquiredAt': '2026-11-11', 'acquiredAtPrecision': 'date',
     'rights': {'status': 'link_only', 'notes': 'Landing page inspected; download link redirects to current homepage in web retrieval. No original report or 2025 floorplan acquired.'}}
])
taxonomy = []
for node in trees[0].xpath('//input[@name="categories" or @name="filters.Country"]'):
    taxonomy.append({'field': node.get('name'), 'sourceValue': node.get('value'),
                     'label': ' '.join(node.getparent().text_content().split()),
                     'assignment': 'filter_option_only_not_assigned_to_entries'})
result = {'schemaVersion': 1, 'eventId': 'dsei-2025', 'checkedAt': now(),
          'sources': sources,
          'collection': {'status': 'complete', 'complete': True, 'expectedTotal': None,
                         'completionScope': 'Currently published public 2025 Exhibiting Companies directory, all-letter pagination only; not proof of all physical onsite participants.',
                         'observedRawCount': len(entries), 'uniqueSourceEntryCount': len(entries),
                         'units': units, 'missingRanges': [],
                         'notes': ['Last-page link on page 1 explicitly points to page 8; pages 1–7 each contain 250 rows and page 8 contains 4 rows with no next-page link.',
                                   'All 1,754 source card IDs are distinct. This is not a deduplicated legal-enterprise count.',
                                   'Headings and per-page source ID counts were checked independently with DOM and regex extraction.',
                                   'Directory listing and stand code do not establish onsite attendance, displayed products, or map coordinates.',
                                   'The 2027 site header does not change the explicit 2025 directory body edition.']},
          'taxonomy': taxonomy, 'entries': entries, 'maps': [],
          'queues': [{'id': 'q-dsei-2025-relevance', 'stage': 6, 'reason': 'All listed rows retained; relevance is unreviewed.',
                      'nextAction': 'Review all 1,754 source rows in page order using individual profiles and event-specific evidence, including shared components. Resolve entities/brands/distributors without merging solely by stand.', 'missingRange': 'pages 1–8 / every company relevance and corporate-identity review'},
                     {'id': 'q-dsei-2025-map', 'stage': 6, 'reason': 'No original 2025 booth-level floorplan acquired.',
                      'nextAction': 'Find organizer-authorized 2025 guide/floorplan, verify edition and reuse conditions; retain stand codes without inferred coordinates until then.', 'missingRange': 'all halls/outdoor areas, map original and page dimensions'},
                     {'id': 'q-dsei-2025-depth', 'stage': 6, 'reason': 'Directory listings are not exhibit/product evidence.',
                      'nextAction': 'Cross-check actual attendance, exhibited products and photos against event material; review analysis before marking any deep completion.', 'missingRange': 'all listed companies; product/photo/analysis verification'}]}
target = ROOT / 'data/v2/collection/dsei-2025.json'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'file': str(target), 'rows': len(entries), 'uniqueIds': len({e['id'] for e in entries}),
                  'pages': len(units), 'taxonomyOptions': len(taxonomy), 'entriesWithStand': sum(bool(e['boothCodes']) for e in entries)}, indent=2))
