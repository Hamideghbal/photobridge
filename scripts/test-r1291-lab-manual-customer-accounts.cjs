const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const importHandler=()=>import(pathToFileURL(path.resolve('dist/api/lab-manual-customer-controls.js')).href);

test('R1294 keeps authenticated customer-account endpoints and keeps details beside the compact picker',()=>{
 const ui=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
 const server=fs.readFileSync('dist/api/server.js','utf8');
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert(ui.includes('registrationPending'));
 assert(ui.includes('resend-invitation'));
 assert(ui.includes('send-invoice-sms'));
 assert(ui.includes('account-summary'));
 assert(ui.includes('adjust-initial-debt'));
 assert(ui.includes('pb1294SelectedDetails'));
 assert(ui.includes('آخرین تغییر'));
 assert(!ui.includes('invoiceChoice'));
 assert(server.includes('handleLabManualCustomerAccounts({req,url,res,pool,labId,a,bodyJson,sendJson'));
 assert(server.includes("from './lab-manual-customer-controls.js'"));
 assert(html.includes('/photobridge-r1291-lab-account-picker.css'));
 assert(html.includes('photobridge-r1137-lab-local-intake.js?v=r1365'));
});
function setup({owner=true,balance=50000,smsRecent=false,member=true,primary=true,invoiceFound=true}={}){
 let current=balance;const calls=[],answers=[],journals=[],sms=[];
 const row=x=>({rows:x,rowCount:x.length});
 const query=async(sql,args=[])=>{
  calls.push({sql,args});
  if(sql.includes('SELECT 1 FROM labs WHERE id=$1 AND created_by=$2'))return row(owner?[{ok:1}]:[]);
  if(sql.includes('SELECT 1 FROM lab_memberships'))return row(member?[{ok:1}]:[]);
  if(sql.includes('SELECT COALESCE(SUM(e.debit-e.credit),0)::bigint AS balance'))return row([{balance:current,updated_at:'2026-10-18T10:00:00Z'}]);
  if(sql.includes('SELECT e.customer_id id'))return row([{id:'cust',balance:current,balance_updated_at:'2026-10-18T10:00:00Z'}]);
  if(sql.includes('SELECT id,customer_id,number,total,issued_at FROM ('))return row([{id:'invoice',customer_id:'cust',number:29,total:73000,issued_at:'2026-10-18T10:00:00Z'}]);
  if(sql.includes('SELECT i.id,i.number,i.total'))return row(invoiceFound?[{id:'invoice',number:29,total:73000,mobile:'09120000000',lab_name:'Lab',sms_customer_notifications_allowed:true}]:[]);
  if(sql.includes('FROM lab_manual_invoice_sms_sends')&&sql.includes('LIMIT 1'))return row(smsRecent?[{}]:[]);
  if(sql.includes('INSERT INTO lab_manual_invoice_sms_sends'))return row([{id:'sms-reservation'}]);
  return row([]);
 };
 const client={query,release(){}};
 const pool={query,connect:async()=>client};
 const ctx={pool,labId:'lab',a:{userId:'owner'},res:{},crypto,
  req:{method:'GET'},url:{pathname:'/api/lab/delegated-customers/balances'},
  requireLocalIntakePrimary:async()=>primary,
  bodyJson:async()=>({}),sendJson:(_,status,body)=>answers.push({status,body}),
  ensureFinanceAccounts:async()=>{},
  postBalancedFinanceTransaction:async(_db,payload)=>{journals.push(payload);const d=payload.lines.find(x=>x.accountKey==='receivable');current+=(d.debit||0)-(d.credit||0);},
  sendSms:async data=>{sms.push(data);return {reference:'ack'};},
  audit:async()=>{}
 };
 return{ctx,answers,journals,sms,calls};
}
test('GET shows current receivable, last change and recent invoice',async()=>{
 const {handleLabManualCustomerAccounts}=await importHandler();const {ctx,answers}=setup();
 assert.equal(await handleLabManualCustomerAccounts(ctx),true);
 assert.equal(answers[0].status,200);assert.equal(answers[0].body.canEdit,true);
 assert.equal(answers[0].body.balances[0].balance,50000);
 assert.equal(answers[0].body.invoices[0].number,29);
});
test('owner adjustments are balanced ledger postings and preserve invoices',async()=>{
 const {handleLabManualCustomerAccounts}=await importHandler();const {ctx,answers,journals,calls}=setup();
 ctx.req.method='POST';ctx.url.pathname='/api/lab/delegated-customers/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/adjust-balance';
 ctx.bodyJson=async()=>({balance:80000,expectedBalance:50000,note:'اصلاح مانده از حسابداری'});
 assert.equal(await handleLabManualCustomerAccounts(ctx),true);
 assert.equal(answers.at(-1).status,200);
 assert.equal(answers.at(-1).body.balance,80000);
 assert.equal(journals.length,1);assert.equal(journals[0].lines[0].debit,30000);
 assert.equal(journals[0].lines[1].credit,30000);
 assert(!calls.some(c=>/UPDATE invoices/.test(c.sql)));
});
test('non-owner cannot adjust and stale balances cannot overwrite finance activity',async()=>{
 const {handleLabManualCustomerAccounts}=await importHandler();
 const denied=setup({owner:false});denied.ctx.req.method='POST';
 denied.ctx.url.pathname='/api/lab/delegated-customers/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/adjust-balance';
 denied.ctx.bodyJson=async()=>({balance:0,expectedBalance:50000,note:'reconciliation'});
 await handleLabManualCustomerAccounts(denied.ctx);
 assert.equal(denied.answers[0].status,403);assert.equal(denied.journals.length,0);
 const stale=setup();Object.assign(stale.ctx,{req:{method:'POST'},url:denied.ctx.url,bodyJson:async()=>({balance:0,expectedBalance:45000,note:'reconciliation'})});
 await handleLabManualCustomerAccounts(stale.ctx);
 assert.equal(stale.answers[0].status,409);assert.equal(stale.journals.length,0);
});
test('explicit invoice SMS works for a preregistered lab member, with rate limiting',async()=>{
 const {handleLabManualCustomerAccounts}=await importHandler();const ref='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 const s=setup();Object.assign(s.ctx,{req:{method:'POST'},url:{pathname:'/api/lab/delegated-customers/'+ref+'/send-invoice-sms'},bodyJson:async()=>({invoiceId:ref})});
 await handleLabManualCustomerAccounts(s.ctx);
 assert.equal(s.answers.at(-1).status,200);
 assert.equal(s.sms.length,1);assert.equal(s.sms[0].mobile,'09120000000');assert(s.sms[0].message.includes('فاکتور شماره 29'));
 const throttled=setup({smsRecent:true});Object.assign(throttled.ctx,{req:{method:'POST'},url:{pathname:'/api/lab/delegated-customers/'+ref+'/send-invoice-sms'},bodyJson:async()=>({invoiceId:ref})});
 await handleLabManualCustomerAccounts(throttled.ctx);
 assert.equal(throttled.answers.at(-1).status,429);assert.equal(throttled.sms.length,0);
});


