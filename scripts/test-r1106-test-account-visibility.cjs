const {test}=require('node:test'),assert=require('node:assert/strict'),{Pool}=require('pg'),crypto=require('node:crypto');
const testDatabaseUrl=process.env.PB_TEST_DATABASE_URL||process.env.DATABASE_URL||'';
function requireLocalDatabase(){
 const url=new URL(testDatabaseUrl);
 if(!testDatabaseUrl.includes('host=/workspace/photobridge-env/run')&&!(url.hostname==='127.0.0.1'&&url.pathname==='/photobridge_test'))throw Error('Only a disposable local test database is permitted');
}
test('real PostgreSQL: mobile-based test visibility, targeted invitations and accepted invitations',async()=>{
 requireLocalDatabase();
 const {testAccountVisibleSql,testAccountSql,adminMobileViewerSql}=await import('../dist/api/test-account-visibility.js');
 const {isProductionShop}=await import('../dist/api/frame-production.js');
 const pool=new Pool({connectionString:testDatabaseUrl}),db=await pool.connect();
 try{
 await db.query('BEGIN');
 await db.query(`CREATE TEMP TABLE users(id uuid PRIMARY KEY,mobile text,platform_role text,active boolean);
 CREATE TEMP TABLE equipment_rental_shops(id uuid PRIMARY KEY,name text,manager_mobile text,private_admin_only boolean);
 CREATE TEMP TABLE equipment_rental_shop_memberships(shop_id uuid,user_id uuid,role text,active boolean);
 CREATE TEMP TABLE photographer_profiles(user_id uuid,province text,city text);
 CREATE TEMP TABLE labs(id uuid PRIMARY KEY,name text);
 CREATE TEMP TABLE lab_memberships(lab_id uuid,user_id uuid,role text,active boolean);
 CREATE TEMP TABLE photographer_invites(id uuid PRIMARY KEY,issuer_type text,issuer_rental_shop_id uuid,issuer_lab_id uuid,target_mobile text,active boolean,expires_at timestamptz,max_uses int,uses int);
 CREATE TEMP TABLE photographer_invite_redemptions(invite_id uuid,user_id uuid);`);
 const ids=Object.fromEntries(['admin','outsider','invited','unrelated','testShop','testLab','publicShop','publicLab','otherTestShop'].map(k=>[k,crypto.randomUUID()]));
 for(const [key,mobile,role]of[['admin','09125678720','platform_admin'],['outsider','09120000101','user'],['invited','09120000102','user'],['unrelated','09120000103','user']])await db.query('INSERT INTO users VALUES($1,$2,$3,true)',[ids[key],mobile,role]);
 await db.query('INSERT INTO equipment_rental_shops VALUES($1,\'Ordinary test name\',\'+989125678720\',false),($2,\'سوفیا\',\'09129999999\',true),($3,\'Second test\',\'۰۹۱۲۵۶۷۸۷۲۰\',false)',[ids.testShop,ids.publicShop,ids.otherTestShop]);
 await db.query('INSERT INTO labs VALUES($1,\'Normal lab\'),($2,\'سوفیا\')',[ids.testLab,ids.publicLab]);
 await db.query('INSERT INTO lab_memberships VALUES($1,$2,\'lab_admin\',true)',[ids.testLab,ids.admin]);
 const visible=async(kind,user)=>{const table=kind==='shop'?'equipment_rental_shops':'labs';return (await db.query(`SELECT s.id FROM ${table} s WHERE ${testAccountVisibleSql(kind,'s','$1')}`,[ids[user]])).rows.map(x=>x.id).sort()};
 assert.deepEqual(await visible('shop','outsider'),[ids.publicShop]);assert.deepEqual(await visible('lab','outsider'),[ids.publicLab]);
 assert.deepEqual(await visible('shop','admin'),[ids.testShop,ids.publicShop,ids.otherTestShop].sort());assert.deepEqual(await visible('lab','admin'),[ids.testLab,ids.publicLab].sort());
 const invites={};for(const [kind,target]of[['rental',ids.testShop],['lab',ids.testLab]]){
 const invite=crypto.randomUUID();invites[kind]=invite;
 await db.query('INSERT INTO photographer_invites VALUES($1,$2,$3,$4,$5,true,now()+interval \'1 day\',1,0)',[invite,kind,kind==='rental'?target:null,kind==='lab'?target:null,'+989120000102']);
 }
 assert.deepEqual(await visible('shop','invited'),[ids.testShop,ids.publicShop].sort());assert.deepEqual(await visible('lab','invited'),[ids.testLab,ids.publicLab].sort());
 assert.deepEqual(await visible('shop','unrelated'),[ids.publicShop]);
 const fs=require('node:fs'),vm=require('node:vm'),server=fs.readFileSync('dist/api/server.js','utf8');
 const functions=server.slice(server.indexOf('async function equipmentRentalPhotographerCanDiscoverShop('),server.indexOf('async function equipmentRentalCreateBooking('));
 const gates=vm.runInNewContext(functions+';({discover:equipmentRentalPhotographerCanDiscoverShop,access:equipmentRentalPhotographerCanAccessShop})',{
  isProductionShop,ensureEquipmentRentalV727Schema:async()=>{},equipmentRentalShopSubscriptionActive:()=>true,
  photographerInitialInviteType:async()=> 'rental',equipmentRentalInvitedShopIds:async()=>[],reachAllows:()=>true,testAccountVisibleSql,testAccountSql,adminMobileViewerSql
 });
 assert.equal(await gates.discover(db,ids.invited,ids.testShop),true,'targeted test invite must work even before redemption and across origin scope');
 assert.equal(await gates.discover(db,ids.admin,ids.otherTestShop),true,'admin mobile sees all its test shops');
 assert.equal(await gates.discover(db,ids.outsider,ids.testShop),false,'direct test-shop URL must not bypass privacy');
 assert.equal(await gates.discover(db,ids.invited,ids.publicShop),false,'ordinary rental-origin invitation scope remains unchanged');
 assert.equal(await gates.access(db,ids.invited,ids.testShop),false,'invitation visibility does not grant booking membership');
 await db.query('INSERT INTO equipment_rental_shop_memberships VALUES($1,$2,\'photographer\',true),($1,$3,\'photographer\',true)',[ids.testShop,ids.invited,ids.outsider]);
 assert.equal(await gates.access(db,ids.invited,ids.testShop),true,'confirmed invited photographer can use the test shop');
 assert.equal(await gates.access(db,ids.outsider,ids.testShop),false,'uninvited membership cannot bypass test visibility');
 await db.query("UPDATE photographer_invites SET expires_at=now()-interval '1 second'");assert.deepEqual(await visible('shop','invited'),[ids.publicShop]);assert.deepEqual(await visible('lab','invited'),[ids.publicLab]);
 await db.query("UPDATE photographer_invites SET expires_at=NULL,active=false");assert.deepEqual(await visible('shop','invited'),[ids.publicShop]);
 await db.query('INSERT INTO photographer_invite_redemptions VALUES($1,$2),($3,$2)',[invites.rental,ids.invited,invites.lab]);
 assert.deepEqual(await visible('shop','invited'),[ids.testShop,ids.publicShop].sort());assert.deepEqual(await visible('lab','invited'),[ids.testLab,ids.publicLab].sort());
 await db.query('UPDATE users SET active=false WHERE id=$1',[ids.admin]);assert.deepEqual(await visible('shop','outsider'),[ids.publicShop]);assert.deepEqual(await visible('lab','outsider'),[ids.publicLab]);
 // Open/untargeted invite does not make a test institution public.
 await db.query('DELETE FROM photographer_invite_redemptions');await db.query('UPDATE photographer_invites SET target_mobile=NULL,active=true');assert.deepEqual(await visible('shop','invited'),[ids.publicShop]);
 await db.query('ALTER TABLE equipment_rental_shops ADD COLUMN business_category text');
 const frameShopId=crypto.randomUUID();
 await db.query('INSERT INTO equipment_rental_shops(id,name,manager_mobile,private_admin_only,business_category) VALUES($1,$2,$3,false,$4)',[frameShopId,'Frame producer','09129999998','frame_chassis']);
 assert.equal(await gates.discover(db,ids.outsider,frameShopId,'sale'),true,'public production shop may be discovered without an invitation');
 assert.equal(await gates.access(db,ids.outsider,frameShopId,'sale'),true,'first production order does not require existing cooperation');
 assert.equal(await gates.access(db,ids.outsider,frameShopId,'rental'),false,'production browsing never grants a rental membership');
 }finally{await db.query('ROLLBACK');db.release();await pool.end()}
});
test('all production visibility SELECTs compile against the disposable local PostgreSQL schema',async()=>{
 requireLocalDatabase();
 const {testAccountVisibleSql,testAccountSql,adminMobileViewerSql}=await import('../dist/api/test-account-visibility.js'),fs=require('node:fs');
 const pool=new Pool({connectionString:testDatabaseUrl}),db=await pool.connect();
 try{
 await db.query('BEGIN');
 // Runtime stock-mode column already exists in the application's schema repair;
 // model it only in a transaction-local fixture, without migrating the local database.
 await db.query('CREATE TEMP TABLE equipment_rental_shops (LIKE public.equipment_rental_shops INCLUDING ALL)');
 await db.query('ALTER TABLE equipment_rental_shops ADD COLUMN IF NOT EXISTS customer_rental_stock_mode text');
 const src=fs.readFileSync('dist/api/server.js','utf8');let count=0;
 for(const match of src.matchAll(/`([^`]*testAccountVisibleSql[^`]*)`/g)){
  if(!match[1].trim().startsWith('SELECT'))continue;
  const sql=new Function('testAccountVisibleSql','testAccountSql','adminMobileViewerSql','return `'+match[1]+'`')(testAccountVisibleSql,testAccountSql,adminMobileViewerSql);
  const n=Math.max(0,...[...sql.matchAll(/\$(\d+)/g)].map(x=>Number(x[1])));
  await db.query('EXPLAIN '+sql,Array(n).fill(null));count++;
 }
 assert(count>=12,'all discovery, auth, request and selection query gates must be checked');
 }finally{await db.query('ROLLBACK');db.release();await pool.end()}
});
