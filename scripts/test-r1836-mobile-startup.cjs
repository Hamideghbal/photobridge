const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const router=fs.readFileSync('dist/web/photobridge-r100f5-entry-routing.js','utf8');
const prefetch=fs.readFileSync('scripts/r1836-startup-prefetch.js','utf8');
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
function harness({roleReady,early}={}){
 const handlers={},routes=[],classes=new Set(['pb1721MobileEntryPending']);let requested=0;
 const location={pathname:'/photographer',search:'',replace:u=>routes.push(u)};
 const document={readyState:'loading',documentElement:{classList:{remove:c=>classes.delete(c)}},addEventListener:(n,f)=>handlers[n]=f};
 const window={__PB1836RoleReady:roleReady,__PB1836EntryRequest:early,matchMedia:()=>({matches:true}),dispatchEvent:e=>handlers[e.type]?.(e)};window.top=window;
 const sandbox={window,document,location,URLSearchParams,fetch:async()=>{requested++;return {ok:true,json:async()=>({destination:'free'})}},history:{state:null,replaceState:(_s,_t,u)=>{routes.push(u);location.pathname=u}},PopStateEvent:class{constructor(type){this.type=type}},requestAnimationFrame:f=>f(),setTimeout:(f,ms)=>{if(ms<700)Promise.resolve().then(f)},addEventListener:(n,f)=>handlers[n]=f};
 vm.runInNewContext(router,sandbox);handlers.DOMContentLoaded();
 return {window,location,routes,classes,requests:()=>requested};
}
test('entry request overlaps assets only on unqualified top-level mobile entry',()=>{
 for(const [path,search,mobile,embedded,count] of [['/photographer','',true,false,1],['/photographer','?logged_out=1',true,false,0],['/photographer','?walletPayment=1',true,false,0],['/photographer','?invite=x',true,false,0],['/photographer/gallery','',true,false,0],['/photographer','',false,false,0],['/photographer','',true,true,0]]){
  let requests=0;const window={};window.top=embedded?{}:window;
  vm.runInNewContext(prefetch,{window,location:{pathname:path,search},URLSearchParams,matchMedia:()=>({matches:mobile}),fetch:()=>{requests++;return Promise.resolve({ok:true})}});
  assert.equal(requests,count,path+search);
 }
});
test('first-entry waits for role resolution and reuses exactly one early response',async()=>{
 let resolveRole;const ready=new Promise(r=>resolveRole=r),early=Promise.resolve({ok:true,json:async()=>({destination:'free'})});
 const h=harness({roleReady:ready,early});await flush();assert.equal(h.requests(),0);assert.deepEqual(h.routes,[]);
 resolveRole();await flush();assert.deepEqual(h.routes,['/photographer/gallery']);assert.equal(h.requests(),0);assert.equal(h.classes.size,0);
});
test('late role and context responses cannot override user navigation',async()=>{
 let resolveRole;const ready=new Promise(r=>resolveRole=r);const h=harness({roleReady:ready});await flush();h.location.pathname='/photographer/settings/location';resolveRole();await flush();assert.deepEqual(h.routes,[]);assert.equal(h.requests(),0);
 let resolveEntry;const early=new Promise(r=>resolveEntry=r);const other=harness({early});await flush();other.location.pathname='/photographer/gallery';resolveEntry({ok:true,json:async()=>({destination:'lab'})});await flush();assert.deepEqual(other.routes,[]);
});
test('confirmed role document handoff prevents a competing photographer redirect',async()=>{
 let resolveRole;const ready=new Promise(r=>resolveRole=r);const h=harness({roleReady:ready});await flush();h.window.__PB1836RoleHandoff=true;resolveRole();await flush();assert.equal(h.requests(),0);assert.deepEqual(h.routes,[]);
});
test('viewport precedes every device decision and startup identity stays unchanged',()=>{
 const html=fs.readFileSync('dist/web/index.html','utf8');const viewport=html.indexOf('<meta name="viewport"');
 assert(viewport>=0&&viewport<html.indexOf('matchMedia('));
 assert(html.indexOf('id="pb1493MobileSessionResume"')<html.indexOf('src="/photobridge-r1126-desktop-navigation.js'));
 assert(html.includes('id="pb1836StartupPrefetch"'));assert(html.includes('startup=r1836'));
 const manifest=JSON.parse(fs.readFileSync('dist/web/photobridge.webmanifest'));assert.equal(manifest.id,'/photobridge-pwa');assert.equal(manifest.start_url,'/');
});
test('the approved splash cannot uncover an intermediate role or first-entry page',()=>{
 const source=fs.readFileSync('scripts/r1836-launch-ready.js','utf8');
 const classes=new Set(['pb1493SessionResumePending']),handlers={};let changed;
 const window={};window.top=window;
 const root={childElementCount:1,firstElementChild:{classList:{contains:()=>false},textContent:'intermediate page'}};
 const html={classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)}};
 vm.runInNewContext(source,{window,navigator:{standalone:true},matchMedia:()=>({matches:true}),document:{documentElement:html,readyState:'loading',getElementById:()=>root,addEventListener:(n,f)=>handlers[n]=f},MutationObserver:class{constructor(f){changed=f}observe(){}disconnect(){}},setTimeout:()=>1,clearTimeout:()=>{}});
 handlers.DOMContentLoaded();assert(classes.has('pb1479Launching'));
 classes.delete('pb1493SessionResumePending');classes.add('pb1721MobileEntryPending');changed();assert(classes.has('pb1479Launching'));
 classes.delete('pb1721MobileEntryPending');changed();assert(!classes.has('pb1479Launching'));
});
