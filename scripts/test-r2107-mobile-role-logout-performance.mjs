import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {patchPicker,patchRentalLogout,patchPanel,patchServer} from './enable-r2107-mobile-role-logout-performance.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('dist/web/index.html'),portal=read('dist/api/equipment-rental-portal.html'),panel=read('dist/web/photobridge-r1106-mobile-store-panel.js'),server=read('dist/api/server.js');
const picker=index.match(/<script id="pb1493MobileSessionResume">([\s\S]*?)<\/script>/)[1];
test('R2107 logged-out Photographer and explicit sign-in never reopen account chooser',()=>{
 for(const [pathname,search,expected] of [['/photographer','?logged_out=1','/photographer/login?logged_out=1'],['/photographer/login','',''],['/photographer/login','?logged_out=1','']]){
  const history=[],requests=[],storage=new Map([['pb2092-account-handoff','old']]);
  const w={fetch:()=>{requests.push('fetch');throw Error('unexpected fetch')}};w.top=w;
  const ctx={window:w,navigator:{standalone:true},location:{pathname,search,hash:'',origin:'https://photobridge.ir',href:'https://photobridge.ir'+pathname+search},matchMedia:()=>({matches:true}),document:{},history:{replaceState:(a,b,c)=>history.push(c)},localStorage:{removeItem(){}},sessionStorage:{removeItem:k=>storage.delete(k)},URL,URLSearchParams};
  vm.runInNewContext(picker,ctx);
  assert.deepEqual(requests,[]);assert.deepEqual(history,expected?[expected]:[]);
  if(search)assert.equal(storage.has('pb2092-account-handoff'),false);
 }
 assert.match(picker,/portal==='photographer'&&!accounts\.some\(a=>a\.portal===portal\)/);
 assert.match(picker,/move\('\/photographer\/login',true\)/);
 assert.equal(patchPicker(picker),picker);
});
test('R2107 Store logout has immediate progress, only navigates after success, and preserves preview exit',async()=>{
 const start=portal.indexOf('async function rentalLogout(){'),end=portal.indexOf("\n$('#logout')",start);
 assert.ok(start>=0&&end>start);const source=portal.slice(start,end);
 for(const success of [true,false]){
  let complete;const pending=new Promise(resolve=>complete=resolve),events=[],requests=[];
  const buttons=[0,1].map(()=>({textContent:'خروج',disabled:false,setAttribute(){},removeAttribute(){}}));
  const w={};const fn=new Function('window','$','api','AbortController','setTimeout','clearTimeout','stopRentalLiveWatch','showLogin','matchMedia','location','alert',source+';return rentalLogout')(w,id=>buttons[id==='#logout'?0:1],(url,opt)=>{requests.push([url,opt]);return pending},AbortController,setTimeout,clearTimeout,()=>events.push('stop'),()=>events.push('login'),()=>({matches:true}),{replace:u=>events.push(u),reload:()=>events.push('reload')},()=>events.push('error'));
  const first=fn();await fn();assert.equal(requests.length,1);assert.equal(requests[0][1].headers['x-photobridge-portal'],'rental');assert.ok(buttons.every(b=>b.disabled));assert.deepEqual(events,[]);
  complete({ok:success});await first;
  assert.deepEqual(events,success?['stop','login','/rental?logged_out=1']:['error']);
  if(!success)assert.ok(buttons.every(b=>!b.disabled&&b.textContent==='خروج'));
 }
 assert.match(source,/if\(window\.pb2079StorePreview\)/);assert.equal(patchRentalLogout(portal),portal);
});
test('R2107 photographer authentication remains fresh without repeated session writes',async()=>{
 const start=server.indexOf('async function auth(req) {'),end=server.indexOf('function requireRole(',start);
 assert.ok(start>=0&&end>start);const source=server.slice(start,end);
 const DAYS=30;
 for(const [role,enabled,remaining,impersonation,writes] of [['customer',true,30*86400-30,false,0],['customer',true,30*86400-360,false,1],['customer',false,30*86400-360,false,0],['customer',true,30*86400-360,true,0]]){
  const calls=[];
  const row={id:'u',name:'P',platform_role:'platform_admin',lab_id:'l',lab_role:role,photographer_enabled:enabled,lab_service_only:true,pb2107_session_expiry:new Date(Date.now()+remaining*1000)};
  const pool={query:async(sql)=>{calls.push(sql);return {rowCount:1,rows:[row]}}};
  const fn=new Function('requestSessionToken','requestPortal','isAdminImpersonationRequest','testAccountVisibleSql','tokenHash','pool','DAYS',source+';return auth')(()=> 'token',()=> 'photographer',()=>impersonation,()=> 'true',x=>x,pool,DAYS);
  const user=await fn({headers:{}});assert.equal(Boolean(user),enabled);assert.equal(calls.filter(sql=>sql.includes('UPDATE sessions SET expires_at')).length,writes);assert.match(calls[0],/s\.expires_at>now\(\)/);
 }
 assert.equal(patchServer(server),server);
});
test('R2107 dock ignores unrelated DOM mutations and disconnects previous resize observers',()=>{
 assert.match(panel,/PB2107 relevant dock mutations/);assert.match(panel,/dock&&!dock\.isConnected/);assert.match(panel,/pb2107ResizeObserver\?\.disconnect\(\)/);assert.match(panel,/record\.target\.matches\?\.\('#photographerStoreBottomNav,\.photographerBottomAppNav'\)/);
 assert.match(index,/rolePerf=r2107/);assert.equal(patchPanel(panel),panel);
});
