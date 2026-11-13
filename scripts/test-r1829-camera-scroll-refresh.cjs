'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
test('R1829: refresh suppression and viewport restoration are camera-only',async()=>{
 const source=read('apps/store-desktop/desktop-overlay.js');
 const a=source.indexOf(' const pb1829Camera='),b=source.indexOf(' async function refresh(){',a);
 assert(a>=0&&b>a,'isolated refresh functions available');
 const make=new Function('ctx',
  "let data=ctx.initial,refreshPending=true,painting=false,state={signedIn:true,shopId:'1'};"+
  "const fetch=ctx.fetch,document=ctx.document,window=ctx.window,render=ctx.render,"+
  "paint=()=>{},applyBusinessMode=()=>{},requestAnimationFrame=fn=>fn(),formOpen=()=>false;"+
  source.slice(a,b)+";return {refresh:refreshPage,retry:()=>{refreshPending=true}}");
 const run=category=>{
  const initial={shop:{id:'1',business_category:category},photographers:[{id:1,name:'الف'}]};
  const root={id:'app',children:[],querySelectorAll(){return this.children},
   querySelector(){return {id:'photographers'}},contains(el){return this.children.includes(el)},scrollTop:0,scrollLeft:0};
  const child=()=>{const x={id:'photographersList',parentElement:root,scrollTop:180,scrollLeft:0};root.children=[x];return x};
  child();
  const win={scrollX:0,scrollY:120,scrollTo(x,y){this.scrollX=x;this.scrollY=y}};
  let next=initial,count=0;
  const api=make({initial,window:win,document:{
   body:{classList:{contains:()=>true}},
   getElementById:id=>id==='app'?root:root.children.find(x=>x.id===id)},
   fetch:async()=>({ok:true,json:async()=>JSON.parse(JSON.stringify(next))}),
   render:()=>{count++;child().scrollTop=0;win.scrollY=0}});
  return {api,root,win,initial,get count(){return count},setNext:x=>{next=x}};
 };
 const camera=run('equipment_sale');
 await camera.api.refresh();
 assert.equal(camera.count,0,'unchanged camera overview must not redraw');
 camera.setNext({...camera.initial,photographers:[{id:1,name:'ب'}]});
 camera.api.retry();await camera.api.refresh();
 assert.equal(camera.count,1,'changed photographer list redraws exactly once');
 assert.equal(camera.root.children[0].scrollTop,180,'list scroll is restored');
 assert.equal(camera.win.scrollY,120,'page position restored');
 const frame=run('frame');
 await frame.api.refresh();
 assert.equal(frame.count,1,'legacy frame/chassis redraw behavior unchanged');
});
test('R1829: real vertical overflow is enabled for camera stores only, including photographers',()=>{
 const css=read('scripts/r1824-camera-scroll.css');
 const html=read('dist/api/equipment-rental-portal.html');
 assert(css.includes('html.pb1824CameraScroll{'));
 assert(css.includes('overflow-y:auto!important;overflow-x:hidden!important'));
 assert(css.includes('body.rentalAppReady:not(.rentalItemModalOpen):not(.saleItemModalOpen):not(.storeNoticeOpen)'));
 assert(html.includes("['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(data?.shop?.business_category||''))"));
 assert(html.includes("['bookings','sales','items','photographers'].includes(tab)"));
 assert(!html.includes("['bookings','sales','items','photographers','settings'].includes(tab)"));
});
test('R1829: Windows store hot-update snapshot contains exactly the updated overlay and portal',()=>{
 const files=JSON.parse(read('dist/web/desktop-ui/manifest.json')).files;
 for(const [name,source] of [['desktop-overlay.js','apps/store-desktop/desktop-overlay.js'],['equipment-rental-portal.html','dist/api/equipment-rental-portal.html']]){
  const entry=files.find(x=>x.name===name);assert(entry,'store hot update missing '+name);
  assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),name+' hash stale');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync('dist/web/desktop-ui/'+name)).digest('hex'),entry.sha256,name+' contents stale');
 }
});
test('R1829: build scopes patches to camera stores, never lab nor frame/chassis',()=>{
 const build=read('scripts/liara-fast-build.mjs');
 assert(build.indexOf("enable-r1829-camera-scroll-refresh.mjs")>build.indexOf("enable-r1825-camera-store-staff-access.mjs"));
 assert(build.lastIndexOf("prepare-store-desktop-ui.mjs")>build.indexOf("enable-r1829-camera-scroll-refresh.mjs"));
 const patch=read('scripts/enable-r1829-camera-scroll-refresh.mjs');
 assert(!/lab-desktop-ui|dist\/api\/server.js|dist\/web\/assets/.test(patch));
 assert(!/frame_chassis|\bchassis\b/.test(patch));
 const revision=Number(read('DEPLOY_REVISION.txt').match(/-r(\d+)-/)?.[1]);
 assert(Number.isInteger(revision)&&revision>=1829);
});
