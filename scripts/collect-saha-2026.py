#!/usr/bin/env python3
"""Collect public SAHA 2026 directory facts; raw HTML stays outside the repository.
Usage: python scripts/collect-saha-2026.py --cache /absolute/scratch/cache
No images, logos or descriptive marketing text are copied to publication data.
"""
import argparse, concurrent.futures, datetime, hashlib, html, json, re, urllib.request
from pathlib import Path
BASE='https://sahaexpo.com/en/exhibitors'
# Supplemental links were read with the web retrieval tool at this time; a cached rerun does not recheck them.
SUPPLEMENTAL_CHECKED_AT='2026-11-12T07:02:23+09:00'
def now(): return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).isoformat(timespec='seconds')
def plain(s): return ' '.join(html.unescape(re.sub('<[^>]+>',' ',s)).split())
def field(block, cls, tag='div'):
    m=re.search(r'<'+tag+r'[^>]*class="'+re.escape(cls)+r'"[^>]*>(.*?)</'+tag+r'>',block,re.S)
    return plain(m.group(1)) if m else ''
def parse(body):
    entries=[]
    for m in re.finditer(r'<a\s+href="([^"]+)"\s+class="exhibitor-card"[^>]*>(.*?)</a>',body,re.S):
        url,block=html.unescape(m.group(1)),m.group(2)
        loc=field(block,'exhibitor-card-location')
        cats=[plain(x) for x in re.findall(r'<span class="exhibitor-card-cat-tag">(.*?)</span>',block,re.S)]
        more=field(block,'exhibitor-card-cat-more','span')
        entries.append({'url':url,'name':field(block,'exhibitor-card-name','h3'),'country':field(block,'exhibitor-card-country'),'categories':cats,'hiddenCategoryCount':int(more[1:]) if more.startswith('+') else 0,'location':loc})
    text=plain(body)
    counts=re.search(r'Showing\s+(\d+)\s+to\s+(\d+)\s+of\s+([\d,]+)\s+results',text)
    links=[int(x) for x in re.findall(r'aria-label="Go to page (\d+)"',body)]
    return entries,tuple(int(x.replace(',','')) for x in counts.groups()) if counts else None,max(links,default=1)
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--cache',required=True);ap.add_argument('--output',default='data/v2/collection/saha-2026.json');args=ap.parse_args()
    cache=Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
    def fetch(page):
        url=BASE if page==1 else BASE+'?page='+str(page)
        p=cache/f'page-{page:03}.html';m=cache/f'page-{page:03}.meta.json'
        if p.exists() and m.exists():return page,p.read_text(),json.loads(m.read_text())
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'FIELDNOTE-public-directory-research/2.0'}),timeout=35) as resp:
                raw=resp.read();code=resp.status;actual=resp.url
            meta={'url':url,'finalUrl':actual,'statusCode':code,'acquiredAt':now(),'sha256':hashlib.sha256(raw).hexdigest()}
            body=raw.decode('utf-8');p.write_text(body);m.write_text(json.dumps(meta));return page,body,meta
        except Exception as e:return page,None,{'url':url,'acquiredAt':now(),'error':str(e)}
    first=fetch(1)
    if not first[1]:raise RuntimeError(first[2])
    _,firstcount,last=parse(first[1]);assert firstcount and last>1
    pages=[first]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
        for p in ex.map(fetch,range(2,last+1)):
            pages.append(p)
            if p[0]%10==0 or not p[1]:print('Downloaded',p[0], 'ok' if p[1] else p[2]['error'],flush=True)
    units=[];entries=[];failed=[];totals=set();seen=set()
    for page,body,meta in sorted(pages):
        if not body:
            failed.append(str(page));units.append({'id':f'saha2026-page-{page}','kind':'page','url':meta['url'],'status':'blocked','rawEntryCount':0,'error':meta['error']});continue
        rows,counts,_=parse(body)
        if counts:totals.add(counts[2])
        assert 'SAHA 2026' in body and '<h1' in body and rows
        units.append({'id':f'saha2026-page-{page}','kind':'page','url':meta['url'],'status':'collected','firstLabel':rows[0]['name'],'lastLabel':rows[-1]['name'],'rawEntryCount':len(rows),'reportedRange':list(counts) if counts else None,'acquiredAt':meta['acquiredAt'],'sha256':meta['sha256']})
        for index,row in enumerate(rows,1):
            slug=row['url'].rstrip('/').split('/')[-1];eid='saha-2026-directory-'+slug
            assert eid not in seen,(eid,page)
            seen.add(eid)
            loc=row['location'];hall=re.search(r'Hall\s+([^|]+)',loc);stand=re.search(r'Stand\s+(.+)',loc)
            entries.append({'id':eid,'sourceId':'src-saha-2026-directory','sourceLocator':f'page {page}, row {index}','rawName':row['name'],'boothCodes':[stand.group(1).strip()] if stand else [],'hall':hall.group(1).strip() if hall else None,'country':row['country'],'profileUrl':row['url'],'rawLocation':loc,'rawCategories':row['categories'],'additionalCategoryCount':row['hiddenCategoryCount'],'participationStatus':'listed','relevance':{'status':'pending','reason':'업체 상세의 차량 적용 연결 검토 전','categories':[]},'evidence':[]})
    complete=not failed and len(totals)==1 and len(entries)==firstcount[2]
    alphabet=re.findall(r'href="(https://sahaexpo.com/en/exhibitors\?letter=([A-Z]))"',first[1])
    filters=[]
    for name,inner in re.findall(r'<select[^>]*name="([^"]+)"[^>]*>(.*?)</select>',first[1],re.S):
        filters.append({'field':name,'options':[{'value':v,'label':plain(t)} for v,t in re.findall(r'<option\s+value="([^"]*)"[^>]*>(.*?)</option>',inner,re.S)]})
    source={'id':'src-saha-2026-directory','url':BASE,'title':'Exhibitor List | SAHA 2026','publisher':'SAHA EXPO Fair Services Inc.','role':'organizer_directory','edition':'2026','editionStatus':'confirmed','accessStatus':'accessible','coverageScope':'full_directory','acquiredAt':first[2]['acquiredAt'],'sha256':first[2]['sha256'],'rights':{'status':'link_only','notes':'Terms of Use §4 restricts reproduction of site content. Original HTML, logos and images are not redistributed; only factual company/stand identifiers and source links are retained.','url':'https://sahaexpo.com/en/terms-of-use'}}
    data={'schemaVersion':1,'eventId':'saha-2026','checkedAt':now(),'sources':[source],'collection':{'status':'complete' if complete else 'partial','complete':complete,'expectedTotal':firstcount[2],'units':units,'missingRanges':failed,'notes':'Completeness refers only to the currently published official directory, not physical attendance, legal-entity resolution or relevance review. Full unfiltered pagination covers numeric, A–Z and non-Latin names. Card categories may be truncated; remaining profile categories not yet collected.','alphabetIndex': [{'label':l,'url':u,'coverage':'included_in_unfiltered_pagination'} for u,l in alphabet],'categoryFilters':filters},'entries':entries,'maps':[],'queues':[{'id':'saha-2026-profile-review','stage':8,'reason':'Directory collected; relevance and hidden profile categories not reviewed.','nextAction':'Review all collected directory identities in source order, full categories, vehicle-application evidence, brands/subsidiaries/distributors; mark relevance separately.','missingRange':f'all {len(entries)} directory profiles'},{'id':'saha-2026-map-source','stage':8,'reason':'No verified official floor-plan file linked in inspected directory. Booth labels are not geometry.','nextAction':'Follow official exhibition-information/media-center/show-daily to locate edition-specific floor plans; record map dimensions/rights and inspect before coordinates.','missingRange':'all halls and outdoor zones'},{'id':'saha-2026-exhibit-analysis','stage':8,'reason':'List registration is not product exhibit or observed attendance evidence.','nextAction':'Verify actual attendance, specific exhibits, photos and catalogs, source independence and company-specific development interpretation.','missingRange':'all companies'}]}
    # Full directory extraction is not proof of the complete physical event population.
    data['collection']['populationComplete']=False
    data['collection']['populationExpectedTotal']=None
    data['collection']['populationCompletenessReason']='Current directory count differs from the official 1700+ pre-show claim; reconcile post-show participant definitions before an overall completion percentage.'
    data['collection']['mapStatus']='not_acquired'
    extras=[
        ('terms','https://sahaexpo.com/en/terms-of-use','Terms of Use','guide',None),
        ('information','https://sahaexpo.com/en/exhibition-information','Exhibition Information | SAHA 2026','guide',None),
        ('media','https://sahaexpo.com/en/media-center','Media Center | SAHA 2026','guide',None),
        ('brochure','https://sahaexpo.com/storage/media/dosyalar/SAHA-EXPO-2026-Brosur.3tr.pdf','SAHA 2026 Brochure (Turkish)','guide',8),
        ('brief','https://sahaexpo.com/storage/media/dosyalar/SAHA-2026_Kisa-Tanitim.pdf','SAHA 2026 Brief Introduction (Turkish)','guide',1),
        ('postshow','https://sahaexpo.com/storage/media/dosyalar/SAHA-EXPO-Postshow-Report-2026-En.pdf','SAHA EXPO 2026 Post-Show Report','guide',40),
        ('daily','https://sahaexpo.com/en/show-daily','SAHA 2026 Show Daily index','guide',None),
        ('daily1','https://sahaexpo.com/showday/saha-day-1.pdf','SAHA 2026 official show daily Day 1','guide',32)
    ]
    for key,url,title,scope,pagecount in extras:
        data['sources'].append({'id':'src-saha-2026-'+key,'url':url,'title':title,'publisher':'SAHA EXPO / GBP for show daily','role':'organizer_linked_document','edition':'2026','editionStatus':'confirmed','accessStatus':'accessible','coverageScope':scope,'acquiredAt':SUPPLEMENTAL_CHECKED_AT,'rights':{'status':'link_only','notes':'Source checked through official index/page. No redistribution permission established; original not copied to repository.'},'pageCount':pagecount,'inspectionScope':'Web source text/metadata; not full manual visual review of all PDF pages.'})
    data['queues'][1]['nextAction']='Official directory, exhibition-information, media-center and show-daily indexes inspected. Review the 40-page post-show report and 2026 daily PDFs for a usable official floor plan, or obtain organizer map; no geometry is currently verified.'
    out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'pages':len(units),'entries':len(entries),'complete':complete,'totals':sorted(totals),'failed':failed,'last':entries[-1]['rawName']},ensure_ascii=False),flush=True)
if __name__=='__main__':main()
