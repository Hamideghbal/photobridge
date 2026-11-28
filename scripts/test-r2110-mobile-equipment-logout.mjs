import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {patchPush,patchPortal,patchServer} from './enable-r2110-mobile-equipment-logout.mjs';
const portal=fs.readFileSync('dist/api/equipment-rental-portal.html','utf8');
const server=fs.readFileSync('dist/api/server.js','utf8');
const push=fs.readFileSync('dist/web/photobridge-push-v728.js','utf8');
const start=portal.indexOf('async function rentalLogout(){'),end=portal.indexOf("$('#logout').addEventListener",start);
const logout=portal.slice(start,end);
function browser(api,preview=false){
 const buttons=[0,1].map(()=>({disabled:false,textContent:'خروج',setAttribute(){},removeAttribute(){}}));
 const w={__PB_RENTAL_PORTAL_AUTH_READY__:true},moves=[],messages=[],removed=[];let stopped=0,started=0,shown=0;
 if(preview)w.pb2079StorePreview={back:()=>moves.push('admin')};
 const fn=new Function('window','$','matchMedia','api','stopRentalLiveWatch','startRentalLiveWatch','showLogin','location','sessionStorage','localStorage','alert',logout+';return rentalLogout;')(w,x=>buttons[x==='#logout'?0:1],()=>({matches:true}),api,()=>stopped++,()=>started++,()=>shown++,{replace:x=>moves.push(x)},{removeItem:x=>removed.push(x)},{removeItem:x=>removed.push(x)},x=>messages.push(x));
 return {fn,w,moves,messages,removed,buttons,counts:()=>({stopped,started,shown})};
}
test('R2110 mobile logout is single-flight and only navigates after server confirmation',async()=>{
 let resolve,calls=0;const b=browser(async(path,opt)=>{calls++;assert.equal(path,'/api/auth/logout');assert.equal(opt.headers['x-photobridge-portal'],'rental');assert.equal(opt.headers['x-photobridge-mobile-logout'],'1');return new Promise(r=>resolve=r)});
 const pending=b.fn();await b.fn();assert.equal(calls,1);assert.equal(b.buttons[1].disabled,true);assert.deepEqual(b.moves,[]);resolve({ok:true});await pending;
 assert.deepEqual(b.moves,['/rental?logged_out=1']);assert.equal(b.w.__PB_RENTAL_PORTAL_AUTH_READY__,false);assert.equal(b.counts().shown,1);
});
test('R2110 failed logout restores button and permits retry; admin preview stays separate',async()=>{
 const b=browser(async()=>{throw Error('offline')});await b.fn();assert.equal(b.buttons[1].disabled,false);assert.equal(b.w.pb2107RentalLogoutPending,false);assert.equal(b.counts().started,1);assert.equal(b.moves.length,0);
 const p=browser(async()=>{throw Error('must not call logout')},true);await p.fn();assert.deepEqual(p.moves,['admin']);
});
test('R2110 scoped server logout deletes only rental session and clears only rental cookie',async()=>{
 const i=server.indexOf('// PB2110 scoped mobile rental logout'),j=server.indexOf('return sendJson(res, 200, { ok: true });',i);
 assert.ok(i>=0&&j>i);
 const code=server.slice(i,j+'return sendJson(res, 200, { ok: true });'.length)+'}return "other";';
 const queries=[],cookies=[];const fn=new Function('requestPortal','bearerToken','pb2079PreviewScope','cookie','sessionCookieName','pool','tokenHash','sendJson','return async function(req,res,url){'+code+'}')(
 req=>req.headers['x-photobridge-portal'],req=>req.bearer,req=>req.preview??null,(_r,n)=>{assert.equal(n,'photobridge_rental_session');return 'rental-token'},p=>'photobridge_'+p+'_session',{query:async(...a)=>queries.push(a)},x=>'hash:'+x,(_r,status,data)=>({status,data}));
 const req={method:'POST',headers:{'x-photobridge-portal':'rental','x-photobridge-mobile-logout':'1'}},res={setHeader:(...a)=>cookies.push(a)},url={pathname:'/api/auth/logout'};
 assert.equal((await fn(req,res,url)).status,200);assert.deepEqual(queries,[['DELETE FROM sessions WHERE token_hash=$1',['hash:rental-token']]]);assert.match(cookies[0][1],/^photobridge_rental_session=;/);assert.doesNotMatch(cookies[0][1],/photographer|admin|lablink/);
 assert.equal(await fn({...req,bearer:'x'},res,url),'other');assert.equal(await fn({...req,preview:'shop'},res,url),'other');assert.equal(await fn({...req,headers:{...req.headers,'x-photobridge-portal':'photographer'}},res,url),'other');
});
test('R2110 final assets have bounded push logout and repeatable patches',()=>{
 assert.match(push,/PB2110 bounded rental push logout/);assert.match(push,/role\(\)==='rental'&&matchMedia\('\(max-width:850px\)'\)/);assert.match(push,/controller\.abort\(\);resolve\(false\)\},1500/);
 assert.equal(patchPortal(portal),portal);assert.equal(patchServer(server),server);assert.equal(patchPush(push),push);new Function(logout);new Function(push);
});
