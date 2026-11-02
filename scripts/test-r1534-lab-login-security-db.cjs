const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),path=require('node:path'),{pathToFileURL}=require('node:url'),{PGlite}=require(process.env.PB_PGLITE_PATH||'@electric-sql/pglite');
const hash=p=>{const salt=crypto.randomBytes(16);return salt.toString('hex')+':'+crypto.scryptSync(p,salt,64).toString('hex')},tokenHash=s=>crypto.createHash('sha256').update(s).digest('hex');
const challenge='20000000-0000-4000-8000-000000000001',owner='30000000-0000-4000-8000-000000000001',sibling='30000000-0000-4000-8000-000000000002',other='30000000-0000-4000-8000-000000000003',token='x'.repeat(43);
const source=fs.readFileSync('dist/api/server.js','utf8');
const start=source.indexOf("    if (req.method === 'POST' && url.pathname === '/api/auth/password-reset/complete') {");
const end=source.indexOf('    const loginWithMobile = async (expected) => {',start);
assert(start>=0&&end>start,'existing OTP-protected reset route must stay available');
const route=source.slice(start,end);
async function errorResponse(task,code){const response=await task();assert(response&&response.status>=400,'route should return a 4xx response');assert.equal(response.body.error,code);}
async function fixture(){
 const db=new PGlite();await db.exec(`CREATE TABLE users(id uuid PRIMARY KEY,mobile text,password_hash text,active boolean DEFAULT true,photographer_enabled boolean DEFAULT false,platform_role text DEFAULT 'user',force_password_change boolean DEFAULT false,mobile_verified_at timestamptz,created_at timestamptz DEFAULT now(),updated_at timestamptz);CREATE TABLE photographer_profiles(user_id uuid PRIMARY KEY REFERENCES users(id),password_hash text,updated_at timestamptz);CREATE TABLE sessions(user_id uuid REFERENCES users(id),token text);CREATE TABLE lab_memberships(user_id uuid REFERENCES users(id),lab_id uuid,role text,active boolean DEFAULT true,created_at timestamptz DEFAULT now());CREATE TABLE password_reset_challenges(id uuid PRIMARY KEY,user_id uuid,mobile text,portal text,status text,reset_token_hash text,expires_at timestamptz,used_at timestamptz);`);
 const before=hash('old-password');await db.query('INSERT INTO users(id,mobile,password_hash,photographer_enabled) VALUES($1,$2,$3,true),($4,$5,$3,false),($6,$7,$3,false)',[owner,'09120000000',before,sibling,'+989120000000',other,'09121111111']);
 await db.query('INSERT INTO photographer_profiles VALUES($1,$2,NULL)',[owner,before]);
 await db.query("INSERT INTO sessions VALUES($1,'owner'),($2,'sibling'),($3,'other')",[owner,sibling,other]);
 await db.query("INSERT INTO lab_memberships(user_id,lab_id,role) VALUES($1,'10000000-0000-4000-8000-000000000001','lab_admin')",[owner]);
 await db.query("INSERT INTO password_reset_challenges VALUES($1,$2,$3,'account','verified',$4,now()+interval '5 minutes',NULL)",[challenge,owner,'09120000000',tokenHash(token)]);
 let failConsume=false;
 const query=async(sql,args)=>{if(failConsume&&typeof sql==='string'&&sql.startsWith('UPDATE password_reset_challenges'))throw Error('forced_failure');return db.query(sql,args)};
 const pool={query,connect:async()=>({release(){},query})};
 const {setSharedPassword}=await import(pathToFileURL(path.resolve('dist/api/shared-credentials.js')));
 async function change(overrides={}){let response;const input={challengeId:challenge,resetToken:token,newPassword:'new-shared-password',confirmPassword:'new-shared-password',...overrides};
  const context={req:{method:'POST'},url:{pathname:'/api/auth/password-reset/complete'},res:{},bodyJson:async()=>input,pool,passwordHash:hash,tokenHash,setSharedPassword,audit:async()=>{},sendJson:(_,status,body)=>response={status,body}};
  await vm.runInNewContext('(async()=>{'+route+'})()',context);return response;
 }
 return {db,before,change,failConsume:()=>failConsume=true};
}
test('real database: OTP-verified password change revokes shared sessions without altering memberships or unrelated users',async()=>{
 const f=await fixture();try{
  const result=await f.change();assert.equal(result.status,200);
  const users=(await f.db.query('SELECT id,password_hash,active FROM users ORDER BY id')).rows;
  assert.notEqual(users[0].password_hash,f.before);
  assert.equal(users[0].password_hash,users[1].password_hash);
  assert.equal(users[2].password_hash,f.before);
  assert(users.every(u=>u.active));
  assert.deepEqual((await f.db.query('SELECT token FROM sessions')).rows,[{token:'other'}]);
  assert.equal((await f.db.query('SELECT password_hash FROM photographer_profiles')).rows[0].password_hash,users[0].password_hash);
  assert.equal((await f.db.query('SELECT count(*)::int n FROM lab_memberships')).rows[0].n,1);
  assert.equal((await f.db.query('SELECT status FROM password_reset_challenges')).rows[0].status,'used');
  await errorResponse(()=>f.change(),'reset_invalid');
 }finally{await f.db.close()}
});
test('real database: pending, used, expired or forged OTP proofs cannot change password or revoke sessions',async()=>{
 for(const change of ["status='pending'","status='used'","expires_at=now()-interval '1 minute'"]){
  const f=await fixture();try{
   await f.db.exec('UPDATE password_reset_challenges SET '+change);
   await errorResponse(()=>f.change(),'reset_invalid');
   assert.equal((await f.db.query('SELECT password_hash FROM users WHERE id=$1',[owner])).rows[0].password_hash,f.before);
   assert.equal((await f.db.query('SELECT count(*)::int n FROM sessions')).rows[0].n,3);
  }finally{await f.db.close()}
 }
 const f=await fixture();try{await errorResponse(()=>f.change({resetToken:'forged'.repeat(9)}),'reset_invalid')}finally{await f.db.close()}
});
test('real database: OTP proof cannot be replayed to change a different mobile identity',async()=>{
 const f=await fixture();try{
  await f.db.query("UPDATE password_reset_challenges SET mobile='09121111111' WHERE id=$1",[challenge]);
  await assert.rejects(f.change(),e=>e.message==='existing_account_invalid');
  assert.equal((await f.db.query('SELECT password_hash FROM users WHERE id=$1',[owner])).rows[0].password_hash,f.before);
  assert.equal((await f.db.query('SELECT count(*)::int n FROM sessions')).rows[0].n,3);
 }finally{await f.db.close()}
});
test('real database: password and session changes roll back if OTP consumption fails',async()=>{
 const f=await fixture();try{
  f.failConsume();
  await assert.rejects(f.change(),e=>e.message==='forced_failure');
  assert.equal((await f.db.query('SELECT password_hash FROM users WHERE id=$1',[owner])).rows[0].password_hash,f.before);
  assert.equal((await f.db.query('SELECT count(*)::int n FROM sessions')).rows[0].n,3);
  assert.equal((await f.db.query('SELECT status FROM password_reset_challenges')).rows[0].status,'verified');
 }finally{await f.db.close()}
});
