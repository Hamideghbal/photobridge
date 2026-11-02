'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {prepareNativeSession}=require('../native-session.cjs');
test('native startup removes only website worker/cache storage and HTTP cache before creating the app window',async()=>{
 const calls=[];await prepareNativeSession({clearStorageData:async options=>calls.push(['storage',options]),clearCache:async()=>calls.push(['http-cache'])},'http://127.0.0.1:43761');
 assert.deepEqual(calls,[['storage',{origin:'http://127.0.0.1:43761',storages:['serviceworkers','cachestorage']}],['http-cache']]);
 const source=fs.readFileSync(path.join(__dirname,'../main.cjs'),'utf8');assert(source.indexOf('prepareNativeSession(session.defaultSession,origin)')<source.indexOf('win=new BrowserWindow'));
});
test('native cache maintenance cannot be pointed at the public site or another host',async()=>{
 let called=false;const session={clearStorageData:async()=>{called=true;},clearCache:async()=>{called=true;}};
 for(const origin of ['https://photobridge.ir','http://localhost:43761','https://127.0.0.1:43761'])await assert.rejects(prepareNativeSession(session,origin),/invalid_native_session_origin/);
 assert.equal(called,false);
});
