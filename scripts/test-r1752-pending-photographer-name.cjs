const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const api=fs.readFileSync(path.join(root,'dist/api/server.js'),'utf8');
const ui=fs.readFileSync(path.join(root,'dist/web/assets/index-UIRefine-v655-r84.js'),'utf8');
const html=fs.readFileSync(path.join(root,'dist/web/index.html'),'utf8');
const modulePath='file://'+path.join(root,'dist/api/lab-pending-customer-name.js').replace(/\\/g,'/');
function db({pending=true,existing=true,mobile='09120000000'}={}){
 const queries=[],rows=items=>({rows:items,rowCount:items.length});
 const c={
  async query(sql,args=[]){
   queries.push({sql,args});
   if(sql.includes('SELECT u.mobile FROM lab_memberships'))
    return rows(pending?[{mobile}]:[]);
   if(sql.includes('UPDATE invitations SET target_name'))return rows(existing?[{id:'inv'}]:[]);
   return rows([]);
  },
  release(){queries.push({sql:'RELEASE'})}
 };
 return {pool:{connect:async()=>c},queries};
}
test('R1752: editing a pending lab display name updates only its invitation',async()=>{
 const {updatePendingLabCustomerName}=await import(modulePath);
 const state=db();
 const result=await updatePendingLabCustomerName({pool:state.pool,crypto,labId:'lab-A',userId:'user-A',actorId:'staff-A',name:'  آتلیه   مهر  '});
 assert.equal(result.ok,true);
 assert.equal(result.name,'آتلیه مهر');
 assert(state.queries.some(q=>q.sql.includes('FOR UPDATE OF m')));
 const update=state.queries.find(q=>q.sql.includes('UPDATE invitations SET target_name'));
 assert.deepEqual(update.args,['lab-A','09120000000','آتلیه مهر']);
 assert(!state.queries.some(q=>/UPDATE users|UPDATE photographer_profiles|UPDATE lab_memberships|finance_transactions|sendSms/.test(q.sql)));
 assert(state.queries.some(q=>q.sql==='COMMIT'));
});
test('R1752: unlabelled pending member gets a local name without SMS dispatch',async()=>{
 const {updatePendingLabCustomerName}=await import(modulePath);
 const state=db({existing:false});
 const result=await updatePendingLabCustomerName({pool:state.pool,crypto,labId:'lab-A',userId:'user-A',actorId:'staff-A',name:'نام جدید'});
 assert.equal(result.ok,true);
 const insert=state.queries.find(q=>q.sql.includes('INSERT INTO invitations'));
 assert(insert);
 assert.equal(insert.args[0],'lab-A');
 assert.equal(insert.args[3],'09120000000');
 assert.equal(insert.args[4],'نام جدید');
 assert.match(insert.sql,/'not_sent'/);
 assert(!state.queries.some(q=>/sms_delivery|sendSms|wallet/i.test(q.sql)));
});
test('R1752: international mobile is normalized without affecting the global identity',async()=>{
 const {updatePendingLabCustomerName}=await import(modulePath);
 const state=db({mobile:'+989120000000'});
 const result=await updatePendingLabCustomerName({pool:state.pool,crypto,labId:'lab-A',userId:'user-A',actorId:'staff-A',name:'آتلیه جدید'});
 assert.equal(result.ok,true);
 const query=state.queries.find(q=>q.sql.includes('UPDATE invitations SET target_name'));
 assert.deepEqual(query.args,['lab-A','09120000000','آتلیه جدید']);
});
test('R1752: registered or suspended real photographers cannot be renamed as preregistrations',async()=>{
 const {updatePendingLabCustomerName}=await import(modulePath);
 const state=db({pending:false});
 const result=await updatePendingLabCustomerName({pool:state.pool,crypto,labId:'lab-A',userId:'user-A',actorId:'staff-A',name:'new'});
 assert.deepEqual(result,{ok:false,status:409,error:'customer_not_preregistered'});
 assert(!state.queries.some(q=>/UPDATE invitations|INSERT INTO invitations/.test(q.sql)));
 assert(state.queries.some(q=>q.sql==='ROLLBACK'));
 const query=state.queries.find(q=>q.sql.includes('SELECT u.mobile FROM lab_memberships')).sql;
 for(const check of ["m.lab_id=$1","m.user_id=$2","m.active=false","u.photographer_enabled,false","u.mobile_verified_at IS NULL","pp.user_id IS NULL"])assert(query.includes(check),check);
 const invalid=await updatePendingLabCustomerName({pool:state.pool,crypto,labId:'lab-A',userId:'user-A',actorId:'staff-A',name:'   '});
 assert.equal(invalid.error,'invalid_temporary_name');
});
test('R1752: site and generated Lab UI offer the edit button only for eligible pending records',()=>{
 assert(api.includes("import {updatePendingLabCustomerName} from './lab-pending-customer-name.js'"));
 assert(api.includes("Object.prototype.hasOwnProperty.call(b,'temporaryName')"));
 assert(api.includes('pending_i.target_name temporary_name'));
 assert(api.includes('temporary_name_editable'));
 const activeTable=ui.slice(ui.indexOf('function PB1585PhotographersTable('));
 assert(activeTable.includes('e.jsx(PB1755TemporaryNameEdit,{customer,onSaved})'));
 assert(activeTable.includes('pb1585IdentityCopy'));
 assert(ui.includes('customer.temporary_name_editable'));
 assert(ui.includes('function PB1755TemporaryNameEdit('));
 assert(ui.includes('pbR1752NameEdit'));
 assert(ui.includes('temporaryName:name'));
 assert(html.includes('pendingName=r1755'));
 assert(html.includes('pbR1752TemporaryNameStyle'));
 execFileSync(process.execPath,['--check','dist/api/server.js'],{cwd:root,stdio:'pipe'});
 execFileSync(process.execPath,['--check','dist/web/assets/index-UIRefine-v655-r84.js'],{cwd:root,stdio:'pipe'});
 const native=path.join(root,'dist/web/lab-desktop-ui');
 if(fs.existsSync(path.join(native,'index.html'))){
  const page=fs.readFileSync(path.join(native,'index.html'),'utf8');
  const uiNative=fs.readFileSync(path.join(native,'assets/index-UIRefine-v655-r84.js'),'utf8');
  assert(page.includes('pendingName=r1755'));
  assert(uiNative.includes('pbR1752NameEdit'));
  const manifest=JSON.parse(fs.readFileSync(path.join(native,'manifest.json'),'utf8'));
  for(const asset of ['index.html','assets/index-UIRefine-v655-r84.js']){
   const entry=manifest.files.find(f=>f.name===asset);
   assert(entry,'native checksum entry '+asset);
   const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(native,asset))).digest('hex');
   assert.equal(entry.sha256,actual);
  }
 }
});

test('R1755: active R1585 table (not retired cards) contains the name editor',()=>{
 const script=fs.readFileSync(path.join(root,'scripts/enable-r1752-pending-photographer-name.mjs'),'utf8');
 assert(script.includes("const tableStart=ui.indexOf('function PB1585PhotographersTable(')"));
 assert(script.includes("const patched=once(table,uiOld,uiNew,root+' active photographers table name')"));
 assert(script.includes("if(!customer.temporary_name_editable)return null"));
 assert(script.includes("await Me('/api/lab/customers/'+customer.id"));
 assert(script.includes("await onSaved()"));
 assert(!script.includes("const slot='className:"));
 const tableAt=ui.indexOf('function PB1585PhotographersTable(');
 assert(tableAt>=0);
 const tableEnd=ui.indexOf('\n}',tableAt);
 const table=ui.slice(tableAt,tableEnd+2);
 assert(table.includes('e.jsx(PB1755TemporaryNameEdit,{customer,onSaved})'));
 assert.equal(table.split('e.jsx(PB1755TemporaryNameEdit,{customer,onSaved})').length,2);
 assert(table.includes('data-customer-id'));
 assert(table.includes('pb1585PhotographerActions'));
 assert(table.includes("customer.mobile||'بدون شماره موبایل'"));
 const helperAt=ui.indexOf('function PB1755TemporaryNameEdit(');
 assert(helperAt>=0);
 const helper=ui.slice(helperAt,helperAt+1600);
 assert(helper.includes('if(!customer.temporary_name_editable)return null'));
 assert(helper.includes("body:JSON.stringify({temporaryName:name})"));
});
