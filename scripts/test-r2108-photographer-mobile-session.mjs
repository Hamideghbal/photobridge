import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {patchPicker,patchServer,patchPanel,patchBook} from './enable-r2108-photographer-mobile-session.mjs';

const html=fs.readFileSync('dist/web/index.html','utf8');
const picker=html.match(/<script id="pb1493MobileSessionResume">([\s\S]*?)<\/script>/)[1];
const server=fs.readFileSync('dist/api/server.js','utf8');
const panel=fs.readFileSync('dist/web/photobridge-r1106-mobile-store-panel.js','utf8');
const book=fs.readFileSync('dist/api/equipment-rental-book.html','utf8');
function browser(path,handler,initial={}){
 const origin='https://photobridge.ir',calls=[],moves=[],classes=new Set(),state=new Map(Object.entries(initial)),local=new Map();
 const loc={origin,replace:u=>moves.push(u)};
 function set(u){const parsed=new URL(u,origin);Object.assign(loc,{href:parsed.href,pathname:parsed.pathname,search:parsed.search,hash:parsed.hash})}
 set(path);
 const storage=m=>({getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)});
 const root={classList:{add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x)),contains:x=>classes.has(x)}};
 const document={hidden:false,documentElement:root,body:{append(){}},createElement:()=>({style:{},setAttribute(){},remove(){}}),addEventListener(){},querySelector:()=>null};
 const window={fetch:(input,init)=>{calls.push([input,init]);return handler(input,init)},addEventListener(){},dispatchEvent(){}};
 window.top=window;
 vm.runInNewContext(picker,{window,document,navigator:{standalone:true},location:loc,history:{state:null,replaceState:(_a,_b,u)=>set(u)},localStorage:storage(local),sessionStorage:storage(state),matchMedia:()=>({matches:true}),URL,URLSearchParams,Headers,Request,AbortController,setTimeout,clearTimeout,Event});
 return {window,loc,calls,moves,classes,state,local};
}
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
test('R2108 explicit photographer login and successful handoff do not open the picker',async()=>{
 const b=browser('/photographer?logged_out=1',async()=>response({ok:true,me:{user:{labRole:'customer',platformRole:'platform_admin'}}}),{'pb2092-account-handoff':'old'});
 assert.equal(b.loc.pathname,'/photographer/login');
 assert.equal(b.calls.length,0);
 assert.equal(b.classes.has('pb2087AccountPending'),false);
 assert.equal(b.state.has('pb2092-account-handoff'),false);
 const r=await b.window.fetch('/api/auth/customer-login',{method:'POST'});
 assert.equal(r.ok,true);
 assert.equal(b.loc.search,'');
 assert.equal(b.window.pb2092AccountNavigate('/photographer/gallery'),true);
 assert.match(b.moves[0],/^\/photographer\/gallery\?pb2087AccountEntry=1$/);
 assert.equal(JSON.parse(b.state.get('pb2092-account-handoff')).path,'/photographer/gallery');
});
test('R2108 failed sign in retains login page and does not create an authenticated handoff',async()=>{
 const b=browser('/photographer/login?logged_out=1',async()=>response({error:'invalid_credentials'},401));
 const r=await b.window.fetch('/api/auth/customer-login',{method:'POST'});
 assert.equal(r.status,401);assert.equal(b.loc.search,'?logged_out=1');assert.equal(b.moves.length,0);
 assert.equal(b.state.has('pb2092-account-handoff'),false);
});
test('R2108 ordinary photographer logout is single-flight, scoped, and confirmed',async()=>{
 let complete;const pending=new Promise(r=>complete=r);
 const b=browser('/photographer/login',()=>pending);
 const a=b.window.fetch('/api/auth/logout',{method:'POST'}),c=b.window.fetch('/api/auth/logout',{method:'POST'});
 await Promise.resolve();assert.equal(b.calls.length,1);
 assert.equal(b.calls[0][1].headers.get('x-photobridge-portal'),'photographer');
 complete(response({ok:true}));
 assert.equal((await a).ok,true);assert.equal((await c).ok,true);
 assert.equal(b.window.pb2092AccountNavigate('/photographer/gallery'),false);
});
test('R2108 unsuccessful logout remains retryable, other roles and bearer requests are not rewritten',async()=>{
 const b=browser('/photographer/login',async()=>response({ok:false}));
 await assert.rejects(b.window.fetch('/api/auth/logout',{method:'POST'}),/not_confirmed/);
 await assert.rejects(b.window.fetch('/api/auth/logout',{method:'POST'}),/not_confirmed/);
 assert.equal(b.calls.length,2);
 const r=await b.window.fetch('/api/auth/logout',{method:'POST',headers:{'x-photobridge-portal':'lab'}});
 assert.equal(r.ok,true);assert.equal(b.calls[2][1].headers['x-photobridge-portal'],'lab');
 await b.window.fetch('/api/auth/logout',{method:'POST',headers:{authorization:'Bearer example'}});
 assert.equal(b.calls[3][1].headers.authorization,'Bearer example');
});
test('R2108 lightweight probe stays behind existing authentication and avoids cookie and avatar work',()=>{
 const i=server.indexOf("if (req.method === 'GET' && url.pathname === '/api/auth/me')"),j=server.indexOf("if (requestPortal(req) === 'rental' || requestPortal(req) === 'lab')",i);
 assert.ok(i>=0&&j>i);
 const source=server.slice(i,j)+'}return "full";';
 const run=new Function('req','url','a','sendJson','res','requestPortal',source);
 const req={method:'GET'},url=new URL('https://photobridge.ir/api/auth/me?pb2108Probe=1'),sendJson=(_r,_s,data)=>data;
 assert.equal(run(req,url,null,sendJson,{},()=> 'photographer'),null);
 const verified=run(req,url,{labRole:'customer',name:'studio',mustChangePassword:false,platformRole:'platform_admin'},sendJson,{},()=> 'photographer');
 assert.deepEqual(verified,{user:{labRole:'customer',name:'studio',photographerName:'studio',mustChangePassword:false}});
 assert.equal(run(req,url,{labRole:'lab_admin'},sendJson,{},()=> 'lab'),'full');
 assert.match(picker,/pb2108Probe=1/);assert.match(panel,/pb2108Probe=1/);
});
test('R2108 login candidate filtering preserves exact normalization and all role/password checks',()=>{
 const start=server.indexOf('const loginWithMobile = async (expected) => {'),end=server.indexOf("if (req.method === 'POST' && url.pathname === '/api/auth/lab-login')",start),part=server.slice(start,end);
 assert.match(part,/right\(regexp_replace\(translate\(u\.mobile/);
 assert.match(part,/expected === 'customer' && \/\^09\\d\{9\}\$\/\.test\(mobile\) \? mobile\.slice\(-10\) : null/);
 assert.match(part,/normalizeMobile\(r\.mobile\) === mobile/);
 assert.match(part,/passwordVerify/);
});
test('R2108 hidden embedded Store polling pauses without removing the frame; all patches idempotent',()=>{
 const i=book.indexOf('function refreshVisibleStoreData(force=false)'),j=book.indexOf('boot();',i);
 assert.ok(i>=0&&j>i);const part=book.slice(i,j);
 assert.match(part,/frameElement\?\.closest\('\.pb1106ContentPanel'\)\?\.hidden/);
 assert.match(part,/pb2100Submitting/);
 assert.equal(patchPicker(picker),picker);assert.equal(patchServer(server),server);
 assert.equal(patchPanel(panel),panel);assert.equal(patchBook(book),book);
});
