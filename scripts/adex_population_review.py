"""Apply reviewed stage-4 source observations to the reproducible ADEX collection."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NEW_NAMES = ['수성정밀기계', '에이치케이씨', '픽소니어']

def apply_population_review(data):
    path = ROOT / 'data/v2/research/adex-2025/population.json'
    if not path.exists():
        return data
    review = json.loads(path.read_text())
    by_id = {e['id']: e for e in data['entries']}
    for change in review['transcriptionReview']['records']:
        row = by_id[change['entryId']]
        assert row['rawName'] == change['rawName']
        row['transcriptionStatus'] = change['to']
        row['transcriptionNote'] = change['method'] + ' ' + change['scope']
        row['transcriptionReviewedAt'] = change['checkedAt']
    for src in review['sources']:
        if src['id'] not in {s['id'] for s in data['sources']}:
            data['sources'].append({**src, 'editionStatus':'confirmed', 'accessStatus':'accessible', 'coverageScope':'subset', 'acquiredAt':review['checkedAt'], 'rights':{'status':'link_only','notes':src.get('limitations','No redistribution permission established.')}})
    for name in NEW_NAMES:
        candidate = next(c for c in review['pavilionCandidates'] if c['rawName'].replace('㈜','').strip() == name)
        entry_id = 'adex25-pavilion-' + hashlib.sha256(name.encode()).hexdigest()[:16]
        if entry_id in by_id:
            continue
        data['entries'].append({'id':entry_id,'sourceId':'population-dapa-leaflet','sourceLocator':'page 2 / DAPA integrated pavilion / '+name,'rawName':name,'boothCodes':[],'participationStatus':'listed','attendanceStatus':'unverified','relevance':{'status':'pending','reason':'기관 공동관의 제품 출품 명칭. 개별 업체 관련성·사진·분석은 검증 묶음에서 대조하며 독립 부스나 직원 현장 참가를 뜻하지 않습니다.','categories':[]},'evidence':[{'sourceId':sid,'locator':'named product listing / '+name,'kind':'observation','claim':'Product represented under '+name+' in the 2025 institutional pavilion; no independent booth location asserted.','independentSourceCount':1} for sid in candidate['sourceIds']], 'rowKind':'pavilion_constituent','entityKindHint':'company','transcriptionStatus':'visually_reviewed','boothNumberStatus':'unknown','geometryStatus':'unverified','pavilionName':'DAPA integrated pavilion'})
    data['checkedAt'] = '2026-11-12T00:00:00Z'
    data['collection']['notes'].append('Stage 4: reviewed 79 Hall 7 transcription rows and registered 3 newly resolved DAPA constituent names; full 19-company/22-item pavilion candidate list preserved in data/v2/research/adex-2025/population.json. Remaining bilingual names require identity matching before import to avoid double counting.')
    data['collection']['units'].append({'id':'adex25-dapa-pavilion-review','kind':'pavilion_subset','url':review['sources'][0]['url'],'status':'partial','rawEntryCount':19,'canonicalNewEntries':3,'scopeNote':'19 source names preserved in supplemental candidate ledger; 3 new resolved names imported. Not 19 new companies.'})
    data['queues'].append({'id':'queue-adex-2025-stage4-next','stage':4,'reason':'Verified batches are partial; 135 Hall 8 transcription rows and full directory remain open.','nextAction':'Read EXHIBITION_RESEARCH_PROTOCOL.md and latest stage4 metrics; resume Hall 8 WASCO label001, then unresolved DAPA constituents (한국씨앤오테크, 네스앤텍, 화인정밀, 데크카본, 브로던) and Patria/Finland pavilion.','missingRange':'Full 2025 directory/outdoor; 135 dense labels; unreviewed candidates; number/geometry associations; field-photo rights.'})
    supplement_path = ROOT / 'data/v2/research/adex-2025/batch2-roster.json'
    if supplement_path.exists():
        supplement = json.loads(supplement_path.read_text())
        known_sources = {s['id'] for s in data['sources']}
        for src in supplement['sources']:
            if src['id'] not in known_sources:
                data['sources'].append({**src, 'accessStatus': 'accessible', 'coverageScope': 'subset', 'acquiredAt': supplement['checkedAt']})
        known_entries = {e['id'] for e in data['entries']}
        for entry in supplement['entries']:
            if entry['id'] not in known_entries:
                data['entries'].append(entry)
        data['collection']['notes'].append('Stage 4 batch 2: six additional source-named constituents registered after exact-name and alias review. Not a complete pavilion roster.')
        data['queues'][-1]['nextAction'] = 'Resume Hall 8 SANJU OPTICAL label024; Finland pavilion other constituents and USA pavilion 37-name directory; remaining DAPA constituents. Batch2 reviewed 한국씨앤오테크, 네스앤텍, 화인정밀, 데크카본, 브로던 and Patria.'
    return data
