const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const handler=()=>import(pathToFileURL(path.resolve('dist/api/lab-manual-customer-controls.js')).href);

test('lab intake picker has only customer identity/status while account summary loads after selection',()=>{
 const ui=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
 const html=fs.readFileSync('dist/web/index.html','utf8');
 const picker=ui.slice(ui.indexOf('function render(){'),ui.indexOf('addCustomer.onclick='));
 assert(picker.includes("node('button',itemLabel(c),'pb1294SimpleChoice')"));
 assert(!picker.includes('balanceMeta(c)'));
 assert(!picker.includes('invoiceMeta'));
 assert(ui.includes("accountRow.append(wrapper,details)"));
 assert(ui.includes("account-summary"));
 assert(ui.includes("adjust-initial-debt"));
 assert(!ui.includes("api('/api/lab/delegated-customers/balances')"));
 assert(ui.includes('cachedPrimary?Promise.resolve'));
 assert(html.includes('photobridge-r1291-lab-account-picker.css?v=r1294'));
 // Later native-intake releases intentionally rotate this cache-bust token.
 assert.match(html,/<script\b[^>]*\bsrc="\/photobridge-r1137-lab-local-intake\.js\?v=r[0-9]+[^"<>]*"[^>]*><\/script>/);
});

function setup({owner=true,member=true,invoiced=false,opening=25000,pending=true,actorRole='lab_admin',completeDuringSave=false}={}){
 let initial=opening,balance=opening;
 const responses=[],postings=[],queries=[];
 const rows=x=>({rows:x,rowCount:x.length});
 const query=async(sql,args=[])=>{
  queries.push({sql,args});
  if(sql.includes('FROM lab_memberships'))return rows(member?[{active:!pending||(completeDuringSave&&sql.includes('FOR UPDATE'))}]:[]);
  if(sql.includes('FROM labs WHERE id=$1 AND created_by=$2'))return rows(owner?[{}]:[]);
  if(sql.includes('AS sms_enabled'))return rows([{can_edit:owner,sms_enabled:true}]);
  if(sql.includes('AS initial_debt'))return rows([{initial_debt:initial}]);
  if(sql.includes('AS balance'))return rows([{balance,updated_at:'2026-10-18T10:00:00Z'}]);
  if(sql.includes('FROM invoices'))return rows(invoiced?[{id:'invoice',number:19,total:30000,issued_at:'2026-10-18T08:00:00Z'}]:[]);
  return rows([]);
 };
 const client={query,release(){}};
 const ctx={
  req:{method:'GET'},url:{pathname:'/api/lab/delegated-customers/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/account-summary'},
  res:{},pool:{query,connect:async()=>client},labId:'lab',a:{userId:'owner',labId:'lab',labRole:actorRole},
  requireLocalIntakePrimary:async()=>true,bodyJson:async()=>({}),
  sendJson:(_res,status,body)=>responses.push({status,body}),
  ensureFinanceAccounts:async()=>{},postBalancedFinanceTransaction:async(_db,payload)=>{
   postings.push(payload);
   const entry=payload.lines.find(x=>x.accountKey==='receivable');
   initial+=(entry.debit||0)-(entry.credit||0);balance+=(entry.debit||0)-(entry.credit||0);
  },
  crypto:{randomUUID:()=>'cccccccc-cccc-4ccc-8ccc-cccccccccccc'},audit:async()=>{}
 };
 return{ctx,responses,queries,postings};
}
test('selected customer summary reports invoice, opening debt, receivable and editability',async()=>{
 const {handleLabManualCustomerAccounts}=await handler();
 for(const invoiced of [false,true]){
  const s=setup({invoiced});
  assert.equal(await handleLabManualCustomerAccounts(s.ctx),true);
  assert.equal(s.responses[0].status,200);
  assert.equal(s.responses[0].body.balance,25000);
  assert.equal(s.responses[0].body.initialDebt,25000);
  assert.equal(s.responses[0].body.hasInvoice,invoiced);
  assert.equal(s.responses[0].body.canEditInitialDebt,!invoiced);
  assert(s.queries.filter(x=>x.sql.includes('FROM invoices')).every(x=>x.args[0]==='lab'));
 }
});
test('opening amount adjusts through balanced entries without overwriting invoices',async()=>{
 const {handleLabManualCustomerAccounts}=await handler();
 const s=setup();
 s.ctx.req.method='POST';
 s.ctx.url.pathname=s.ctx.url.pathname.replace('account-summary','adjust-initial-debt');
 s.ctx.bodyJson=async()=>({initialDebt:30000,expectedInitialDebt:25000,note:'اصلاح پیش از اولین فاکتور'});
 await handleLabManualCustomerAccounts(s.ctx);
 assert.equal(s.responses.at(-1).status,200);
 assert.equal(s.responses.at(-1).body.initialDebt,30000);
 assert.equal(s.postings.length,1);
 assert.equal(s.postings[0].referenceType,'lab_manual_customer_initial_debt_adjustment');
 assert.equal(s.postings[0].lines.find(x=>x.accountKey==='receivable').debit,5000);
 assert.equal(s.postings[0].lines.find(x=>x.accountKey==='opening_balance_equity').credit,5000);
 assert(!s.queries.some(x=>/UPDATE invoices/.test(x.sql)));
});
test('initial debt is immutable after any invoice and restricted to authenticated lab managers',async()=>{
 const {handleLabManualCustomerAccounts}=await handler();
 for(const [scenario,expectedStatus] of [[{invoiced:true},409],[{actorRole:'customer'},403],[{member:false},404]]){
  const s=setup(scenario);s.ctx.req.method='POST';
  s.ctx.url.pathname=s.ctx.url.pathname.replace('account-summary','adjust-initial-debt');
  s.ctx.bodyJson=async()=>({initialDebt:30000,expectedInitialDebt:25000,note:'اصلاح پیش از فاکتور'});
  await handleLabManualCustomerAccounts(s.ctx);
  assert.equal(s.responses.at(-1).status,expectedStatus);
  assert.equal(s.postings.length,0);
 }
 const stale=setup();stale.ctx.req.method='POST';
 stale.ctx.url.pathname=stale.ctx.url.pathname.replace('account-summary','adjust-initial-debt');
 stale.ctx.bodyJson=async()=>({initialDebt:30000,expectedInitialDebt:10000,note:'اصلاح پیش از فاکتور'});
 await handleLabManualCustomerAccounts(stale.ctx);
 assert.equal(stale.responses.at(-1).status,409);
 assert.equal(stale.postings.length,0);
});


test('any authorized lab manager can edit pending customer opening debt without an invoice; completed membership remains editable before invoicing',async()=>{
 const {handleLabManualCustomerAccounts}=await handler();
 const manager=setup({owner:false});manager.ctx.req.method='POST';manager.ctx.url.pathname=manager.ctx.url.pathname.replace('account-summary','adjust-initial-debt');manager.ctx.bodyJson=async()=>({initialDebt:30000,expectedInitialDebt:25000,note:'اصلاح بدهی پیش عضویت'});
 await handleLabManualCustomerAccounts(manager.ctx);assert.equal(manager.responses.at(-1).status,200);assert.equal(manager.postings.length,1);
 const complete=setup({pending:false});await handleLabManualCustomerAccounts(complete.ctx);assert.equal(complete.responses.at(-1).body.canEditInitialDebt,true);
 complete.ctx.req.method='POST';complete.ctx.url.pathname=complete.ctx.url.pathname.replace('account-summary','adjust-initial-debt');complete.ctx.bodyJson=async()=>({initialDebt:30000,expectedInitialDebt:25000,note:'اصلاح بدهی عضویت'});await handleLabManualCustomerAccounts(complete.ctx);assert.equal(complete.responses.at(-1).status,200);assert.equal(complete.postings.length,1);
});

test('completion during edit preserves eligibility and cross-lab actors cannot change initial debt',async()=>{
 const {handleLabManualCustomerAccounts}=await handler();const s=setup({completeDuringSave:true});s.ctx.req.method='POST';s.ctx.url.pathname=s.ctx.url.pathname.replace('account-summary','adjust-initial-debt');s.ctx.bodyJson=async()=>({initialDebt:30000,expectedInitialDebt:25000,note:'اصلاح بدهی اولیه'});await handleLabManualCustomerAccounts(s.ctx);assert.equal(s.responses.at(-1).status,200);assert.equal(s.postings.length,1);
 const other=setup();other.ctx.a.labId='other-lab';await handleLabManualCustomerAccounts(other.ctx);assert.equal(other.responses.at(-1).status,403);assert.equal(other.queries.length,0);
});

test('account correction from invitations does not require the file-storage computer',async()=>{
 const {handleLabManualCustomerAccounts}=await handler(),s=setup({pending:false});
 s.ctx.requireLocalIntakePrimary=async()=>{throw Error('file-storage permission must not gate account correction');};
 await handleLabManualCustomerAccounts(s.ctx);assert.equal(s.responses.at(-1).body.canEditInitialDebt,true);
 s.ctx.req.method='POST';s.ctx.url.pathname=s.ctx.url.pathname.replace('account-summary','adjust-initial-debt');s.ctx.bodyJson=async()=>({initialDebt:0,expectedInitialDebt:25000,note:'تسویه مانده اولیه'});
 await handleLabManualCustomerAccounts(s.ctx);assert.equal(s.responses.at(-1).status,200);assert.equal(s.responses.at(-1).body.initialDebt,0);assert.equal(s.postings[0].lines.find(x=>x.accountKey==='receivable').credit,25000);
});

test('blank correction note is optional while the balanced ledger retains a useful audit description',async()=>{const {handleLabManualCustomerAccounts}=await handler();const s=setup();s.ctx.req.method='POST';s.ctx.url.pathname=s.ctx.url.pathname.replace('account-summary','adjust-initial-debt');s.ctx.bodyJson=async()=>({initialDebt:30000,expectedInitialDebt:25000,note:''});await handleLabManualCustomerAccounts(s.ctx);assert.equal(s.responses.at(-1).status,200);assert.equal(s.postings.length,1);assert(s.postings[0].lines.every(line=>line.note==='اصلاح بدهی اولیه'));});
