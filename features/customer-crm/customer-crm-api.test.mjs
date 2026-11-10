import test from 'node:test';
import assert from 'node:assert/strict';
import {handleCustomerCRM} from '../../dist/api/customer-crm.js';
const L='5dc2a8e2-bb96-4dc1-ae2d-3470c186acc1';
const P='8055e7be-0da5-4982-b39e-9f85dc45a92c';
const C='17db7829-b8bf-440b-a671-ac49a596b9bc';
function setup({portal='lab',user=null,path='/api/crm/bootstrap',method='GET',body={},rowsFor=()=>({rows:[],rowCount:0})}={}){
 const calls=[],state={reply:null,head:null,html:null,connected:0,released:0};
 const c={async query(sql,args=[]){calls.push({sql,args});if(sql==='BEGIN'||sql==='COMMIT'||sql==='ROLLBACK')return {rows:[],rowCount:0};return rowsFor(sql,args)||{rows:[],rowCount:0}},release(){state.released++}};
 const ctx={req:{method,headers:{host:'photobridge.ir',origin:'https://photobridge.ir'}},res:{writeHead(code,headers){state.head={code,headers}},end(value){state.html=value}},url:{pathname:path,searchParams:new URLSearchParams()},a:user,pool:{async connect(){state.connected++;return c}},async bodyJson(){return body},sendJson(res,status,reply){state.reply={status,reply}},portal};
 return {ctx,state,calls};
}
const lab={labRole:'lab_admin',labId:L,userId:P,name:'مدیر لابراتوار'};
const photographer={labRole:'customer',labId:L,userId:P,name:'آتلیه'};
test('CRM refuses unauthenticated traffic before any DB access',async()=>{
 const x=setup();await handleCustomerCRM(x.ctx);assert.equal(x.state.reply.status,403);assert.equal(x.state.connected,0);
});
test('CRM refuses another role, even if it has a valid session',async()=>{
 const x=setup({portal:'lab',user:photographer});await handleCustomerCRM(x.ctx);assert.equal(x.state.reply.status,403);assert.equal(x.state.connected,0);
});
test('scope is always set from authenticated lab identity',async()=>{
 const x=setup({user:lab});
 await handleCustomerCRM(x.ctx);
 assert.equal(x.state.reply.status,200);assert.equal(x.state.released,1);
 const scope=x.calls.find(c=>c.sql.includes("set_config('pb_crm.owner_kind'"));
 assert.deepEqual(scope.args,['lab',L]);
 for(const c of x.calls.filter(q=>q.sql.includes('FROM pb_crm.'))){assert.deepEqual(c.args,['lab',L])}
});
test('photographer identity is user ID, not active lab ID',async()=>{
 const x=setup({portal:'photographer',user:photographer});
 await handleCustomerCRM(x.ctx);
 assert.deepEqual(x.calls.find(c=>c.sql.includes('set_config')).args,['photographer',P]);
});
test('origin is required for mutations and checked before DB access',async()=>{
 const x=setup({user:lab,method:'POST',path:'/api/crm/customers'});
 x.ctx.req.headers.origin='https://attacker.example';
 await handleCustomerCRM(x.ctx);
 assert.equal(x.state.reply.status,403);assert.equal(x.state.connected,0);
});
test('create customer binds tenant from session, never browser-supplied scope',async()=>{
 const x=setup({user:lab,method:'POST',path:'/api/crm/customers',body:{owner_kind:'photographer',owner_id:P,fullName:'نگار',mobile:'۰۹۱۲۳۴۵۶۷۸۹',marketingPermission:'unknown'},rowsFor:(sql)=>{
  if(sql.includes('INSERT INTO pb_crm.customers'))return {rows:[{id:C}],rowCount:1};return {rows:[],rowCount:0};
 }});
 await handleCustomerCRM(x.ctx);assert.equal(x.state.reply.status,201);
 const q=x.calls.find(c=>c.sql.includes('INSERT INTO pb_crm.customers'));
 assert.deepEqual(q.args.slice(0,2),['lab',L]);assert.equal(q.args[3],'09123456789');
});
test('marketing opt-in requires a recorded permission source',async()=>{
 const x=setup({user:lab,method:'POST',path:'/api/crm/customers',body:{fullName:'مریم',mobile:'09123456789',marketingPermission:'opted_in',permissionSource:''}});
 await handleCustomerCRM(x.ctx);assert.equal(x.state.reply.status,400);assert.ok(x.calls.some(c=>c.sql==='ROLLBACK'));
});
test('invoice rejects a request that cannot resolve its customer within owner scope',async()=>{
 const x=setup({user:lab,method:'POST',path:'/api/crm/invoices',body:{customerId:C,items:[{description:'عکاسی کودک',quantity:1,unitPriceToman:1000}]}});
 await handleCustomerCRM(x.ctx);assert.equal(x.state.reply.status,404);
 const q=x.calls.find(c=>c.sql.includes('FROM pb_crm.customers')&&c.sql.includes('full_name'));
 assert.deepEqual(q.args,['lab',L,C]);
});
