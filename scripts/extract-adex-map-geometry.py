"""Reproduce visually reviewed regions from the pinned, externally hosted ADEX map.

Usage: python scripts/extract-adex-map-geometry.py ORIGINAL.pdf OUTPUT.json
Requires PyMuPDF. This reads the original; it does not redistribute the map.
Drawing indices are stable ONLY for the exact SHA-256 checked below.
"""
import hashlib
import json
import sys
from pathlib import Path
from adex_number_correction import apply_number_correction

import fitz

EXPECTED = 'fd0bcbaa88705c683f28b8e2effe94fd749fa12fd654f11287b17025db688dde'
MAP_URL = 'https://adex.bciaerospace.com/images/pdf/SEOUL_ADEX_FLOOR_PLAN_EN.pdf'
PEI_URL = 'https://www.prnewswire.com/apac/news-releases/pei-genesis-to-exhibit-at-seoul-adex-2025-in-korea-302572565.html'
CHECKED = '2026-11-12T07:00:00+09:00'
SOURCE = 'src-adex-2025-floorplan-20251011'
DOC = 'map-adex-2025-kintex-20251011-p1'

# Indices refer to original PDF vector rectangles. Company labels were read
# from full-page and enlarged original renders, independently of OCR.
REGIONS = [
    (572, 7, 'pei-genesis', ['PEI-GENESIS']),
    (275, 10, 'hyundai-north', ['Hyundai Rotem', 'Hyundai WIA', 'Kia']),
    (273, 10, 'hyundai-south', ['Hyundai Rotem', 'Hyundai WIA', 'Kia']),
    (269, 10, 'lig-north', ['LIG Nex1']),
    (274, 10, 'lig-south', ['LIG Nex1']),
    (283, 9, 'hanwha-north', ['Hanwha Aerospace', 'Hanwha Systems', 'Hanwha Ocean', 'Satrec Initiative']),
    (281, 9, 'hanwha-south', ['Hanwha Aerospace', 'Hanwha Systems', 'Hanwha Ocean', 'Satrec Initiative']),
    (285, 9, 'snt', ['SNT Dynamics', 'SNT Motiv']),
    (248, 9, 'stx-engine', ['STX ENGINE']),
    (247, 9, 'yeonhab', ['YEONHAB PRECISION']),
    (256, 9, 'amphenol', ['Amphenol']),
    (355, 9, 'glenair', ['Glenair Korea']),
    (318, 10, 'aselsan', ['ASELSAN']),
    (317, 10, 'seedcore', ['Seedcore Abaco Systems']),
    (310, 10, 'quantum-aero', ['QUANTUM AERO']),
    (278, 10, 'rfcore', ['RFcore']),
    (286, 10, 'woori-byul', ['Woori Byul']),
    (307, 10, 'i3system', ['i3 system']),
    (265, 10, 'hyowon-power', ['Hyowon Power Tech']),
    (259, 10, 'vitzrocell', ['VITZ ROCELL']),
    (289, 10, 'ksep', ['KSEP']),
    (312, 10, 'funzin', ['Funzin']),
    (295, 10, 'firstec', ['FIRSTEC']),
    (291, 9, 'huneed', ['Huneed Technologies']),
    (287, 9, 'wb-group', ['WB Group']),
    (309, 9, 'dn-solutions', ['DN Solutions']),
    (253, 9, 'hankuk-carbon', ['HANKUK CARBON']),
    (250, 9, 'eo-system', ['EO SYSTEM']),
    (304, 9, 'leonardo', ['Leonardo Spa']),
    (313, 10, 'kencoa', ['Kencoa Aerospace']),
    (246, 10, 'dasan', ['DASAN MACHINERIES']),
    (290, 9, 'poongsan', ['POONGSAN']),
]

def build(pdf_path):
    raw = Path(pdf_path).read_bytes()
    if hashlib.sha256(raw).hexdigest() != EXPECTED:
        raise ValueError('Map bytes changed: re-review every label and geometry before use')
    pdf = fitz.open(pdf_path)
    page = pdf[0]
    assert len(pdf) == 1 and page.rotation == 0
    width, height = page.rect.width, page.rect.height
    drawings = page.get_drawings()
    booths = []
    for index, hall, suffix, names in REGIONS:
        drawing = drawings[index]
        assert len(drawing['items']) == 1 and drawing['items'][0][0] == 're'
        rect = drawing['items'][0][1]
        x0, y0, x1, y1 = [float(x) for x in rect]
        coords = [[round(x/width, 8), round(y/height, 8)] for x, y in
                  [(x0,y0),(x1,y0),(x1,y1),(x0,y1),(x0,y0)]]
        pei = suffix == 'pei-genesis'
        booths.append({
            'id': 'adex-2025-region-' + suffix, 'eventId': 'adex-2025',
            'code': '18-20' if pei else None,
            'sourceId': SOURCE, 'documentId': DOC, 'hall': str(hall),
            'companies': [{'rawName': n} for n in names],
            'numberStatus': 'confirmed' if pei else 'unverified',
            'numberVerification': {
                'status': 'single_source_exhibitor_announcement' if pei else 'not_printed_on_map',
                'sourceUrl': PEI_URL if pei else None,
                'note': '18-20 is one announced range; not inferred as three separate booths.' if pei
                        else 'Internal region ID is not an official booth number.'},
            'geometryStatus': 'verified',
            'geometry': {'type': 'Polygon', 'coordinates': coords,
                         'coordinateSpace': 'normalized_original', 'page': 1},
            'verification': {
                'method': 'vector_and_visual_crosscheck', 'reviewedAt': CHECKED,
                'vectorDrawingIndex': index, 'originalBoundsPt': [round(x,6) for x in rect],
                'notes': 'Original enlarged labels + PDF vector rectangle; no OCR-only coordinates. '
                         'Pre-event plan location only, not surveyed onsite placement. '
                         'Separate repeated blocks remain separate map regions; shared labels link each named organization.',
                'evidenceUrls': [MAP_URL] + ([PEI_URL] if pei else []),
                'independentGeometryEvidence': False},
        })
    result = {
        'schemaVersion': 1, 'eventId': 'adex-2025', 'checkedAt': CHECKED,
        'sources': [{
            'id': SOURCE, 'url': MAP_URL, 'title': 'Seoul ADEX 2025 Floor Plan',
            'publisher': 'Seoul ADEX BtoB / advanced business events', 'role': 'official_map',
            'edition': 2025, 'editionStatus': 'confirmed', 'accessStatus': 'accessible',
            'coverageScope': 'map', 'acquiredAt': CHECKED, 'sha256': EXPECTED,
            'rights': {'status': 'link_only', 'notes': 'Publicly accessible official PDF; no open redistribution licence identified. Original and crops are not committed.'}
        }, {
            'id': 'src-adex-2025-pei-announcement', 'url': PEI_URL,
            'title': 'PEI-Genesis to Exhibit at Seoul ADEX 2025 in Korea',
            'publisher': 'PEI-Genesis via PR Newswire', 'role': 'exhibitor_announcement',
            'edition': 2025, 'editionStatus': 'confirmed', 'accessStatus': 'accessible',
            'coverageScope': 'subset', 'acquiredAt': CHECKED,
            'rights': {'status':'link_only','notes':'Issuer-provided announcement; syndication is not independent verification.'}
        }],
        'documents': [{
            'id': DOC, 'eventId': 'adex-2025', 'sourceId': SOURCE,
            'url': MAP_URL, 'title': 'Seoul ADEX 2025 Floor Plan', 'edition': 2025,
            'venue': 'KINTEX Exhibition Center 2, Goyang, South Korea',
            'halls': ['7','8','9','10'], 'floor': None, 'outdoorAreas': [], 'page':1,
            'publishedAt': None, 'revisionAt': '2025-10-11',
            'revisionBasis': 'PDF title 25.10.11 and embedded creation/modification metadata; not a separately published revision notice.',
            'original': {'width': width, 'height': height, 'unit':'pt','rotation':0},
            'crop': {'x':0,'y':0,'width':1,'height':1},
            'rights': {'status':'link_only','notes':'Link to official original; reproduction/embedding permission not established.'},
            'localPath': None, 'planStatus':'pre_event_plan',
            'verification': {'status':'document_verified','notes':'Title/year/hall labels visually checked. Not an as-built survey. Onsite photographs verify some exhibitor presence only, not every boundary or unprinted booth number.'},
            'sha256': EXPECTED, 'originalBytes': len(raw), 'pageCount':1,
            'renderVerification': {'fullPagePixels':[2400,1698],'detailScale':3,'peiDetailScale':10,
                                   'originalTextExtraction':'empty_outline_text','ocrUsedForGeometry':False}
        }],
        'booths': booths,
        'onsiteCrosschecks': [
            {'companies':['Hyundai Rotem'], 'sourceUrl':'https://www.nurphoto.com/photo/12888707',
             'observedDate':'2025-10-20','kind':'observation','supports':'booth presence at ADEX 2025, independent event photograph caption',
             'doesNotSupport':['official booth number','exact plan geometry','all shared-company participation'],
             'rights':'link_only; licensed editorial photograph; no image copied'},
            {'companies':['STX ENGINE'], 'sourceUrl':'https://www.nurphoto.com/photo/12888697',
             'observedDate':'2025-10-20','kind':'observation','supports':'booth presence at ADEX 2025, independent event photograph caption',
             'doesNotSupport':['official booth number','exact plan geometry'],
             'rights':'link_only; licensed editorial photograph; no image copied'}],
        'limitations': ['Only 32 individually reviewed regions have geometry; remaining labels stay unlocated until reviewed.',
                         'Only PEI-GENESIS has an announcement-backed booth code here; others remain null.',
                         'Map background redistribution/embedding rights unresolved: stage 3 must keep official-source fallback.',
                         'No corrected event-day floorplan obtained; two onsite photo checks do not confirm as-built geometry.']
    }
    return apply_number_correction(result)

if __name__ == '__main__':
    result = build(sys.argv[1])
    Path(sys.argv[2]).write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    print(f"Verified {len(result['booths'])} map regions from pinned original bytes")
