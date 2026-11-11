#!/usr/bin/env python3
"""Rebuild the reviewed ADEX 2025 map-label collection, without scraping teasers.

Source PDF is link-only. Supply --pdf to verify its checksum before regeneration.
The full-hall scan uses 9000px renders; each row records transcription fidelity.
Labels are source observations, not a complete/deduplicated company directory.
No printed booth codes are present; this script intentionally creates no coordinates.
"""
import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECKED = "2026-11-11T22:05:00Z"
PDF_URL = "https://adex.bciaerospace.com/images/pdf/SEOUL_ADEX_FLOOR_PLAN_EN.pdf"
PDF_HASH = "fd0bcbaa88705c683f28b8e2effe94fd749fa12fd654f11287b17025db688dde"
SOURCE_ID = "src-adex-2025-floorplan-20251011"

# Reading order: small grid blocks from top to bottom/left to right, then large
# blocks. Repeated names are repeated physical blocks, not extra companies.
HALLS = {
    "7": """
Indo Defence
Korea Aerospace Industries Association
Aviation Week Network
Defense times korea
SAP Media
GLOBAL BUSINESS PRESS
COX
Uvifi
K-DEFENSE
Cheong-Yang County
Advanced Micro Devices
EUCAST
BRITESTONE
Opt-AI
Beta Force
COTS Technology
HUNAN KINGCERA ENGINEERING
NASAM
FINE KOWAC
Hanmin International
Osaka Stainless
Arion Communication
Seoltech
Altair
X-BEAM Tech
Hytec Inter Korea
HAYNES International
HITEC RCD KOREA
Smartline
INVICTUM
Beaufort
NeXber
PEI-GENESIS
Click Bond A-Tech Aviation
DAESHIN METAL
FS
Fostec
Prolangs
GNK Solutions
Green Optics
PSIONdsp
SEC
SJ Precision
ULTRONICS
HANKUK SPECIAL STEEL
SEETRON
SamTra International
IPT Wilko Aero
REALTIMEVISUAL
CTLA
BIBUS METALS KOREA
Sungjin C&T
DNB
ELMA ELECTRONIC
KCL
ALA
ACE WAVETECH
Korea Defense Guarantee Cooperative
Drive System Design
MARCH ELECTRONICS
Age Optic
Woori HQ
Woori DS
U-Tel
Millennium Optical System
JENOPTIK
ILSUNG COMPOSITES
ElectroAir OU
HYOSEONG ELECTRIC
ARS ELECTRONICS
SUNGSAN Electronics & Communications
Parkor Korea Indus
MPS bearings
Tronair Taeyang Aero
JAEWON KOREA
RF Systems
3M
Amazon Web Services
Pace
GEOSTORY
5ATZ
DeTect
WIRE MASTERS
hessed korea
D.I. OPTICAL
NCS TECHNOLOGY
YUAN High-Tech Development
Latvia
datamaker
Global Konet & Commtact
Ministry of National Defense / ROK Army / ROK Navy & Marine Corps / ROK Air Force / Defense Acquisition Program Administration (DAPA)
Korea Defense Industry Association (KDIA)
L3Harris Technologies, Inc.
Bell
General Atomics Aeronautical
Bombardier Defense
Marvin Test Solutions
Jonal Laboratories, Inc.
CBDL Corporation
Boeing
Honeywell
SDT Space and Defence Technologies
RTX
Teledyne FLIR
Fastening Systems International, Inc
S3 Aero Defense
Northrop Grumman
BAE Systems
Hydraulics International Inc.
nLIGHT
W. L. Gore & Associates
IMSAR
Microchip Technology Inc
Embraer S.A.
Teledyne e2v
New Technology Pavilion (SPACE / AAM) Korea Aerospace Industries Association
Parker Aerospace
GE Aerospace
Lockheed Martin
Moog
Edge Autonomy
Gulfstream
""",
    "8": """
WASCO
AMDA
Aeromag Asia
Asia Military
Romania
SIMTOS
DS AETHER CT
Orbit Communication System
KATRA
KAICA
KOSHIPA
COSAR
KCIA
KOFOTI
KOMERA
KORBA
Finland
ROTAC
Sky AutoNet
Quantum Systems
DIGITRON
Australia
SAMKEE ENERGY SOLUTIONS
SANJU OPTICAL
NANG MAN LAB
SENSOR VIEW
KOREA TESTING RESEARCH INSTITUTE
JIN YOUNG
Testonic
SEOIN TECH
Bosung Industry
WINUS R&A
Core teams
3C TAE YANG
ECO WITHUS
Snap-on Tools Korea
EDELTECH
SOLGE
Sj automation
Hanso Inc
NEOTECH
Nu Care
JJ F&D
Korea Agro-Fisheries & Food Trade Corp
KODUCT
Conet-sys
Madde
COMXI
Nurion
G&I SOLUTION
KS SYSTEM
NONSAN CITY
STAR NEX
WINTEK
Aidios
NAMYANG NEXMO
Chungbuk Drone. UAM
Datamaker
LAON PEOPLE
SPG
INFINIQ
Hancom Lifecare
R&M TEK
AD SYSTEM
THE PEACH
JEONBUK TECHNOPARK
Body friend
KT&C
SNT Sealing
HAN SYSTEM
UCL
UCL swift
YU RAH
Se young
QSIM PLUS
SUNK YOUNG S.T.
DEEPET
Formal Works
BNF
SN SOLUTIONS
Safe Landing
Information System
OZ RAY
FIRE KIM
EVIDENT INSPECTION
Flame-Proof Technology
Arizona Commerce
SKY ROAD
Keumgang Machinery HANMI HYDRAULIC MACHINERY
Ho-Ho-Kus
US
LabAM
Auto Tech
Duratek
Genmix Technology
WAVEPIA
MORAI
Toray Advanced Materials
Airbility
Airbus SAS
MKS Ophir
SCD SEMI CONDUCTOR DEVICES
German Aerospace Center (DLR)
CzechTrade South Korea
ZYX Technology
RAFAEL Advanced Defense Systems
KAIA (Korea Agency for Infrastructure Technology Advancement)
Korea Aerospace Administration (KASA)
Thales
GIFAS
SIBAT
Elbit Systems
RFMW
HENSOLDT
Safran E&D
MBDA
IAI
Diehl Defence
TAURUS Systems
Volz Servos
Exolaunch
Government of Alberta
Government of Quebec
REELTEC
Duksan Navcours
CSIR
IR Robot
Gigalane
SangDo Electronics
Raionrobotics
Regulus Cyber
NKC
WEDPS
KIM
Narma
JOWO System
CanLab
Chelton Limited
Nara Space Technology
Rohde & Schwarz Korea
dandan Optics
SM CNS SAMA SOUND
WIT Solutions
ETL
irken
TECHSAN ENG
MASTER-TECH INTERNATIONAL
Darwin Friction
WOOSUNG SITEK
HANGIL C&C
Visco Tec
Aero Metals Alliance
Orange Materials
Konan Technology
KTC
Augmented Knowledge
Lees Corporation
""",
    "9": """
Gyeongnam
SUOPTICS
Telcom International
MNC Solution
Amphenol
EO SYSTEM
Leonardo Spa
KYEONG IN TECH KAES
I.T. Science
POONGSAN
Huneed Technologies
KP AERO INDUSTRIES
SOLVIT System
Aero master
FIBER PRO
KPC Metal
UTG
Glenair Korea
DYMSTEC
Intelli VIX
YOUNG POONG ELECTRONICS
Netherlands Industries for Defence & Security
Taekyung Electronics
Taesang
Ansys
KRM
WB Group
YEONHAB PRECISION
DN Solutions
HANKUK CARBON
STX ENGINE
SNT Dynamics / SNT Motiv
Hanwha (Hanwha Aerospace / Hanwha Systems / Hanwha Ocean / Satrec Initiative)
KOREA AEROSPACE INDUSTRIES (KAI)
Hanwha (Hanwha Aerospace / Hanwha Systems / Hanwha Ocean / Satrec Initiative)
KOREA AEROSPACE INDUSTRIES (KAI)
""",
    "10": """
Incheon International Airport
Seongnam City
SSAB SWEDISH STEEL
ROKADI
OLZTEK
DASAN MACHINERIES
RFcore
QUANTUM AERO
Hanlym Puri-Tech
K2 KOREA
CMTECHRON
J Labs
LC-TEK
JS T&C
Shingwang Technology
Saab
Daejeon Information & Culture Industry Promotion Agency
Post X
VIRNECT
Korea Lost-wax
MATEC ELECTRONICS
SOOSAN ENS
T.B.T
NINANO COMPANY
Woori Byul
NINANO COMPANY
GIMPO CITY
i3 system
Hyowon Power Tech
VITZ ROCELL
KSEP
PRENEU
PABLO AIR
FIRSTEC
Daejeon Technopark
Funzin
Kencoa Aerospace
ASELSAN
TE Connectivity
Seedcore Abaco Systems
KD Ind. Korea Defense Industries
KOREAN AIR
Hyundai Rotem / Hyundai WIA / Kia
LIG Nex1
KOREAN AIR
Hyundai Rotem / Hyundai WIA / Kia
LIG Nex1
""",
}

SHARED = {
    "Hyundai Rotem / Hyundai WIA / Kia": ["Hyundai Rotem", "Hyundai WIA", "Kia"],
    "SNT Dynamics / SNT Motiv": ["SNT Dynamics", "SNT Motiv"],
    "Hanwha (Hanwha Aerospace / Hanwha Systems / Hanwha Ocean / Satrec Initiative)":
        ["Hanwha Aerospace", "Hanwha Systems", "Hanwha Ocean", "Satrec Initiative"],
    "Ministry of National Defense / ROK Army / ROK Navy & Marine Corps / ROK Air Force / Defense Acquisition Program Administration (DAPA)":
        ["Ministry of National Defense", "ROK Army", "ROK Navy & Marine Corps", "ROK Air Force", "Defense Acquisition Program Administration (DAPA)"],
}
PAVILIONS = {"Latvia", "Romania", "Finland", "Australia", "US", "Gyeongnam",
             "New Technology Pavilion (SPACE / AAM) Korea Aerospace Industries Association"}
INSTITUTIONS = {"Korea Aerospace Industries Association", "Cheong-Yang County", "Korea Defense Guarantee Cooperative",
    "Korea Defense Industry Association (KDIA)", "KAIA (Korea Agency for Infrastructure Technology Advancement)",
    "Korea Aerospace Administration (KASA)", "Government of Alberta", "Government of Quebec", "SIBAT", "GIFAS",
    "Arizona Commerce", "KOREA TESTING RESEARCH INSTITUTE", "Korea Agro-Fisheries & Food Trade Corp", "NONSAN CITY",
    "Chungbuk Drone. UAM", "JEONBUK TECHNOPARK", "Netherlands Industries for Defence & Security", "Seongnam City",
    "GIMPO CITY", "Daejeon Information & Culture Industry Promotion Agency", "Daejeon Technopark"}
MEDIA = {"Aviation Week Network", "Defense times korea", "SAP Media", "GLOBAL BUSINESS PRESS", "Aeromag Asia", "Asia Military"}
AMBIGUOUS = {"Click Bond A-Tech Aviation", "IPT Wilko Aero", "Tronair Taeyang Aero", "Global Konet & Commtact",
    "Keumgang Machinery HANMI HYDRAULIC MACHINERY", "SM CNS SAMA SOUND", "KYEONG IN TECH KAES", "Seedcore Abaco Systems"}
REVIEWED_LARGE = {"Ministry of National Defense / ROK Army / ROK Navy & Marine Corps / ROK Air Force / Defense Acquisition Program Administration (DAPA)",
    "Korea Defense Industry Association (KDIA)", "L3Harris Technologies, Inc.", "Bell", "General Atomics Aeronautical",
    "Bombardier Defense", "Boeing", "Honeywell", "SDT Space and Defence Technologies", "RTX", "Northrop Grumman",
    "Embraer S.A.", "Teledyne e2v", "New Technology Pavilion (SPACE / AAM) Korea Aerospace Industries Association",
    "Parker Aerospace", "GE Aerospace", "Lockheed Martin", "Moog", "Gulfstream", "PEI-GENESIS",
    "Toray Advanced Materials", "Airbility", "Airbus SAS", "MKS Ophir", "SCD SEMI CONDUCTOR DEVICES",
    "German Aerospace Center (DLR)", "CzechTrade South Korea", "ZYX Technology", "RAFAEL Advanced Defense Systems",
    "KAIA (Korea Agency for Infrastructure Technology Advancement)", "Korea Aerospace Administration (KASA)",
    "Thales", "GIFAS", "SIBAT", "Elbit Systems", "RFMW", "HENSOLDT", "Safran E&D", "MBDA", "IAI", "Diehl Defence", "TAURUS Systems"}
REVIEWED_DETAIL = {"COX","Uvifi","K-DEFENSE","Cheong-Yang County","Advanced Micro Devices","EUCAST","BRITESTONE","Opt-AI","Beta Force",
    "COTS Technology","HUNAN KINGCERA ENGINEERING","NASAM","FINE KOWAC","Hanmin International","Osaka Stainless","Arion Communication",
    "Seoltech","Altair","X-BEAM Tech","Hytec Inter Korea","HAYNES International","HITEC RCD KOREA","Smartline"}

def source(id, url, title, role, scope, edition_status="confirmed", access="accessible", **extra):
    return dict(id=id, url=url, title=title, publisher="Seoul ADEX / official linked operator", role=role,
        edition="2025", editionStatus=edition_status, accessStatus=access, coverageScope=scope,
        acquiredAt=CHECKED, rights={"status":"link_only", "notes":"Public access does not establish republication permission. Official footer reserves rights; store factual observations and source URL only."}, **extra)

def build():
    sources = [
        source(SOURCE_ID, PDF_URL, "Seoul ADEX 2025 Floor Plan — 25.10.11 revision", "official_floor_plan", "map", sha256=PDF_HASH),
        source("src-adex-2025-btob", "https://adex.bciaerospace.com/", "Seoul ADEX 2025 BtoB meetings", "official_operator", "guide"),
        source("src-adex-directory-current", "https://seouladex.sourcehere.com/search", "Seoul ADEX 2027 Digital Directory (current page)", "official_linked_directory", "full_directory", "mismatch", sha256="5e1dad5badb2944d8b1662deae3578487e8e9d6f67c3890dac336f490e77982a"),
        source("src-adex-2025-exhibitor-list", "https://seouladex.com/en/business/trade-visitor/exhibitor-list.php", "Official exhibitor list endpoint", "official_directory", "full_directory", "uncertain", "unavailable"),
        source("src-adex-2025-downloads", "https://seouladex.com/en/business/exhibitors/download.php", "Official exhibitor downloads endpoint", "official_downloads", "guide", "uncertain", "unavailable"),
        source("src-adex-2025-show-maps", "https://seouladex.com/en/business/seoul-adex/show-maps.php", "Official show maps endpoint", "official_map_index", "map", "uncertain", "unavailable"),
    ]
    sources[2]["edition"] = "2027"
    sources[2]["accessNotes"] = "HTTP 200 landing page explicitly says Seoul ADEX 2027 Digital Directory and Oct. 19–24, 2027; directory requires registration/sign-in. Search-engine 2025 snippets are stale and are not edition proof. No 2025 rows imported."
    sources[1]["accessNotes"] = "Current operator page says Oct. 20–22, 2025 at KINTEX. Its separate 2023 statistics (550 exhibitors) are NOT the 2025 denominator."
    for s in sources[3:]:
        s["accessNotes"] = "Direct HTTP fetch returned 503 Service Unavailable; web open also failed/timed out. Edition and page boundaries could not be inspected."
    pei_source=source("src-adex-2025-pei-announcement", "https://www.prnewswire.com/apac/news-releases/pei-genesis-to-exhibit-at-seoul-adex-2025-in-korea-302572565.html", "PEI-Genesis to Exhibit at Seoul ADEX 2025 in Korea", "exhibitor_announcement", "subset")
    pei_source.update(publisher="PEI-Genesis via PR Newswire",publishedAt="2025-10-02",independenceGroup="pei-genesis-adex-2025-announcement",accessNotes="Issuer announcement, not independent reporting. Pre-event planned attendance at Hall 7, booth 18-20. No onsite confirmation.")
    sources.append(pei_source)
    brochure=source("src-adex-2025-brochure-unacquired", "https://www.seouladex.com/assets/download/Seoul%20ADEX%202025%20Brochure_ENG.pdf", "2025 official English brochure URL (not acquired)", "official_brochure", "guide", "uncertain", "unavailable")
    brochure["accessNotes"]="Discovered by search index; web open timed out. PDF content, edition dates and completeness not verified; no rows imported."
    sources.append(brochure)
    sibat=source("src-adex-sibat-2025-page", "https://www.sibat.mod.gov.il/Exhibitions/SeoulAdex/Pages/default.aspx", "SIBAT ADEX SEOUL 2025 Israel Pavilion page", "official_national_pavilion", "subset")
    sibat.update(publisher="State of Israel, Ministry of Defense / SIBAT",accessNotes="Page heading says 2025, but brochure link resolves to 2023 PDF. Do not use linked 2023 booth numbers for 2025.")
    sources.append(sibat)
    wrong=source("src-adex-sibat-linked-brochure-2023", "https://www.sibat.mod.gov.il/Exhibitions/SeoulAdex/Documents/ISRAEL%20at%20ADEX%20SEOUL%202023.pdf", "ISRAEL at ADEX SEOUL 2023 (linked under 2025 page)", "official_national_pavilion_brochure", "subset", "mismatch")
    wrong.update(edition="2023",publisher="State of Israel, Ministry of Defense / SIBAT",accessNotes="All four PDF pages examined as text; cover says 2023 and Oct. 17–22. Zero rows/booth codes imported into ADEX 2025.")
    sources.append(wrong)
    entries=[]
    units=[]
    for hall, text in HALLS.items():
        names=[n.strip() for n in text.splitlines() if n.strip()]
        seen=Counter()
        for index,name in enumerate(names,1):
            seen[name]+=1
            kind="pavilion" if name in PAVILIONS else "institution" if name in INSTITUTIONS or name.startswith("Ministry of National Defense") else "media" if name in MEDIA else "organization_unresolved" if name in AMBIGUOUS else "organization"
            locator=f"page 1 / Hall {hall} / scanned label {index:03d} / occurrence {seen[name]}"
            id="adex25-maplabel-"+hashlib.sha256(f"{hall}|{name}|{seen[name]}".encode()).hexdigest()[:16]
            row=dict(id=id, sourceId=SOURCE_ID, sourceLocator=locator, rawName=name, boothCodes=[],
                participationStatus="listed", relevance={"status":"pending","reason":"Map listing alone does not establish vehicle-system relevance or onsite participation; review event-specific products and components in stage 4.","categories":[]},
                evidence=[{"sourceId":SOURCE_ID,"locator":locator,"kind":"fact","claim":"Named in the official pre-event floor plan; not proof of onsite attendance or specific equipment.","independentSourceCount":1}],
                rowKind="map_label", hall=hall, page=1, mapOccurrenceIndex=seen[name], entityKindHint=kind,
                transcriptionStatus="visually_reviewed" if hall in {"9","10"} or name in REVIEWED_LARGE|REVIEWED_DETAIL else "needs_review", boothNumberStatus="not_printed", geometryStatus="not_collected_here")
            if row['transcriptionStatus']=='needs_review':
                row['transcriptionNote']="Dense small label transcribed during full-hall visual scan/OCR comparison; individual enlarged glyph/identity review remains queued. Candidate spelling is not a verified legal name."
                row['evidence'][0]['kind']='observation'
                row['evidence'][0]['claim']='Candidate map-label transcription from the official pre-event plan; individual glyph/identity review is pending, with no onsite attendance assertion.'
            if name in SHARED:
                row["listedOrganizations"]=SHARED[name]
                row["entityKindHint"]="shared_label" if kind != "institution" else kind
            if name in AMBIGUOUS:
                row["identityNote"]="Multiple names may share this label; legal identity, brand/distributor relationship and split require independent checking. Do not create a merged legal company."
            if name=="PEI-GENESIS":
                row["boothCodes"]=["18-20"]
                row["boothNumberStatus"]="confirmed_single_source"
                row["attendanceStatus"]="planned"
                row["relevance"]={"status":"confirmed","reason":"군용 원형 커넥터·RF/광 인터커넥트·케이블 어셈블리의 행사 출품 계획을 업체가 발표. 차량 배선/임무장비 인터페이스 검토와 연결한다는 판단이며 해당 차량 적용·실제 출품 확정은 아님.","categories":["electrical_wiring","connectors"]}
                row["evidence"].extend([
                    {"sourceId":pei_source['id'],"locator":"issuer release, first paragraph and booth invitation","kind":"fact","claim":"Issuer announced planned ADEX 2025 attendance at booth 18-20 in Hall 7.","independentSourceCount":1},
                    {"sourceId":pei_source['id'],"locator":"planned display and company background paragraphs","kind":"interpretation","claim":"Announced military connectors and cable assemblies provide a concrete vehicle wiring/mission-interface review connection; vehicle-specific integration and onsite display remain unverified.","independentSourceCount":1}])
            entries.append(row)
        units.append({"id":f"adex25-map-page1-hall{hall}","kind":"map_hall","url":PDF_URL,"status":"complete","firstLabel":names[0],"lastLabel":names[-1],"rawEntryCount":len(names),"scopeNote":"All visible named blocks scanned/transcribed. Dense small-label fidelity remains needs_review where indicated; pavilion constituents/legal identities not expanded. Complete refers to hall scan coverage, not verified company population."})
    units.extend([
        {"id":"adex25-full-directory","kind":"directory_all_pages","url":sources[3]["url"],"status":"unavailable","rawEntryCount":0},
        {"id":"adex25-sourcehere-current","kind":"directory_edition_gate","url":sources[2]["url"],"status":"edition_mismatch","rawEntryCount":0},
        {"id":"adex25-brochure-unacquired","kind":"guide","url":brochure['url'],"status":"unavailable","rawEntryCount":0},
        {"id":"adex25-sibat-brochure-gate","kind":"pavilion_edition_gate","url":wrong['url'],"status":"edition_mismatch","rawEntryCount":0},
    ])
    missing=["All 2025 official directory alphabet/page/category boundaries are unavailable; number of pages unknown.",
        "Constituent companies inside country, association, regional and New Technology pavilions are not enumerated by this map.",
        "Outdoor, static aircraft/vehicle displays and any zones absent from the single indoor map page are not a complete population.",
        "2025 final event guide/catalogue and last-minute map revisions remain unacquired.",
        "No printed booth codes in acquired map; independent booth numbers and event-day correspondence remain unverified."]
    missing.append("Dense Hall 7/8 small-label candidates marked needs_review need individual enlarged glyph review; ambiguous stacked labels need brand/company/distributor resolution.")
    queues=[
        {"id":"queue-adex-2025-full-directory","stage":4,"reason":"Official 2025 directory inaccessible; current Sourcehere has rolled to 2027.","nextAction":"Retry official exhibitor-list/downloads pages and locate archived 2025 directory/export or official 2025 app contents; enumerate every page/alphabet/category and reconcile against map rows.","missingRange":missing[0]},
        {"id":"queue-adex-2025-pavilions","stage":4,"reason":"Map blocks are not company totals.","nextAction":"Expand each national/regional/association pavilion using its 2025 official subdirectory; retain subset scope and link each constituent to pavilion/source.","missingRange":missing[1]},
        {"id":"queue-adex-2025-identity","stage":4,"reason":"Shared and ambiguous labels need entity resolution; all relevance decisions except PEI are pending.","nextAction":"First enlarge each needs_review map label; resolve listedOrganizations and ambiguous identityNote rows without merging unrelated names; review all collected organizations for concrete vehicle-system/component connection, record exclusions with evidence.","missingRange":"All pending relevance rows, needs_review transcriptions and organization_unresolved labels."},
        {"id":"queue-adex-2025-onsite","stage":4,"reason":"Official pre-show plan is a single source; not an event-day observation.","nextAction":"Compare final guide/revision and booth photos; confirm booth codes, exhibited products, photos/catalogues and independent sources. Only then promote attendance/exhibition/deep-analysis status.","missingRange":"All onsite and product exhibition claims; independent booth codes and final map corrections."},
    ]
    return dict(schemaVersion=1,eventId="adex-2025",checkedAt=CHECKED,sources=sources,
        collection={"status":"partial","complete":False,"expectedTotal":None,"units":units,"missingRanges":missing,
            "notes":["Universe starts with the official plan, systematically reviewed across all four halls, not searches for well-known companies.",
                "Raw entries count map labels, including repeat blocks and institution/pavilion/media labels; never report it as deduplicated exhibitor count.",
                "No whole-population completion percentage is defined because total official 2025 directory was not acquired. Dense Hall 7/8 candidates are not all individually verified.",
                "Facilities (cafe, seminars, media conference rooms, delegation lounge, BtoB, prayer room, USA Pavilion meeting point, toilets) are not organizational roster rows.",
                "Source name spellings are retained (including apparent typos). Brand/legal-name normalization needs a separate evidence-backed alias relationship."]},
        entries=entries,maps=[],queues=queues)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf",type=Path)
    parser.add_argument("--check",action="store_true",help="compare generated JSON with committed collection")
    args=parser.parse_args()
    if args.pdf:
        assert hashlib.sha256(args.pdf.read_bytes()).hexdigest()==PDF_HASH,"PDF revision changed; manually re-review before import"
    data=build()
    assert len({e['id'] for e in data['entries']})==len(data['entries'])
    assert all(not e['boothCodes'] and e['relevance']['status']=='pending' for e in data['entries'] if e['rawName']!='PEI-GENESIS')
    assert [e['boothCodes'] for e in data['entries'] if e['rawName']=='PEI-GENESIS']==[['18-20']]
    assert not data['collection']['complete'] and data['collection']['expectedTotal'] is None
    path=ROOT/'data/v2/collection/adex-2025.json'
    serialized=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
    if args.check:
        assert path.read_text()==serialized,"collection differs; regenerate or inspect manual changes"
    else:
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(serialized)
    print(json.dumps({"entries":len(data['entries']),"distinctRawLabels":len({e['rawName'].casefold() for e in data['entries']}),"halls":{u['id']:u['rawEntryCount'] for u in data['collection']['units'] if u['kind']=='map_hall'},"complete":False}))

if __name__=='__main__':
    main()
