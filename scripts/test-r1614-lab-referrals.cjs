const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),{pathToFileURL}=require('node:url');
const read=p=>fs.readFileSync(p,'utf8'),importJs=p=>import(pathToFileURL(path.resolve(p)).href);
test('R1614 promotion: 30% subscription benefit and 10% only on confirmed paid amount',async()=>{
 const p=await importJs('dist/api/lab-referral-policy.js');
 assert.equal(p.validLabReferralCode('abcdef1234567890'),true);
 assert.equal(p.validLabReferralCode('abc'),false);
 assert.equal(p.validLabReferralMobile('09123456789'),true);
 assert.equal(p.validLabReferralMobile('0912345678'),false);
 const original={amount:1000000,specialDiscountAmount:0};
 assert.equal(p.applyLabReferralDiscount(30,1000000,original).amount,700000);
 assert.equal(p.applyLabReferralDiscount(0,1000000,original).amount,1000000);
 assert.equal(p.applyLabReferralDiscount(30,1000000,{amount:650000,specialDiscountAmount:350000}).amount,650000,'keep any better pre-existing discount');
 assert.equal(p.labReferralRewardAmount(700000),70000);
 assert.equal(p.labReferralRewardAmount(699999),69999);
 assert.equal(p.labReferralRewardAmount(-100),0);
 assert.equal(p.labReferralRewardAmount(900000,11),0);
});
test('R1614 reward is one transaction per source; credit cannot repeat after callback retries',async()=>{
 const {rewardInvitingLab}=await importJs('dist/api/lab-referral-policy.js');
 let claimed=false,balance=8000,credits=0;
 const db={query:async(sql,args)=>{
  if(sql.startsWith('SELECT referrer_lab_id'))return{rows:[{referrer_lab_id:'referrer',referrer_reward_percent:10}],rowCount:1};
  if(sql.startsWith('INSERT INTO lab_referral_rewards'))return claimed?{rows:[],rowCount:0}:(claimed=true,{rows:[{id:'reward'}],rowCount:1});
  if(sql.startsWith('SELECT balance'))return{rows:[{balance}],rowCount:1};
  if(sql.startsWith('UPDATE lab_service_wallets')){balance=args[1];return{rowCount:1}};
  if(sql.startsWith('INSERT INTO service_wallet_transactions')){credits++;return{rows:[{id:'tx'}],rowCount:1}};
  if(sql.startsWith('UPDATE lab_referral_rewards'))return{rowCount:1};
  throw Error('unexpected SQL '+sql.slice(0,80));
 }};
 const args={referredLabId:'referred',sourceKind:'subscription',sourceId:'paid-1',paidAmount:700000,ensureWallet:async()=>{}};
 assert.equal((await rewardInvitingLab(db,args)).reward,70000);
 assert.equal(await rewardInvitingLab(db,args),null);
 assert.equal(balance,78000);
 assert.equal(credits,1);
});
test('R1614 registration attribution requires a valid invite, prevents self-referral, and stores only one referrer',async()=>{
 const {attachVerifiedLabReferral}=await importJs('dist/api/lab-referral-policy.js');
 const db={query:async(sql)=>{
  if(sql.startsWith('SELECT i.id'))return{rows:[{id:'invite-1',referrer_lab_id:'old-lab'}],rowCount:1};
  if(sql.startsWith('INSERT INTO lab_referral_memberships'))return{rows:[{referred_lab_id:'new-lab'}],rowCount:1};
  throw Error('unexpected SQL '+sql.slice(0,90));
 }};
 assert.deepEqual(await attachVerifiedLabReferral(db,'1234ABCD5678EF90','new-lab'),{referrerLabId:'old-lab',discountPercent:30,rewardPercent:10});
 await assert.rejects(()=>attachVerifiedLabReferral(db,'1234ABCD5678EF90','old-lab'),/lab_referral_self/);
});
test('R1614 isolated migration adds unique links, rewards, wallet redemption keys and preserves old invite schemas',()=>{
 const sql=read('migrations/195_lab_referral_program.sql');
 for(const name of ['lab_referral_invites','lab_referral_sent_invites','lab_referral_memberships','lab_referral_rewards','lab_referral_wallet_renewals'])assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS '+name));
 assert.match(sql,/UNIQUE\(source_kind,source_id\)/);
 assert.match(sql,/UNIQUE\(lab_id,request_key\)/);
 assert.match(sql,/CHECK \(referred_discount_percent = 30\)/);
 assert.doesNotMatch(sql,/photographer_invites|photographer_service_wallet_transactions/);
});
test('R1614 authenticated backend route hooks and confirmed payment credits are present',()=>{
 const api=read('dist/api/server.js');
 assert.match(api,/R1614 lab referrals/);
 assert.match(api,/attachVerifiedLabReferral/);
 assert.match(api,/handleLabReferralWalletRenewal/);
 assert.match(api,/labReferralCode=String\(b.labReferralCode/);
 assert.match(api,/sourceKind:'subscription'/);
 assert.match(api,/sourceKind:'wallet_topup'/);
 assert.match(api,/sourceKind:'wallet_manual_topup'/);
 const wallet=read('dist/api/lab-referral-wallet-renewal.js');
 assert.match(wallet,/FOR UPDATE/);
 assert.match(wallet,/requestKey/);
 assert.match(wallet,/alreadyProcessed:true/);
 assert.match(wallet,/wallet_insufficient/);
 assert.doesNotMatch(wallet,/rewardInvitingLab/,'wallet-redeemed subscription cannot create a new commission');
 assert.doesNotMatch(wallet,/INSERT INTO platform_payments/,'spending already-issued wallet credit must not inflate cash revenue');
});
test('R1614 shared UI and Windows manifest integrity',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const app=read(root+'/assets/index-UIRefine-v655-r84.js');
  const css=read(root+'/photobridge-r1614-lab-referrals.css');
  const html=read(root+'/index.html');
  assert.match(app,/function PB1614LabReferrals\(\)/);
  assert.match(app,/g==="referrals"&&e.jsx\(PB1614LabReferrals/);
  assert.match(app,/labReferralCode:t.labReferralCode/);
  assert.match(app,/\/api\/lab\/referrals\/send/);
  assert.match(app,/\/api\/lab\/referrals\/wallet-renewal/);
  assert.match(css,/\.pb1614Referral/);
  assert.match(html,/photobridge-r1614-lab-referrals\.css\?v=r1614/);
  assert.match(html,/labReferral=r1614/);
 }
 const root='dist/web/lab-desktop-ui',m=JSON.parse(read(root+'/manifest.json'));
 for(const name of ['assets/index-UIRefine-v655-r84.js','index.html','photobridge-r1614-lab-referrals.css']){
  const item=m.files.find(x=>x.name===name);
  assert.ok(item,name);
  assert.equal(item.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
 assert.equal(m.build,crypto.createHash('sha256').update(JSON.stringify(m.files)).digest('hex'));
});
