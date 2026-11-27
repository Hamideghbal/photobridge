'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const trust=require('../apps/store-desktop/update-trust.cjs'),{StoreAlerts}=require('../apps/store-desktop/store-alerts.cjs'),{AppUpdate}=require('../apps/store-desktop/app-update.cjs');
const response=(data,status=200)=>({ok:status===200,status,json:async()=>data});
const signed=(bytes,version='1.0.4')=>{const keys=crypto.generateKeyPairSync('ed25519'),m={protocol:1,channel:'store',version,size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};m.signature=crypto.sign(null,Buffer.from(trust.payload(m)),keys.privateKey).toString('base64');return {m,key:keys.publicKey}};
test('Store manifest signature binds channel, version, and content; server rejects changed bytes',async()=>{
 const bytes=Buffer.from('test installer'),{m,key}=signed(bytes),server=await import('../dist/api/store-native-update.js'),release={version:m.version,bytes:bytes.length,name:'PhotoBridge-Store-Setup-1.0.4-x64.exe',objectKey:'test'};
 assert.equal(trust.valid(m,key),true);assert.equal(trust.valid({...m,channel:'lab'},key),false);assert.equal(trust.valid({...m,version:'1.0.5'},key),false);
 assert.deepEqual(await server.validateStoreUpdate(m,release,async()=>({Body:[bytes]}),key),m);
 await assert.rejects(server.validateStoreUpdate(m,release,async()=>({Body:[Buffer.from('test installeX')]}),key),/update_hash_mismatch/);
});
test('native installer checks download and rejects account switch before launch',async()=>{
 const bytes=Buffer.from('test executable'),{m,key}=signed(bytes),dir=await fs.mkdtemp(path.join(os.tmpdir(),'pb2095-'));let account='shopA:userA',launches=0;
 try{const updater=new AppUpdate({directory:dir,publicKey:key,version:'1.0.3',getAccount:()=>account,request:async url=>url.endsWith('/installer')?{ok:true,body:[bytes]}:response({update:m}),canInstall:async()=>true,launch:async()=>{launches++},quit:async()=>{}});
 assert.equal((await updater.check()).state,'ready');account='shopB:userA';await assert.rejects(updater.install(),/update_not_ready/);assert.equal(launches,0);
 account='shopA:userA';await updater.check();await fs.writeFile(path.join(dir,m.sha256+'.exe'),Buffer.from('corrupt'));await assert.rejects(updater.install(),/update_size_mismatch/);assert.equal(launches,0);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
test('notification API rejects unrelated shops and scopes read to shop and user',async()=>{
 const {storeNativeNotificationRoute,eventView}=await import('../dist/api/store-native-events.js');let status,data;const calls=[],shop={id:'shopA',business_category:'equipment_rental_sale'},a={userId:'userA',rentalRole:'shop_admin'};
 const run=async(over={})=>storeNativeNotificationRoute({req:{method:'GET'},url:new URL('https://local/api/rental/notifications/desktop'),res:{},a,pool:{query:async(sql,args)=>{calls.push({sql,args});return calls.length===1?{rowCount:1}:{rows:[]}}},shopFor:async()=>shop,sendJson:(_r,s,d)=>{status=s;data=d},bodyJson:async()=>({ids:['11111111-1111-1111-1111-111111111111']}),...over});
 await run({a:{...a,adminStorePreview:true}});assert.equal(status,403);assert.equal(calls.length,0);
 await run({shopFor:async()=>({...shop,business_category:'frame_chassis'})});assert.equal(status,403);assert.equal(calls.length,0);
 await run();assert.equal(status,200);assert.equal(data.shopId,'shopA');assert.deepEqual(calls[1].args.slice(0,2),['shopA','userA']);
 calls.length=0;await run({req:{method:'POST'},url:new URL('https://local/api/rental/notifications/desktop/read')});assert.equal(status,200);assert.deepEqual(calls[1].args.slice(0,2),['shopA','userA']);assert.match(calls[1].sql,/WHERE shop_id=\$1/);
 assert.match(eventView({id:'1',kind:'booking_status',status:'cancelled'}).title,/لغو/);
 assert.match(eventView({id:'2',kind:'cooperation_new',status:'pending'}).title,/همکاری/);
});
test('native queue retains unacknowledged items offline and ignores late responses from old account',async()=>{
 const kv=new Map(),seen=[];let account='shopA:userA',offline=false,release=null;const event={id:'a',title:'new',target:'sales'};
 const alerts=new StoreAlerts({store:{get:k=>kv.get(k),set:(k,v)=>kv.set(k,v)},getAccount:()=>account,request:async()=>{if(offline)throw Error('offline');if(release)await release;return response({shopId:'shopA',notifications:[event]})},present:async(o)=>seen.push(o.items),dismiss:()=>{}});
 await alerts.poll();assert.equal(seen.at(-1)[0].id,'a');offline=true;await alerts.poll();assert.equal(seen.length,2);
 offline=false;let finish;release=new Promise(r=>{finish=r});const pending=alerts.poll();account='shopB:userA';finish();await pending;assert.equal(seen.length,2);
 account='shopA:userA';offline=true;await alerts.acknowledge(account,['a']);await alerts.poll();assert.deepEqual(kv.get(alerts.key(account,'pending')),[]);assert.deepEqual(kv.get(alerts.key(account,'ack')),['a']);
});
test('build transforms remain idempotent and isolate the Store integration',async()=>{
 const {patchServer,patchAdmin}=await import('./enable-r2095-store-native.mjs');
 for(const [file,patch,needle] of [['dist/api/server.js',patchServer,'storeNativeNotificationRoute'],['dist/web/photobridge-admin-desktop-release-v62.js',patchAdmin,'data-update-manifest']]){const current=await fs.readFile(file,'utf8'),next=patch(current);assert.ok(next.includes(needle));assert.equal(patch(next),next)}
 const native=require('./integrate-r2095-store-native.cjs');try{const main=await fs.readFile('apps/store-desktop/main.cjs','utf8'),next=native.patchMain(main);assert.equal(native.patchMain(next),next);assert.ok(next.includes('storeAlerts.start()'));new Function(next)}catch(e){if(e.code!=='ENOENT')throw e}
});
