"""Apply reviewed numbering corrections without altering source-plan geometry.

The factual correction is tracked separately so both source collectors reproduce
it and the original stage-2 claim remains available in Git history and claims.
"""
import copy
import json
from pathlib import Path

CORRECTION = Path(__file__).resolve().parents[1] / 'data/v2/corrections/adex-2025-pei-number.json'

def apply_number_correction(data):
    correction = json.loads(CORRECTION.read_text())
    if data.get('eventId') != correction['eventId']:
        return data
    data = copy.deepcopy(data)
    known = {source['id'] for source in data.get('sources', [])}
    for source in correction['sources']:
        if source['id'] not in known:
            data.setdefault('sources', []).append(source)
    for source in data.get('sources', []):
        if source['id'] in {claim['sourceId'] for claim in correction['claims']}:
            source['originGroup'] = 'pei-official-adex2025'
    for row in data.get('entries', []):
        if row['id'] == correction['rosterEntryId']:
            row['boothCodes'] = []
            row['boothNumberStatus'] = 'conflicting_sources'
            row['numberClaims'] = correction['claims']
            row['numberCorrection'] = {'id': correction['id'], 'checkedAt': correction['checkedAt'], 'note': correction['note']}
            evidence = {'sourceId': correction['sources'][0]['id'], 'locator': 'official live-post body', 'kind': 'fact', 'claim': 'The exhibitor live post identifies Booth 7-C11 at Seoul ADEX 2025. This differs from the earlier issuer announcement 18-20; neither number has been verified against this pre-event plan geometry.', 'independentSourceCount': 1}
            if evidence not in row['evidence']:
                row['evidence'].append(evidence)
    for booth in data.get('booths', []):
        if booth['id'] == correction['regionId']:
            booth['stableBoothId'] = correction['stableBoothId']
            booth['code'] = None
            booth['numberStatus'] = 'unverified'
            booth['numberVerification'] = {'status': 'conflicting_sources', 'sourceUrl': correction['sources'][0]['url'], 'note': correction['note'], 'claims': correction['claims'], 'checkedAt': correction['checkedAt']}
    if 'queues' in data and not any(queue['id'] == correction['followup']['id'] for queue in data['queues']):
        data['queues'].append(correction['followup'])
    if data.get('limitations'):
        data['limitations'] = [note for note in data['limitations'] if not note.startswith('Only PEI-GENESIS has an announcement-backed booth code')]
        if correction['note'] not in data['limitations']:
            data['limitations'].append(correction['note'])
    return data
