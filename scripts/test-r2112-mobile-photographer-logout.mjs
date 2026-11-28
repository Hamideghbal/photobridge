import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {installPhotographerLogout,patchHtml} from './enable-r2112-mobile-photographer-logout.mjs';
const response=(data,status=200)=>new Response(JSON.stringify(data),{status});
function browser(path,handler,{mobile=true,top=null,session={}}={}){
 const url=new URL(path,'https://photobridge.ir'),moves=[],calls=[],classes=new Set(),removed=[];
 const storage=initial=>{const m=new Map(Object.entries(initial));return {getItem:k=>m.get(k)??null,removeItem:k=>m.delete(k),setItem:(k,v)=>m.set(k,v)}};
 const w={URL,URLSearchParams,Headers,navigator:{userAgent:'Android'},matchMedia:()=>({matches:mobile}),location:{href:url.href,origin:url.origin,pathname:url.pathname,search:url.search,hash:url.hash,replace:p=>moves.push(p)},document:{documentElement:{classList:{add:v=>classes.add(v)},dataset:{pb2099Panel:'print'}},body:{classList:{remove(){}}},querySelectorAll:()=>[{remove:()=>removed.push('panel')}]},sessionStorage:storage(session),localStorage:storage({'photobridge:pwa:last-portal':'photographer'}),fetch:(input,init)=>{calls.push([input,init]);return handler(input,init)}};
 w.top=top||w;installPhotographerLogout(w);return {w,moves,calls,classes,removed};
}
test('confirmed top-level mobile logout is scoped, single flight and replaces the whole document',async()=>{
 let resolve;const pending=new Promise(r=>resolve=r);
 const b=browser('/photographer/gallery?pbStorePanel=print',()=>pending,{session:{'pb2092-account-handoff':'old'}});
 const p=b.w.fetch('/api/auth/logout',{method:'POST'}),q=b.w.fetch('/api/auth/logout',{method:'POST'});
 await Promise.resolve();assert.equal(b.calls.length,1);assert.equal(b.calls[0][1].headers.get('x-photobridge-portal'),'photographer');assert.deepEqual(b.moves,[]);
 resolve(response({ok:true}));assert.equal((await p).ok,true);assert.equal((await q).ok,true);
 assert.deepEqual(b.moves,['/photographer/login?logged_out=1']);assert.equal(b.classes.has('pb2112LogoutNavigating'),true);assert.equal(b.removed.length,1);
 assert.equal(b.w.sessionStorage.getItem('pb2092-account-handoff'),null);
});
test('logout from the embedded Print document navigates the top, not the iframe',async()=>{
 const parent=browser('/photographer/gallery?pbStorePanel=print',async()=>response({ok:true}));
 const frame=browser('/photographer/orders/flow?workspace=print&pbEmbeddedStore=1',async()=>response({ok:true}),{top:parent.w});
 await frame.w.fetch('/api/auth/logout',{method:'POST'});
 assert.deepEqual(frame.moves,[]);assert.deepEqual(parent.moves,['/photographer/login?logged_out=1']);
});
test('network failure, rejected logout, and unsuccessful JSON do not navigate; retry works',async()=>{
 let n=0;const b=browser('/photographer/orders/flow',async()=>{n++;if(n===1)throw Error('offline');if(n===2)return response({ok:false},503);if(n===3)return response({ok:false});return response({ok:true})});
 await assert.rejects(b.w.fetch('/api/auth/logout',{method:'POST'}),/offline/);
 assert.equal((await b.w.fetch('/api/auth/logout',{method:'POST'})).status,503);
 await assert.rejects(b.w.fetch('/api/auth/logout',{method:'POST'}),/not_confirmed/);
 assert.deepEqual(b.moves,[]);await b.w.fetch('/api/auth/logout',{method:'POST'});assert.equal(b.moves.length,1);
});
test('desktop, other roles, preview and Bearer requests remain unchanged',async()=>{
 for(const [path,options] of [['/photographer/gallery',{mobile:false}],['/rental',{}],['/photographer/gallery?pbAdminShop=1',{}],['/photographer/gallery',{session:{lablink_test_session:'x'}}]]){
  const b=browser(path,async()=>response({ok:true}),options);await b.w.fetch('/api/auth/logout',{method:'POST'});assert.deepEqual(b.moves,[]);
 }
 const b=browser('/photographer/gallery',async()=>response({ok:true}));for(const headers of [{'x-photobridge-portal':'lab'},{authorization:'Bearer x'},{'x-photobridge-impersonation':'x'}])await b.w.fetch('/api/auth/logout',{method:'POST',headers});
 assert.deepEqual(b.moves,[]);
});
test('final HTML includes one early logout handler; compiled compressed assets are identical',()=>{
 for(const path of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
  const html=fs.readFileSync(path,'utf8');assert.equal((html.match(/id="pb2112PhotographerLogout"/g)||[]).length,1);assert.equal(patchHtml(html),html);
  assert.ok(html.indexOf('id="pb2112PhotographerLogout"')>html.indexOf('id="pb1493MobileSessionResume"'));
  assert.ok(html.includes('/photographer/login?logged_out=1'));
 }
});
