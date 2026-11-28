import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {installNavRead,relevantNav,patchTabs,patchCrm,patchWallet,patchPush} from './enable-r2109-photographer-mobile-latency.mjs';

test('R2109 mobile photographer nav requests share one flight and short-lived results; auth invalidates',async()=>{
 const original=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:true});
 try{
  let calls=0,resolve,handler;const w={addEventListener:(name,fn)=>{if(name==='photobridge-auth-session-changed')handler=fn},fetch:()=>{calls++;return new Promise(r=>resolve=r)}};
  installNavRead(w);
  const path='/api/photographer/navigation-tabs',options={headers:{'x-photobridge-portal':'photographer'}};
  const a=w.pb2109NavRead(path,options),b=w.pb2109NavRead(path,options);
  await Promise.resolve();assert.equal(calls,1);
  resolve(new Response(JSON.stringify({tabs:{customers:false}})));
  assert.deepEqual(await (await a).json(),{tabs:{customers:false}});
  assert.deepEqual(await (await b).json(),{tabs:{customers:false}});
  assert.deepEqual(await (await w.pb2109NavRead(path,options)).json(),{tabs:{customers:false}});
  assert.equal(calls,1);
  handler();const c=w.pb2109NavRead(path,options);await Promise.resolve();assert.equal(calls,2);
  resolve(new Response('{}'));await c;
  const d=w.pb2109NavRead(path,{headers:{'x-photobridge-portal':'photographer',authorization:'Bearer sample'}});
  assert.equal(calls,3);resolve(new Response('{}'));await d;
 }finally{globalThis.matchMedia=original}
});
test('R2109 ignores content changes and handles new and removed navigation nodes',()=>{
 const nav={nodeType:1,matches:()=>true},unrelated={nodeType:1,matches:()=>false,closest:()=>null,querySelector:()=>null};
 assert.equal(relevantNav([{type:'attributes',target:unrelated}],'.nav'),false);
 assert.equal(relevantNav([{type:'childList',target:unrelated,addedNodes:[unrelated],removedNodes:[]}],'.nav'),false);
 assert.equal(relevantNav([{type:'childList',target:unrelated,addedNodes:[nav],removedNodes:[]}],'.nav'),true);
 assert.equal(relevantNav([{type:'childList',target:unrelated,addedNodes:[],removedNodes:[nav]}],'.nav'),true);
});
test('R2109 actual final files use scoped observers, deduplication and bounded logout',()=>{
 const read=n=>fs.readFileSync('dist/web/'+n,'utf8');
 const tabs=read('photobridge-r1099-photographer-tabs.js'),crm=read('photobridge-r1761-crm-nav.js'),wallet=read('photobridge-v861-store-wallet-admin.js'),push=read('photobridge-push-v728.js');
 assert.match(tabs,/window\.pb2109NavRead\(path,/);assert.match(crm,/window\.pb2109NavRead\('\/api\/photographer\/navigation-tabs'/);
 assert.match(tabs,/relevantNav\(records,/);assert.match(crm,/requestAnimationFrame\(render\)/);
 assert.match(wallet,/PB2109 admin wallet route isolation/);
 const i=push.indexOf('/* PB2109 bounded Photographer push cleanup */'),j=push.indexOf('return nativeFetch(input,init);',i);
 assert.ok(i>=0&&j>i);const part=push.slice(i,j);
 assert.match(part,/Promise\.race/);assert.match(part,/controller\.abort\(\);resolve\(false\)\},1500/);
 assert.match(part,/else await unsubscribeCurrentAccount\(\)/);
 for(const [s,patch] of [[tabs,patchTabs],[crm,patchCrm],[wallet,patchWallet],[push,patchPush]]){assert.equal(patch(s),s);new Function(s)}
});
