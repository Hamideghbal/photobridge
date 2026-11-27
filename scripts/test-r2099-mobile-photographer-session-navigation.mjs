import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const panel=read('dist/web/photobridge-r1106-mobile-store-panel.js'),chooser=read('dist/web/photobridge-v904r99-lab-chooser.js'),html=read('dist/api/equipment-rental-book.html'),index=read('dist/web/index.html');
function predicate(source,name,args){const from=source.indexOf('function '+name+'('),end=source.indexOf('\n',from);assert.ok(from>=0);return new Function(...args,source.slice(from,end)+';return '+name)}
test('R2099 frame routes require the correct same-origin workspace',()=>{
 const valid=predicate(panel,'validFrame',['location'])({origin:'https://photobridge.ir'});
 for(const [kind,path,expected] of [['store','/equipment-rental/book',true],['store','/photographer/orders/flow',false],['print','/photographer/orders/flow',true],['print','/photographer/login',false],['store','/rental',false],['store','https://example.com/equipment-rental/book',false]])assert.equal(valid(kind,new URL(path,'https://photobridge.ir')),expected);
});
test('R2099 mobile parent never mounts Lab chooser over Store, including old Print route',()=>{
 const start=chooser.indexOf('const isPrintRoute=()=>'),end=chooser.indexOf('\n',start),code=chooser.slice(start,end);
 for(const [search,embedded,expected] of [['?workspace=print&pbStorePanel=store',false,false],['?workspace=print&pbStorePanel=1',false,false],['?workspace=print&pbStorePanel=print',false,true],['?workspace=print&pbEmbeddedStore=1',true,true]]){
  const win={};win.top=embedded?{}:win;
  const fn=new Function('location','URLSearchParams','isPhotographerRoute','matchMedia','window','document',code+';return isPrintRoute()');
  assert.equal(fn({pathname:'/photographer/orders/flow',search},URLSearchParams,()=>true,()=>({matches:true}),win,{documentElement:{dataset:{}}}),expected);
 }
});
test('R2099 auth probes distinguish expired session, server failure, and valid photographer',async()=>{
 const start=panel.indexOf('const genuinePhotographer='),end=panel.indexOf('\n',start);
 const source=panel.slice(start,end);assert.ok(start>=0);
 for(const [status,data,expected] of [[200,{user:{labRole:'customer'}},true],[200,null,false],[200,{user:{labRole:'lab_admin'}},false],[401,null,false],[503,null,null]]){
  const fn=new Function('fetch','AbortSignal',source+';return genuinePhotographer')((url,opts)=>{assert.equal(opts.headers['x-photobridge-portal'],'photographer');return Promise.resolve({status,ok:status===200,json:async()=>data})},AbortSignal);
  assert.equal(await fn(),expected);
 }
 const fn=new Function('fetch','AbortSignal',source+';return genuinePhotographer')(async()=>{throw Error('offline')},AbortSignal);assert.equal(await fn(),null);
});
test('R2099 final documents isolate panel failures and carry selected role across Store handoff',()=>{
 assert.match(panel,/if\(panel\.hidden\|\|selected!==kind\)return/);
 assert.ok(!panel.includes('location.assign(url.href)'));
 assert.match(panel,/if\(epoch!==authEpoch\|\|valid!==false\)return/);
 assert.match(panel,/window\.pb2092AccountNavigate\?\.\(target\)/);
 assert.ok(html.includes('PB2099 scoped store identity'));
 for(const s of [html,index]){assert.ok(s.includes('PB2099 internal photographer route'));assert.ok(s.includes('pb2099MobilePanelIsolation'));assert.ok(s.includes('mobileRoute=r2099'))}
 assert.ok(read('dist/web/photobridge-r100f5-entry-routing.js').includes('PB2099 store landing handoff'));
});
