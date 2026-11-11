const routes=new Set(['explore','companies','report']);
const bounded=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.min(max,Math.max(min,Number(value))):fallback;
const text=(value,max=160)=>String(value||'').slice(0,max);
export const DEFAULT_STATE=Object.freeze({route:'explore',event:'adex-2025',q:'',category:'',area:'all',company:'',booth:'',mode:'2d',view:{x:.5,y:.5,z:1},photo:'',compare:[],tour:'',step:0});
export function parseState(hash=''){
 const [path,query='']=String(hash).replace(/^#/,'').split('?');const p=new URLSearchParams(query);
 return {...DEFAULT_STATE,route:routes.has(path)?path:'explore',event:text(p.get('event'))||'adex-2025',q:text(p.get('q')),category:text(p.get('category')),area:text(p.get('area'))||'all',company:text(p.get('company')),booth:text(p.get('booth')),mode:p.get('mode')==='3d'?'3d':'2d',view:{x:bounded(p.get('x')??.5,-.15,1.15,.5),y:bounded(p.get('y')??.5,-.15,1.15,.5),z:bounded(p.get('z')??1,.75,20,1)},photo:text(p.get('photo')),compare:[...new Set((p.get('compare')||'').split(',').filter(Boolean))].slice(0,4),tour:text(p.get('tour')),step:Math.floor(bounded(p.get('step')??0,0,10000,0))};
}
export function serializeState(s){
 const p=new URLSearchParams();p.set('event',s.event||'adex-2025');
 for(const key of ['q','category','company','booth','photo','tour'])if(s[key])p.set(key,text(s[key]));
 if(s.area&&s.area!=='all')p.set('area',s.area);if(s.mode==='3d')p.set('mode','3d');
 if(s.compare?.length)p.set('compare',[...new Set(s.compare)].slice(0,4).join(','));if(s.tour)p.set('step',String(s.step||0));
 const v=s.view||DEFAULT_STATE.view;for(const k of ['x','y','z'])if(v[k]!==DEFAULT_STATE.view[k])p.set(k,String(Number(Number(v[k]).toFixed(6))));
 return '#'+(routes.has(s.route)?s.route:'explore')+'?'+p;
}
export function patchState(state,patch){return {...state,...patch,view:patch.view?{...state.view,...patch.view}:state.view,compare:patch.compare?[...new Set(patch.compare)].slice(0,4):state.compare};}
export function boothView(data,boothId){const gs=data.mapGeometries.filter(g=>g.boothId===boothId);const pts=gs.flatMap(g=>g.coordinates||[]);if(!pts.length)return null;const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);return {x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2,z:Math.min(7,Math.max(2.5,.45/Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))))};}
export function mappedBooths(data,company){const ids=new Set(data.mapGeometries.map(g=>g.boothId));return (company?.boothIds||[]).filter(id=>ids.has(id));}
