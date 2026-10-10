// Isolated PostgreSQL fixtures; no production SMS, data or migrations.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {PGlite}=require(process.env.PHOTOBRIDGE_TEST_PGLITE_MODULE||'@electric-sql/pglite');
const source=fs.readFileSync(path.join(__dirname,'../dist/api/server.js'),'utf8');
const slice=(from,to)=>source.slice(source.indexOf(from),source.indexOf(to,source.indexOf(from)));
test('removed retouch registration endpoints reject both new and outstanding OTP signups without writes',async()=>{
 const from=source.indexOf('    // Retouch no longer creates'),to=source.indexOf('    // v0.17.590:',from),AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 const handler=new AsyncFunction('req','res','url','sendJson',source.slice(from,to));
 for(const suffix of ['start','verify']){const result=await handler({method:'POST'},{},new URL('https://test/api/public/retouch-account/register/'+suffix),(_,status,body)=>({status,body}));assert.equal(result.status,410);assert.equal(result.body.error,'public_retouch_signup_disabled')}
 assert.equal(source.includes('async function ensurePublicRetouchAccount('),false);
});
test('rental customer labels replace generated retouch names with mobile until photographer enrollment',()=>{
 const ctx=vm.createContext({});vm.runInContext(slice('function equipmentRentalCustomerLabel(','async function equipmentRentalAccountingOverview('),ctx);
 assert.equal(ctx.equipmentRentalCustomerLabel('کاربر روتوش 0001','09120000001'),'09120000001');assert.equal(ctx.equipmentRentalCustomerLabel('آتلیه تست','09120000001'),'آتلیه تست');
});
test('mobile and desktop retouch entry offers existing-account login without quick signup',async()=>{
 const {chromium}=require('playwright'),browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const script=fs.readFileSync(path.join(__dirname,'../dist/web/photobridge-retouch-v595.js'),'utf8'),start=script.indexOf('  function renderQuickAuthGate()'),end=script.indexOf('  async function restoreActivePublicOrder',start);
 try{for(const viewport of [{width:390,height:844},{width:1366,height:768}]){
  const page=await browser.newPage({viewport});await page.route('https://retouch.test/ai',r=>r.fulfill({contentType:'text/html',body:'<div class="publicAiFormCard"><h2 class="publicAiSectionTitle">روتوش</h2></div>'}));await page.goto('https://retouch.test/ai');
  await page.addScriptTag({content:`window.state={sessionReady:true,sessionUser:null};window.calls=[];window.syncPublicRetouchLock=()=>{};window.publicRetouchAuthenticated=()=>Boolean(state.sessionUser);window.scrubRetouchMobileAutofill=()=>{};window.esc=String;window.normMobile=String;window.isAdminMobile=()=>false;window.authErrorFa=String;window.applySession=j=>{state.sessionUser=j.user;renderQuickAuthGate()};window.restoreActivePublicOrder=async()=>{};window.originalFetch=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:true,json:async()=>({user:{userId:'old-account',mobile:'09120000001'}})}};`+script.slice(start,end)+';renderQuickAuthGate();'});
  assert.equal(await page.locator('[data-pb587="signup"],[data-pb587-tab="signup"],input[autocomplete="new-password"]').count(),0);
  await page.locator('[data-pb587="login-mobile"]').fill('09120000001');await page.locator('[data-pb587="login-password"]').fill('existing-password');await page.locator('[data-pb587="login"]').click();await page.waitForSelector('.pb587AuthReady');
  assert.deepEqual(await page.evaluate(()=>calls.map(x=>x.url)),['/api/auth/login']);await page.close();
 }}finally{await browser.close()}
});
test('verified rental invitation upgrades the same retouch identity, password and profile while retaining orders',async()=>{
 const db=new PGlite(),user='00000000-0000-0000-0000-000000000001',shop='00000000-0000-0000-0000-000000000002',lab='00000000-0000-0000-0000-000000000003';
 try{
  await db.exec(`CREATE TABLE users(id uuid PRIMARY KEY,name text,mobile text UNIQUE,password_hash text,platform_role text,active boolean,photographer_enabled boolean DEFAULT false,public_retouch_enabled boolean,force_password_change boolean DEFAULT false,mobile_verified_at timestamp,location_lat double precision,location_lng double precision,location_address text,location_updated_at timestamp,updated_at timestamp,created_at timestamp DEFAULT now(),account_deleted_at timestamp,photographer_joined_at timestamp,photographer_active_lab_id uuid,photographer_origin_invite_type text);
   CREATE TABLE photographer_profiles(user_id uuid PRIMARY KEY REFERENCES users(id),studio_name text,password_hash text,province text,city text,location_lat double precision,location_lng double precision,location_address text,created_at timestamp DEFAULT now(),updated_at timestamp,birth_jalali text);
   CREATE TABLE public_ai_orders(id text PRIMARY KEY,user_id uuid REFERENCES users(id) ON DELETE RESTRICT);
   CREATE TABLE lab_memberships(lab_id uuid,user_id uuid,role text,active boolean,UNIQUE(lab_id,user_id));
   CREATE TABLE photographer_invite_redemptions(user_id uuid);
   CREATE TABLE equipment_rental_shops(id uuid PRIMARY KEY,active boolean,active_from timestamp,active_until timestamp);
   CREATE TABLE equipment_rental_shop_memberships(shop_id uuid,user_id uuid,role text,active boolean,updated_at timestamp,opening_debt bigint,birth_jalali text,national_id text,birth_certificate_no text,business_license_no text,business_license_image_object_key text,business_license_image_name text,business_license_image_content_type text,business_license_image_bytes bigint,UNIQUE(shop_id,user_id,role));
   CREATE TABLE equipment_rental_accounting_entries(shop_id uuid,photographer_id uuid,entry_type text);
   CREATE TABLE signup_mobile_verifications(id text PRIMARY KEY,kind text,mobile text,payload jsonb,password_hash text,status text,expires_at timestamp,attempts integer DEFAULT 0,code_hash text,verified_at timestamp,used_at timestamp);
   INSERT INTO users(id,name,mobile,password_hash,platform_role,active,public_retouch_enabled) VALUES('${user}','کاربر روتوش 0001','09120000001','old-hash','user',true,true);
   INSERT INTO public_ai_orders VALUES('retained-order','${user}');INSERT INTO equipment_rental_shops VALUES('${shop}',true,NULL,NULL);
   INSERT INTO equipment_rental_shop_memberships(shop_id,user_id,role,active) VALUES('${shop}','${user}','photographer',true);`);
  const hash=(id,code)=>crypto.createHash('sha256').update(id+':'+code).digest('hex');
  const payload={inviteCode:'TEST',name:'آتلیه جدید',province:'تهران',city:'تهران',locationLat:35,locationLng:51,locationAddress:'نشانی',birthJalali:'1370/01/01',nationalId:'0012345678'};
  await db.query("INSERT INTO signup_mobile_verifications VALUES('challenge','photographer','09120000001',$1,'new-hash','pending',now()+interval '1 hour',0,$2,NULL,NULL)",[payload,hash('challenge','123456')]);
  const ctx=vm.createContext({pool:{connect:async()=>({query:(...args)=>db.query(...args),release(){}})},normalizeMobile:x=>x,normalizePhotographerInviteCode:x=>x,photographerInviteByCode:async()=>({id:'invite',issuer_type:'rental',issuer_rental_shop_id:shop,metadata:{}}),photographerInviteUsable:()=>true,equipmentRentalShopSubscriptionActive:()=>true,isValidIranLocation:()=>true,ensureStandalonePhotographerLab:async()=>({id:lab}),ensureEquipmentRentalV620Schema:async()=>{},equipmentRentalMoney:x=>Number(x||0),recordPhotographerInviteRedemptionPostCommit:async()=>{},provisionPhotographerOptionalServices:async()=>{},safeEqualText:(a,b)=>a===b,otpCodeHash:hash});
  vm.runInContext(slice('async function photographerProfileByUserId(','async function provisionPhotographerOptionalServices('),ctx);
  vm.runInContext(slice('async function equipmentRentalEnsurePhotographerLink(','async function equipmentRentalEnsurePhotographerPreRegistration('),ctx);
  vm.runInContext(slice('async function lockAndVerifySignupChallenge(','async function resolvePasswordResetUser('),ctx);
  assert.equal((await ctx.photographerIdentityByMobile(db,'09120000001')).existingPhotographer,false,'store preregistration and retouch account are not photographer membership');
  await assert.rejects(ctx.completePublicPhotographerSignupVerification('challenge','000000',0),/invalid_otp/);
  let row=(await db.query('SELECT * FROM users WHERE id=$1',[user])).rows[0];assert.equal(row.password_hash,'old-hash');assert.equal(row.public_retouch_enabled,true);assert.equal((await db.query('SELECT * FROM photographer_profiles')).rows.length,0);
  const result=await ctx.completePublicPhotographerSignupVerification('challenge','123456',0);assert.equal(result.userId,user);assert.equal(result.reusedExisting,true);
  row=(await db.query('SELECT * FROM users WHERE id=$1',[user])).rows[0];assert.equal(row.name,'آتلیه جدید');assert.equal(row.password_hash,'new-hash');assert.equal(row.public_retouch_enabled,false);assert.equal(row.photographer_enabled,true);
  const profile=(await db.query('SELECT * FROM photographer_profiles WHERE user_id=$1',[user])).rows[0];assert.equal(profile.studio_name,'آتلیه جدید');assert.equal(profile.password_hash,'new-hash');assert.equal(profile.birth_jalali,'1370/01/01');
  assert.equal((await db.query('SELECT count(*) FROM users')).rows[0].count,1);assert.equal((await db.query('SELECT user_id FROM public_ai_orders')).rows[0].user_id,user);assert.equal((await db.query('SELECT national_id FROM equipment_rental_shop_memberships')).rows[0].national_id,'0012345678');
  assert.equal((await ctx.photographerIdentityByMobile(db,'09120000001')).existingPhotographer,true);
  await assert.rejects(ctx.completePublicPhotographerSignupVerification('challenge','123456',0),/otp_expired/);
  for(const identity of [{...row,existingPhotographer:true},{...row,existingPhotographer:false,platform_role:'platform_admin',public_retouch_enabled:true,name:'کاربر روتوش 0001'}])assert.equal(await ctx.upgradeLegacyRetouchPhotographer(db,identity,{name:'Wrong',passwordHash:'wrong-hash'}),false);
  assert.equal((await db.query('SELECT password_hash FROM users')).rows[0].password_hash,'new-hash');
 }finally{await db.close()}
});
