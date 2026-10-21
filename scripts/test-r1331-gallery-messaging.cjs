const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {PGlite}=require(process.env.PB_PGLITE_PATH||'@electric-sql/pglite');
const owner='11111111-1111-4111-8111-111111111111',galleryId='22222222-2222-4222-8222-222222222222',other='33333333-3333-4333-8333-333333333333';
const server=fs.readFileSync('dist/api/server.js','utf8');
function extract(name){const start=server.indexOf('async function '+name+'('),end=server.indexOf('\nasync function ',start+20);assert(start>=0&&end>start);return server.slice(start,end)}
async function fixture(){
 const db=new PGlite();await db.exec(`
 CREATE TABLE platform_settings(key text PRIMARY KEY,value jsonb,updated_at timestamptz DEFAULT now());
 CREATE TABLE photographer_client_galleries(id uuid PRIMARY KEY,owner_id uuid,title text,customer_mobile text,public_token text,status text,expires_at timestamptz);
 CREATE TABLE photographer_gallery_orders(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),gallery_id uuid,owner_id uuid,status text,is_current boolean DEFAULT true);
 CREATE TABLE photographer_service_wallets(user_id uuid PRIMARY KEY,balance bigint CHECK(balance>=0),updated_at timestamptz DEFAULT now());
 CREATE TABLE photographer_service_wallet_transactions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,service_key text,kind text,amount bigint,balance_after bigint,reference_type text,reference_id text,reference_key text UNIQUE,note text,metadata jsonb);
 `);
 await db.query(`INSERT INTO photographer_client_galleries VALUES($1,$2,'گالری','09123456789','private-token','published',now()+interval '10 days')`,[galleryId,owner]);
 await db.query(`INSERT INTO photographer_service_wallets(user_id,balance) VALUES($1,2000)`,[owner]);
 await db.query(`INSERT INTO photographer_gallery_orders(gallery_id,owner_id,status) VALUES($1,$2,'awaiting_approval')`,[galleryId,owner]);
 const state={service:{enabled:true,customer_enabled:true,effective_price:500,name:'SMS'},gateway:true,fail:false,sends:[],logs:[]};
 const pool={query:async(sql,args)=>{const r=await db.query(sql,args);return {...r,rowCount:r.rows.length||r.affectedRows||0}},connect:async()=>({query:pool.query,release(){}})};
 const ctx={pool,crypto,console,normalizeMobile:x=>String(x).replace(/[\s-]/g,''),resolvedSMSSettings:async()=>({configured:state.gateway,provider:'test'}),SMS_PROVIDER_ADAPTERS:{test:async(mobile,message)=>{state.sends.push({mobile,message});if(state.fail)throw Error('sms_provider_rejected');return {reference:'sent'};}},logSms:async args=>state.logs.push(args),photographerWalletEnsure:async()=>{},photographerEffectivePrice:async()=>state.service};
 vm.createContext(ctx);vm.runInContext(extract('reservePhotographerWalletCharge')+'\n'+extract('refundPhotographerWalletCharge')+'\n'+extract('sendSms')+'\nthis.send=sendSms;this.reserve=reservePhotographerWalletCharge;',ctx);
 const {createGalleryMessaging}=await import('../dist/api/gallery-messaging.js');const sms=createGalleryMessaging({pool,sendSms:ctx.send,price:async()=>state.service,configured:async()=>state.gateway,normalizeMobile:ctx.normalizeMobile,publicAppUrl:'https://photobridge.ir'});
 const balance=async()=>Number((await db.query('SELECT balance FROM photographer_service_wallets WHERE user_id=$1',[owner])).rows[0].balance);
 return {db,pool,state,sms,balance,ctx,enable:()=>sms.save(galleryId,owner,{ownerEnabled:true,customerEnabled:true})};
}
async function run(fn){const f=await fixture();try{await fn(f)}finally{await f.db.close()}}
test('consent defaults off and gallery ownership is enforced',()=>run(async({sms,state,balance})=>{
 const q=await sms.snapshot(galleryId,owner);assert.deepEqual(q.preferences,{ownerEnabled:false,customerEnabled:false});assert.equal(q.unitPrice,500);assert.equal(q.balance,2000);
 await assert.rejects(sms.customer(galleryId,owner,{kind:'selection',requestId:'test-default',quotedPrice:500}),/gallery_customer_sms_disabled/);
 await assert.rejects(sms.save(galleryId,other,{ownerEnabled:true,customerEnabled:true}),/gallery_not_found/);
 assert.equal(state.sends.length,0);assert.equal(await balance(),2000);
}));
test('send selection link charges once; repeated request never sends or charges twice',()=>run(async({sms,enable,state,balance,db})=>{
 await enable();const request={kind:'selection',requestId:'test-repeat',quotedPrice:500};
 const first=await sms.customer(galleryId,owner,request);assert.equal(first.chargedAmount,500);assert.equal(await balance(),1500);assert.equal(state.sends.length,1);assert(state.sends[0].message.includes('https://photobridge.ir/g/private-token'));
 const second=await sms.customer(galleryId,owner,request);assert.equal(second.alreadySent,true);assert.equal(await balance(),1500);assert.equal(state.sends.length,1);
 assert.equal(state.logs[0].metadata.walletTransactionId, (await db.query("SELECT id FROM photographer_service_wallet_transactions WHERE kind='debit'")).rows[0].id);
}));
test('concurrent identical send claims permit only one provider call',()=>run(async({sms,enable,state,balance})=>{
 await enable();const req={kind:'selection',requestId:'test-concurrent',quotedPrice:500};const out=await Promise.allSettled([sms.customer(galleryId,owner,req),sms.customer(galleryId,owner,req)]);assert(out.some(x=>x.status==='fulfilled'));assert.equal(state.sends.length,1);assert.equal(await balance(),1500);
}));
test('provider failure refunds photographer, and retrying the same request does not debit again',()=>run(async({sms,enable,state,balance,db})=>{
 await enable();state.fail=true;const req={kind:'selection',requestId:'test-failure',quotedPrice:500};await assert.rejects(sms.customer(galleryId,owner,req),/sms_provider_rejected/);assert.equal(await balance(),2000);
 const rows=await db.query('SELECT kind,amount FROM photographer_service_wallet_transactions ORDER BY kind');assert.deepEqual(rows.rows.map(x=>x.kind),['debit','refund']);assert(state.logs[0].metadata.refunded);
 await assert.rejects(sms.customer(galleryId,owner,req),/gallery_sms_already_attempted/);assert.equal(state.sends.length,1);assert.equal(await balance(),2000);
}));
test('insufficient credit, disabled gateway/service and price changes do not send',()=>run(async({sms,enable,state,balance,db,ctx})=>{
 await enable();const req={kind:'selection',requestId:'test-disabled',quotedPrice:500};
 state.gateway=false;await assert.rejects(sms.customer(galleryId,owner,req),/gallery_sms_unavailable/);state.gateway=true;
 state.service.customer_enabled=false;await assert.rejects(sms.customer(galleryId,owner,req),/gallery_sms_unavailable/);state.service.customer_enabled=true;
 await assert.rejects(sms.customer(galleryId,owner,{...req,quotedPrice:400}),/gallery_sms_price_changed/);
 await assert.rejects(ctx.reserve({userId:owner,serviceKey:'sms_customer_notification',expectedAmount:400}),/gallery_sms_price_changed/);
 await db.query('UPDATE photographer_service_wallets SET balance=100');await assert.rejects(sms.customer(galleryId,owner,req),/service_wallet_insufficient/);assert.equal(state.sends.length,0);assert.equal(await balance(),100);
}));
test('approval SMS needs the approval stage, an active gallery and a saved mobile',()=>run(async({sms,enable,state,db})=>{
 await enable();const req={kind:'approval',requestId:'test-approval',automatic:true};
 await db.query("UPDATE photographer_gallery_orders SET status='retouching'");await assert.rejects(sms.customer(galleryId,owner,req),/gallery_approval_not_ready/);
 await db.query("UPDATE photographer_gallery_orders SET status='awaiting_approval'");await db.query("UPDATE photographer_client_galleries SET customer_mobile=''");await assert.rejects(sms.customer(galleryId,owner,req),/gallery_customer_mobile_required/);
 await db.query("UPDATE photographer_client_galleries SET customer_mobile='09123456789',status='draft'");await assert.rejects(sms.customer(galleryId,owner,req),/gallery_not_published/);
 await db.query("UPDATE photographer_client_galleries SET status='published'");assert((await sms.customer(galleryId,owner,req)).sent);assert(state.sends[0].message.includes('روتوش‌شده'));
}));
test('owner SMS is opt in, charges the correct wallet, and preserves free in-app notifications',()=>run(async({sms,enable,state,balance})=>{
 const args={mobile:'09123456789',message:'انتخاب‌ها نهایی شد',purpose:'gallery_owner_notification',userId:owner,metadata:{galleryId}};
 assert((await sms.owner(args)).skipped);assert.equal(await balance(),2000);
 await enable();await sms.owner(args);assert.equal(state.sends.length,1);assert.equal(await balance(),1500);
 await sms.save(galleryId,owner,{ownerEnabled:false,customerEnabled:false});assert.deepEqual(await sms.customer(galleryId,owner,{kind:'approval',requestId:'test-auto-off',automatic:true}),{sent:false,reason:'disabled'});
}));
test('a zero-priced enabled SMS service does not create a debit',()=>run(async({sms,enable,state,balance,db})=>{
 await enable();state.service.effective_price=0;
 const out=await sms.customer(galleryId,owner,{kind:'selection',requestId:'test-free-sms',quotedPrice:0});assert.equal(out.chargedAmount,0);assert.equal(await balance(),2000);assert.equal(state.sends.length,1);assert.equal((await db.query('SELECT * FROM photographer_service_wallet_transactions')).rows.length,0);
}));
test('concurrent approval actions transition once and send only one paid SMS',()=>run(async({db,pool,sms,enable,state,balance})=>{
 await enable();await db.exec(`ALTER TABLE photographer_client_galleries ADD COLUMN post_completion_days_snapshot integer DEFAULT 7;ALTER TABLE photographer_gallery_orders ADD COLUMN retouch_sent_at timestamptz;ALTER TABLE photographer_gallery_orders ADD COLUMN revision_note text;ALTER TABLE photographer_gallery_orders ADD COLUMN updated_at timestamptz DEFAULT now();CREATE TABLE photographer_gallery_order_items(order_id uuid,media_id uuid);CREATE TABLE photographer_gallery_retouch_proofs(order_id uuid,media_id uuid,upload_state text);`);
 const order=(await db.query('SELECT id FROM photographer_gallery_orders')).rows[0].id;
 await db.query("UPDATE photographer_gallery_orders SET status='retouching'");
 await db.query('INSERT INTO photographer_gallery_order_items VALUES($1,$2)',[order,other]);
 const start=server.indexOf("        if (galleryOrderAction && req.method === 'POST')"),end=server.indexOf('        const retouchPresign',start);assert(start>0&&end>start);
 const handler=Function('pool','galleryMessaging','bodyJson','sendJson','galleryOrderAction',`return async(req,res,a)=>{${server.slice(start,end)}}`)(pool,sms,async()=>({action:'send_approval'}),(_,status,data)=>({status,data}),['',galleryId,order]);
 const missing=await handler({method:'POST'},{},{userId:owner});assert.equal(missing.status,409);assert.equal(missing.data.error,'gallery_retouch_proof_required');assert.equal(state.sends.length,0);
 await db.query("INSERT INTO photographer_gallery_retouch_proofs VALUES($1,$2,'active')",[order,other]);
 const results=await Promise.all([handler({method:'POST'},{},{userId:owner}),handler({method:'POST'},{},{userId:owner})]);assert.deepEqual(results.map(x=>x.status).sort(),[200,409]);assert.equal(state.sends.length,1);assert.equal(await balance(),1500);
}));
