import test from 'node:test';
import assert from 'node:assert/strict';
import {companyMaterials,productMaterials,companyPhotoStatus,sortCompaniesByPhotos,companyPanelMarkup} from '../src/v2/details.js';

function fixture() {
  const company=(id,extra={})=>({id,name:id,sourceIds:[],catalogIds:[],photoIds:[],productIds:[],boothIds:[],...extra});
  return {
    event:{id:'dsei-2025',name:'DSEI',year:2025},
    companies:[company('empty'),company('profile',{profileUrls:['https://expo.example/exhibitors/profile']}),company('catalog',{catalogIds:['vehicle-a-pdf'],productIds:['vehicle-a','vehicle-b','vehicle-c']}),company('photo',{photoIds:['field']}),company('reference',{photoIds:['reference']}),company('source',{sourceIds:['maker-a']})],
    products:[{id:'vehicle-a',name:'Vehicle A',sourceIds:['maker-a']},{id:'vehicle-b',name:'Vehicle B',sourceIds:['report-b']},{id:'vehicle-c',name:'Vehicle C',sourceIds:[]}],
    catalogs:[{id:'vehicle-a-pdf',title:'Vehicle A brochure',url:'https://maker.example/a.pdf',sourceIds:['maker-a'],productIds:['vehicle-a'],rights:{status:'link_only'},scope:'general',note:'Vehicle A only'}],
    photos:[{id:'field',context:'event',eventId:'dsei-2025',src:'assets/field.jpg'},{id:'reference',context:'reference',src:'assets/reference.jpg'}],
    sources:[{id:'maker-a',title:'Vehicle A official page',url:'https://maker.example/products/a',publisher:'Maker',role:'manufacturer_product',coverageScope:'general_product',date:'2024-01-01'},{id:'report-b',title:'Vehicle B event report',url:'https://press.example/b',publisher:'Independent press',role:'independent_event_report'}],
  };
}

test('sorting keeps photographs first and separates catalog coverage from official profiles',()=>{
  const data=fixture();
  assert.deepEqual(sortCompaniesByPhotos(data,data.companies).map(company=>company.id),['photo','reference','catalog','source','profile','empty']);
  assert.equal(companyPhotoStatus(data,data.companies[2]).label,'카탈로그·제품자료 있음');
  assert.equal(companyPhotoStatus(data,data.companies[1]).label,'공식 업체정보 있음');
  assert.equal(companyPhotoStatus(data,data.companies[2]).count,0);
});

test('catalogs attach only to their product and related press is not labeled as a manufacturer',()=>{
  const data=fixture(),company=data.companies[2];
  assert.deepEqual(productMaterials(data,company,data.products[0]).map(item=>item.url),['https://maker.example/a.pdf','https://maker.example/products/a']);
  const otherProduct=productMaterials(data,company,data.products[1]);
  assert.deepEqual(otherProduct.map(item=>item.url),['https://press.example/b']);
  assert.equal(otherProduct[0].label,'관련 원문자료');
  assert.equal(otherProduct[0].association,'product');
  const fallback=productMaterials(data,company,data.products[2]);
  assert.deepEqual(fallback,[],'another product catalog must not become a company-wide fallback');
});

test('a company-wide catalog precedes generic news without claiming an exact equipment match',()=>{
  const data=fixture(),company=data.companies[2];
  company.catalogIds.push('company-catalog');
  data.catalogs.push({id:'company-catalog',title:'Maker product range',url:'https://maker.example/range.pdf',productIds:[],sourceIds:[],scope:'general',rights:{status:'link_only'}});
  const rows=productMaterials(data,company,data.products[1]);
  assert.deepEqual(rows.map(item=>item.url),['https://maker.example/range.pdf']);
  assert.equal(rows[0].association,'company');
  assert.equal(rows[0].scopeLabel,'업체 공통자료 · 개별 장비 일치 미확인');
  assert.ok(!rows.some(item=>item.url==='https://maker.example/a.pdf'));
  const exact=productMaterials(data,company,data.products[0]);
  assert.ok(exact.every(item=>item.association==='product'));
  assert.ok(exact.some(item=>item.url==='https://maker.example/a.pdf'));
  data.sources.push({id:'blocked-common',url:'https://maker.example/range.pdf',accessStatus:'unavailable'});
  assert.deepEqual(productMaterials(data,company,data.products[1]).map(item=>item.url),['https://press.example/b'],'a blocked common catalog must not suppress an available evidence link');
});

test('material cards reject unsafe URLs, deduplicate official sources and keep source metadata',()=>{
  const data=fixture(),company=data.companies[5];
  company.sourceIds.push('maker-a-copy','unsafe');
  company.profileUrls=['javascript:alert(1)','data:text/html,profile'];
  data.sources.push({...data.sources[0],id:'maker-a-copy'},{id:'unsafe',url:'javascript:alert(1)',role:'manufacturer'});
  const rows=companyMaterials(data,company);
  assert.equal(rows.length,1);
  assert.equal(rows[0].publisher,'Maker');
  assert.equal(rows[0].date,'2024-01-01');
  assert.equal(rows[0].type,'product');
});

test('company material cards are immediately visible and external PDF action does not promise a local download',()=>{
  const data=fixture(),company=data.companies[2];
  const html=companyPanelMarkup(data,company);
  assert.ok(html.indexOf('class="fn-materials"')<html.indexOf('<section class="fn-company-photos">'));
  assert.match(html,/PDF 원문 열기 ↗/);
  assert.match(html,/원문 열람 링크/);
  assert.doesNotMatch(html,/download=/);
  assert.match(html,/target="_blank" rel="noopener noreferrer"/);
  const productB=html.slice(html.indexOf('id="product-vehicle-b"'),html.indexOf('id="product-vehicle-c"'));
  assert.ok(!productB.includes('https://maker.example/a.pdf'));
  assert.ok(productB.includes('https://press.example/b'));
  assert.match(companyPanelMarkup(data,company,{print:true}),/class="fn-print-url">https:\/\/maker.example\/a.pdf/);
});

test('an official profile is labeled as registration information and a generic roster stays an evidence card',()=>{
  const data=fixture(),company=data.companies[1];
  assert.equal(companyMaterials(data,company)[0].type,'profile');
  assert.match(companyMaterials(data,company)[0].scopeLabel,/실물 출품 확인 아님/);
  company.profileUrls=[];company.sourceIds=['roster'];
  data.sources.push({id:'roster',url:'https://expo.example/list',title:'Exhibitors directory',role:'official_exhibitor_directory'});
  assert.equal(companyMaterials(data,company)[0].type,'evidence');
  assert.equal(companyPhotoStatus(data,company).kind,'evidence');
});

test('blocked resources stay out of cards and explicit PDF metadata handles download endpoints',()=>{
  const data=fixture(),company=data.companies[2];
  data.catalogs[0].url='https://maker.example/download/82';data.catalogs[0].documentType='pdf';
  assert.equal(companyMaterials(data,company)[0].type,'pdf');
  data.sources.push({id:'broken-pdf',url:data.catalogs[0].url,accessStatus:'blocked'});
  assert.deepEqual(companyMaterials(data,company),[]);
  const sourceCompany=data.companies[5];
  data.sources[0].accessStatus='blocked';
  assert.deepEqual(companyMaterials(data,sourceCompany),[]);
  assert.equal(companyPhotoStatus(data,sourceCompany).kind,'none');
});

test('manufacturer illustrations remain visible without being labeled as reference photographs',()=>{
  const data=fixture(),company=data.companies[4];
  company.productIds=['vehicle-a'];
  const image=data.photos.find(photo=>photo.id==='reference');
  image.mediaType='illustration';image.productIds=['vehicle-a'];image.caption='Manufacturer vehicle diagram';
  assert.equal(companyPhotoStatus(data,company).label,'제품 참고이미지 있음');
  for(const print of [false,true]){
    const html=companyPanelMarkup(data,company,{print});
    assert.match(html,/<img src="assets\/reference.jpg"/);
    assert.match(html,/제조사 참고이미지·도해/);
    assert.match(html,/제품 참고이미지 · 해당 회차 현장사진 아님/);
    assert.doesNotMatch(html,/관련 참고사진/);
  }
  image.mediaType='photo';
  assert.equal(companyPhotoStatus(data,company).label,'제품 참고사진만 있음');
  assert.match(companyPanelMarkup(data,company),/관련 참고사진/);
});

test('a catalog-only company editorial does not claim to describe actual exhibition items',()=>{
  const data=fixture(),company=data.companies[2];
  company.editorialId='catalog-only';
  data.editorials=[{id:'catalog-only',organizationId:company.id,exhibit:{summary:'General manufacturer documents',items:[]},sourceIds:[],distinction:{},direction:{}}];
  const html=companyPanelMarkup(data,company);
  assert.match(html,/<h3>제품 참고자료<\/h3>/);
  assert.doesNotMatch(html,/<h3>이번 전시에서 보여준 것<\/h3>/);
});
