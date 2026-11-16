import test from 'node:test';
import assert from 'node:assert/strict';
import {companyPhotoStatus,sortCompaniesByPhotos,companyPanelMarkup} from '../src/v2/details.js';
import {searchCompanies} from '../src/v2/data.js';

function fixture() {
  const photos = [
    {id:'field',context:'event',eventId:'eurosatory-2026',src:'assets/field.jpg'},
    {id:'reference',context:'reference',displayUrl:'https://example.org/vehicle.jpg',productIds:['vehicle']},
    {id:'linked',context:'event',src:'https://example.org/linked.jpg',rights:{status:'link_only'}},
    {id:'logo',context:'event',src:'assets/company-logo.png'},
    {id:'other-event',context:'event',eventId:'eurosatory-2024',src:'assets/older.jpg'},
    {id:'unsafe',context:'event',src:'javascript:alert(1)'},
  ];
  const company = (id,photoIds) => ({id,name:id,photoIds,productIds:[],aliases:[],categoryIds:['complete_vehicle'],boothIds:[],mapBoothIds:[]});
  return {
    event:{id:'eurosatory-2026'},photos,
    companies:[company('A empty',[]),company('B reference',['reference']),company('C field',['field']),company('D field',['field']),company('E restricted',['linked','logo','unsafe']),company('F older',['other-event'])],
    products:[{id:'vehicle',name:'Reference vehicle'}],
  };
}

test('company photo status follows rendered image eligibility and selected edition',() => {
  const data=fixture();
  assert.deepEqual(data.companies.map(company=>companyPhotoStatus(data,company).kind),['none','reference','event','event','none','reference']);
  assert.equal(companyPhotoStatus(data,data.companies[1]).label,'제품 참고사진만 있음');
  assert.equal(companyPhotoStatus(data,data.companies[2]).label,'현장사진 있음');
  assert.equal(companyPhotoStatus(data,data.companies[4]).label,'사진 미확보');
});

test('photo priority retains previous order inside each group and search/category membership',() => {
  const data=fixture(),original=[...data.companies];
  const ordered=sortCompaniesByPhotos(data,original);
  assert.deepEqual(ordered.map(company=>company.id),['C field','D field','B reference','F older','A empty','E restricted']);
  assert.deepEqual(original,data.companies);
  const matching=searchCompanies(data,{query:'field',category:'complete_vehicle'});
  assert.deepEqual(sortCompaniesByPhotos(data,matching).map(company=>company.id),['C field','D field']);
  assert.deepEqual(sortCompaniesByPhotos(data,[data.companies[3],data.companies[2]]).map(company=>company.id),['D field','C field']);
  assert.deepEqual(sortCompaniesByPhotos(data,searchCompanies(data,{category:'protection'})),[]);
});

test('a product reference image without authored narrative appears at company entry and product',() => {
  const data=fixture(),company=data.companies[1];
  company.productIds=['vehicle'];
  const html=companyPanelMarkup(data,company);
  const companyGallery=html.slice(html.indexOf('<section class="fn-company-photos">'),html.indexOf('<section class="fn-equipment-section">'));
  assert.match(companyGallery,/<img src="https:\/\/example.org\/vehicle.jpg"/);
  assert.match(companyGallery,/제품 참고사진 · 해당 회차 현장사진 아님/);
  assert.match(html.slice(html.indexOf('id="product-vehicle"')),/<img src="https:\/\/example.org\/vehicle.jpg"/);
  assert.equal(companyPhotoStatus(data,company).kind,'reference');
});

test('company reference hero prefers an exact product association over an earlier unlinked variant',() => {
  const data=fixture(),company=data.companies[1];
  company.productIds=['vehicle'];
  data.photos.unshift({id:'unlinked-variant',context:'reference',src:'assets/unlinked-variant.jpg',caption:'다른 차량 형상 참고사진'});
  company.photoIds.unshift('unlinked-variant');
  const html=companyPanelMarkup(data,company);
  const companyGallery=html.slice(html.indexOf('<section class="fn-company-photos">'),html.indexOf('<section class="fn-equipment-section">'));
  assert.ok(companyGallery.indexOf('https://example.org/vehicle.jpg')<companyGallery.indexOf('assets/unlinked-variant.jpg'));
  assert.match(companyGallery,/<figure class="fn-photo fn-photo-hero" data-photo-id="reference">/);
  assert.ok(companyGallery.includes('assets/unlinked-variant.jpg'));
});
