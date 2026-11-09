'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const entry=fs.readFileSync('dist/web/photobridge-r100f5-entry-routing.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const prepaint=html.match(/<script id="pb1721MobileFirstEntry">([\s\S]*?)<\/script>/)?.[1];
function params(q){return new URLSearchParams(q)}
async function simulate(destination,{mobile=true,pathname='/photographer',search='',ok=true}={}){
  const calls={hard:[],spa:[],requests:[],events:[],pending:false};
  const handlers={},classes=new Set();
  const location={pathname,search,hash:'',replace(url){calls.hard.push(url)}};
  const history={state:null,replaceState(state,title,target){
    calls.spa.push(target);
    const [p,q='']=target.split('?');
    location.pathname=p;
    location.search=q?'?'+q:'';
  }};
  const document={
    documentElement:{classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)}},
    readyState:'loading',
    addEventListener:(name,fn)=>{handlers[name]=fn}
  };
  const window={matchMedia:()=>({matches:mobile}),dispatchEvent:e=>{calls.events.push(e.type);handlers[e.type]?.(e)}};
  window.top=window;
  const fetch=async url=>{
    calls.requests.push(url);
    return {ok,json:async()=>({destination})};
  };
  const addEventListener=(name,fn)=>{handlers[name]=fn};
  const setTimeout=()=>0; // explicit DOMContentLoaded triggers first entry
  const requestAnimationFrame=fn=>{fn();return 1};
  const PopStateEvent=function(type){this.type=type};
  const sandbox={window,document,location,history,fetch,setTimeout,requestAnimationFrame,PopStateEvent,URLSearchParams,addEventListener};
  if(prepaint)vm.runInNewContext(prepaint,sandbox,{timeout:1000});
  calls.pending=classes.has('pb1721MobileEntryPending');
  vm.runInNewContext(entry,sandbox,{timeout:1000});
  handlers.DOMContentLoaded?.();
  // Run the same first-entry function on pageshow; it is guarded by busy/done.
  handlers.pageshow?.();
  for(let i=0;i<25;i++)await Promise.resolve();
  calls.afterPending=classes.has('pb1721MobileEntryPending');
  return calls;
}
test('photographer mobile lab invite goes directly to Print in the same document',async()=>{
  const r=await simulate('lab');
  assert.equal(r.pending,true,'prepaint must hide initial Gallery frame');
  assert.deepEqual(r.hard,[],'no second document or splash');
  assert.deepEqual(r.spa,['/photographer/orders/flow?workspace=print&pbLabChooser=1']);
  assert.deepEqual(r.events,['popstate']);
  assert.equal(r.afterPending,false,'reveal chosen destination only');
  assert.equal(r.requests.length,1);
});
test('photographer mobile invitation and free accounts select Gallery without page reload',async()=>{
  for(const origin of ['retouch','free','photographer','admin']){
    const r=await simulate(origin);
    assert.deepEqual(r.hard,[]);
    assert.deepEqual(r.spa,['/photographer/gallery']);
    assert.equal(r.afterPending,false);
  }
});
test('store invitation goes directly to Store, not Gallery, without intermediate SPA navigation',async()=>{
  const r=await simulate('rental');
  assert.deepEqual(r.spa,[]);
  assert.deepEqual(r.hard,['/equipment-rental/book?pbStoreChooser=1']);
  assert.equal(r.pending,true);
});
test('desktop and explicit user destinations are preserved',async()=>{
  const desktop=await simulate('lab',{mobile:false});
  assert.deepEqual(desktop.spa,[]);
  assert.deepEqual(desktop.hard,['/photographer/gallery']);
  assert.equal(desktop.pending,false);
  for(const [pathname,search] of [
    ['/photographer/gallery',''],
    ['/photographer/orders/flow','?workspace=print'],
    ['/photographer','?pbEntryDone=lab'],
    ['/photographer','?walletPayment=1'],
    ['/photographer','?logged_out=1']]){
    const r=await simulate('lab',{pathname,search});
    assert.equal(r.requests.length,0,'explicit route cannot be hijacked');
    assert.equal(r.hard.length+r.spa.length,0);
    assert.equal(r.afterPending,false);
  }
});
test('unauthenticated and failed first entry releases its temporary cover',async()=>{
  const r=await simulate('lab',{ok:false});
  assert.deepEqual(r.hard,[]);
  assert.deepEqual(r.spa,[]);
  assert.equal(r.afterPending,false);
});
test('React auto-Gallery redirect is disabled ONLY at first mobile entry',()=>{
  assert(bundle.includes('document.documentElement.classList.add("pb1721MobileEntryPending")'));
  assert(bundle.includes('window===window.top&&window.matchMedia?.("(max-width:820px)")?.matches'));
  assert(bundle.includes('if(location.pathname==="/photographer/login")Dn("/photographer",!0)'));
  assert(bundle.includes('!0)}}return()=>window.removeEventListener("popstate",P)'));
  const expected=html.indexOf('id="pb1721MobileFirstEntry"');
  const app=html.indexOf('src="/assets/index-UIRefine-v655-r84.js');
  assert(expected>=0&&app>expected,'mobile prepaint is installed before app module');
  assert(html.includes('photobridge-r100f5-entry-routing.js?v=r1721'));
});
