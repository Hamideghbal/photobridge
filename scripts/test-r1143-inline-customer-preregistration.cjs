const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const source=fs.readFileSync('dist/api/server.js','utf8');
const ui=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
const start=source.indexOf('const ensureDelegatedCustomerInvite = async');
const end=source.indexOf('// Intake created by the lab on behalf',start);
assert(start>=0&&end>start,'pre-registration route found');
const route=source.slice(start,end);
const customerId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
async function exercise({pathname='/api/lab/delegated-customers',body={},existing=false,member=null,priorDebt=false,existingInvite=false,sendAllowed=true,enabled=true}={}){
 const statements=[],ledger=[],sms=[],answers=[];
 const rows=arr=>({rows:arr,rowCount:arr.length});
 const query=async(sql,args=[])=>{
  statements.push({sql,args});
  if(sql.includes('SELECT id,name FROM users WHERE mobile'))return rows(existing?[{id:customerId,name:'Previously Registered'}]:[]);
  if(sql.includes('INSERT INTO users('))return rows([{id:customerId}]);
  if(sql.includes('SELECT role,active FROM lab_memberships'))return rows(member===null?[]:[{role:'customer',active:member}]);
  if(sql.includes('SELECT id,token,sms_status FROM invitations'))return rows(existingInvite?[{id:'invite',token:'secret',sms_status:'sent'}]:[]);
  if(sql.includes('INSERT INTO invitations('))return rows([{id:'invite',token:'secret',sms_status:'not_sent'}]);
  if(sql.includes("reference_type='lab_delegated_opening_debt'"))return rows(priorDebt?[{id:'debt'}]:[]);
  if(sql.includes('SELECT i.id,i.token,i.target_mobile'))return rows([{id:'invite',token:'secret',target_mobile:'09120000001',target_name:null,lab_name:'Lab'}]);
  if(sql.includes("SET sms_status='not_sent',sms_reference='dispatching'"))return rows(sendAllowed?[{id:'invite'}]:[]);
  if(sql.includes('SELECT u.mobile,u.name FROM lab_memberships'))return rows(member===false?[{mobile:'09120000001',name:'Customer'}]:[]);
  return rows([]);
 };
 const c={query,release(){}};
 const pool={query,connect:async()=>c};
 const args={
  req:{method:'POST'},url:{pathname},res:{},bodyJson:async()=>({mobile:'09120000001',initialDebt:50000,sendInvitation:false,...body}),
  requireLocalIntakePrimary:async()=>enabled,normalizeMobile:x=>x,pool,labId:'lab',a:{userId:'actor'},crypto,
  passwordHash:x=>x,PUBLIC_APP_URL:'https://app.test',
  ensureFinanceAccounts:async()=>{},postBalancedFinanceTransaction:async(db,data)=>ledger.push(data),
  audit:async()=>{},sendSms:async data=>{sms.push(data);return{reference:'sms-id'};},
  sendJson:(res,status,body)=>{answers.push({status,body});return body;}
 };
 await Function(...Object.keys(args),`return (async()=>{${route}})()`)(...Object.values(args));
 return {statements,ledger,sms,answers};
}
test('new mobile is held as unverified member and debt is posted once before any invoice',async()=>{
 const r=await exercise();
 assert.equal(r.answers[0].status,201);
 assert.equal(r.answers[0].body.customer.registrationPending,true);
 assert(r.statements.some(x=>x.sql.includes("'customer',false)")));
 assert(r.statements.some(x=>x.sql.includes('INSERT INTO invitations(')));
 assert(!r.statements.some(x=>x.sql.includes('INSERT INTO orders(')));
 assert.equal(r.ledger.length,1);assert.equal(r.ledger[0].lines[0].debit,50000);
 assert.equal(r.ledger[0].lines[1].credit,50000);
 assert.equal(r.sms.length,0);
});
test('preexisting global user is reused with pending membership; invitation SMS is centrally funded',async()=>{
 const r=await exercise({existing:true,body:{initialDebt:0,sendInvitation:true}});
 assert.equal(r.answers[0].body.customer.id,customerId);
 assert.equal(r.answers[0].body.customer.registrationPending,true);
 assert.equal(r.sms.length,1);
 assert.equal(r.sms[0].chargeLabId,undefined);
 assert.equal(r.sms[0].chargeRentalShopId,undefined);
 assert(!r.statements.some(x=>x.sql.includes('INSERT INTO users(')));
});
test('repeat pending customer cannot duplicate an opening debt',async()=>{
 const r=await exercise({existing:true,member:false,priorDebt:true});
 assert.equal(r.answers[0].status,409);
 assert.equal(r.answers[0].body.error,'initial_debt_already_recorded');
 assert.equal(r.ledger.length,0);
 assert(r.statements.some(x=>x.sql==='ROLLBACK'));
});
test('active membership is reused without pending invitation or opening-debt overwrite',async()=>{
 const blocked=await exercise({existing:true,member:true});
 assert.equal(blocked.answers[0].body.error,'opening_debt_existing_member');
 const good=await exercise({existing:true,member:true,body:{initialDebt:0,sendInvitation:true}});
 assert.equal(good.answers[0].status,201);
 assert.equal(good.answers[0].body.customer.registrationPending,false);
 assert(!good.statements.some(x=>x.sql.includes('INSERT INTO invitations(')));
 assert.equal(good.sms.length,0);
});
test('resend allowed only for pending customer and cannot be rapid-fire',async()=>{
 const pathname='/api/lab/delegated-customers/'+customerId+'/resend-invitation';
 const sent=await exercise({pathname,member:false,existingInvite:true});
 assert.equal(sent.answers[0].status,200);
 assert.equal(sent.sms.length,1);
 const limited=await exercise({pathname,member:false,existingInvite:true,sendAllowed:false});
 assert.equal(limited.answers[0].status,409);
 assert.equal(limited.answers[0].body.invitationSmsError,'invitation_sms_rate_limited');
 assert.equal(limited.sms.length,0);
 const active=await exercise({pathname,member:true});
 assert.equal(active.answers[0].status,409);
 assert.equal(active.answers[0].body.error,'customer_not_pending');
});
test('bootstrap and repeat invoices can see the pending membership without activating it',()=>{
 const bootstrap=source.slice(source.indexOf("'/api/lab/delegated-orders/bootstrap'"),source.indexOf("// PB1143: registering"));
 assert.match(bootstrap,/NOT m.active AS "registrationPending"/);
 assert.match(bootstrap,/i.active=true AND i.uses=0/);
 const create=source.slice(source.indexOf("if (req.method === 'POST' && url.pathname === '/api/lab/delegated-orders')"),source.indexOf('const delegatedFiles ='));
 assert.match(create,/m.active=true OR EXISTS/);
 assert.match(create,/i.target_mobile=u.mobile/);
 assert(!ui.includes('const newFields='));
 assert.match(ui,/pb1143NewCustomer/);
 assert.match(ui,/formatMoney/);
 assert.match(ui,/resend-invitation/);
 assert.match(ui,/customerId:customers.value/);
});
