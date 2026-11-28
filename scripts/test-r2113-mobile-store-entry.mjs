import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {patchPicker,patchServer,patchRental} from './enable-r2113-mobile-store-entry.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const html=read('dist/web/index.html'),picker=html.match(/<script id="pb1493MobileSessionResume">([\s\S]*?)<\/script>/)[1],portal=read('dist/api/equipment-rental-portal.html'),server=read('dist/api/server.js');
test('Store retry stays within original selection and never bypasses rejection',async()=>{
 const a=picker.indexOf('let valid=await validSession(selected);'),b=picker.indexOf('if(valid&&!valid.uncertain)',a);
 assert.ok(a>=0&&b>a);
 const run=new Function('selected','validSession','return (async()=>{'+picker.slice(a,b)+'return valid})()');
 const calls=[];const verified={portal:'rental'};
 assert.equal(await run('rental',async(p,d)=>{calls.push([p,d]);return calls.length===1?{uncertain:true}:verified}),verified);
 assert.deepEqual(calls,[['rental',undefined],['rental',8000]]);
 calls.length=0;assert.equal(await run('rental',async(p)=>{calls.push(p);return null}),null);assert.deepEqual(calls,['rental']);
});
test('Store handoff tolerates transient foreground events only',()=>{
 const a=picker.indexOf("if(['photographer','rental'].includes(currentPortal())"),b=picker.indexOf('// Do not interrupt',a);
 assert.ok(a>=0&&b>a);
 const run=new Function('currentPortal','authorized','needsResume','pb2103SelectedAt','pb2103HiddenAt','let wasHidden=true,blurred=true;'+picker.slice(a,b)+'return "resume"');
 const now=Date.now();
 assert.equal(run(()=> 'rental',true,false,now,0),undefined);
 assert.equal(run(()=> 'rental',true,false,now-20000,0),'resume');
 assert.equal(run(()=> 'rental',true,false,now,now-3000),'resume');
 assert.equal(run(()=> 'rental',false,false,now,0),'resume');
 assert.equal(run(()=> 'lab',true,false,now,0),'resume');
});
test('lean Store probe remains scoped to an authenticated rental shop',async()=>{
 const a=server.indexOf('/* PB2113 scoped rental identity probe */'),b=server.indexOf("if (requestPortal(req) === 'rental' || requestPortal(req) === 'lab')",a);
 assert.ok(a>=0&&b>a);
 const run=new Function('req','url','a','pool','res','sendJson','requestPortal','pb2079PreviewScope','return (async()=>{'+server.slice(a,b)+'return "full"})()');
 const req={},url=new URL('https://photobridge.ir/api/auth/me?pb2113Probe=1'),res={},calls=[],pool={query:async(sql,args)=>{calls.push(args);return {rows:[{id:'shop',name:'Store'}]}}},send=(_r,_s,data)=>data;
 assert.deepEqual(await run(req,url,{rentalRole:'shop_admin',rentalShopId:'shop'},pool,res,send,()=> 'rental',()=>null),{user:{rentalRole:'shop_admin',mustChangePassword:undefined},rentalShop:{id:'shop',name:'Store'}});
 assert.deepEqual(calls,[['shop']]);
 assert.equal(await run(req,url,{rentalRole:'customer',rentalShopId:'shop'},pool,res,send,()=> 'rental',()=>null),null);
 assert.equal(await run(req,url,{},pool,res,send,()=> 'photographer',()=>null),'full');
 assert.equal(await run(req,url,{},pool,res,send,()=> 'rental',()=> 'preview'),'full');
});
test('mobile Store login uses verified POST identity, desktop and missing identity retain fallback',async()=>{
 const a=portal.indexOf('const mobileLogin=matchMedia'),b=portal.indexOf('window.__pbRentalAccount=rentalIdentity;',a);
 assert.ok(a>=0&&b>a);
 const run=new Function('loginResult','matchMedia','window','api','return (async()=>{'+portal.slice(a,b)+'return rentalIdentity})()');
 const me={user:{rentalRole:'shop_admin'},rentalShop:{id:'shop'}},calls=[];
 const api=async(...args)=>{calls.push(args);return 'fallback'};
 assert.equal(await run({ok:true,me},()=>({matches:true}),{},api),me);assert.equal(calls.length,0);
 assert.equal(await run({ok:true,me},()=>({matches:false}),{},api),'fallback');
 assert.equal(await run({ok:true},()=>({matches:true}),{},api),'fallback');
});
test('mobile Store form overrides legacy centering and patch is idempotent',()=>{
 const css=portal.match(/<style id="pb2113RentalLoginTop">([\s\S]*?)<\/style>/)[1];
 assert.match(css,/@media screen and \(max-width:850px\)/);
 assert.match(css,/justify-content:flex-start!important/);assert.match(css,/margin:0 auto!important/);
 assert.match(css,/#loginForm/);assert.match(css,/grid-template-columns:max-content minmax\(0,1fr\)/);
 assert.ok(portal.indexOf('id="pb2113RentalLoginTop"')>portal.indexOf('id="pbR1054RentalMobileAuthTouchStyles"'));
 assert.match(portal,/PB2113 single login submit/);
 assert.equal(patchPicker(picker),picker);assert.equal(patchRental(portal),portal);assert.equal(patchServer(server),server);
});
