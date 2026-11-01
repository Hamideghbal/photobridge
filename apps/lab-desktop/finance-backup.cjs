'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFile}=require('node:child_process');
const paths=['/api/lab/invoices','/api/lab/finance/payments','/api/lab/finance/ledger'];
const formatDate=value=>{if(!value)return'';const d=new Date(value);if(!Number.isFinite(d.getTime()))return'';return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(d).replace(/\u200e/g,'')};
const number=value=>{const n=Number(value||0);if(!Number.isFinite(n)||Math.abs(n)>900000000000000)throw Error('finance_amount_invalid');return String(Math.trunc(n))};
const safeText=(v,length=240)=>String(v??'').replace(/[\t\r\n\u0000-\u001f]/g,' ').slice(0,length);
const tsv=rows=>rows.map(row=>row.map((value,index)=>index===0?number(value):safeText(value)).join('\t')).join('\n')+(rows.length?'\n':'');
const fail=(message)=>{throw Error(message)};
async function responseJson(request,url){
 const response=await request(url);
 if(!response.ok)fail('finance_snapshot_http_'+response.status);
 const length=Number(response.headers?.get?.('content-length'));
 if(Number.isFinite(length)&&length>18_000_000)fail('finance_snapshot_too_large');
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length>18_000_000)fail('finance_snapshot_too_large');
 try{return JSON.parse(bytes.toString('utf8'))}catch{fail('finance_snapshot_json_invalid')}
}
function createRows(invoiceData,paymentData,ledgerData,labId){
 const verified=(rows)=>rows.filter(row=>row&&(row.lab_id==null||String(row.lab_id)===String(labId)));
 const invoices=verified(invoiceData.invoices).filter(x=>String(x.document_type||'invoice')!=='discount');
 const discounts=verified(invoiceData.invoices).filter(x=>String(x.document_type||'')==='discount');
 const payments=verified(paymentData.payments);
 const ledger=ledgerData.transactions;
 const invRows=invoices.map((i,index)=>[
  index+1,i.number||i.offline_reference||i.id||'',formatDate(i.issued_at||i.created_at),
  i.customer_name||'',i.adjustment_note||i.description||i.note||i.order_number||'',
  i.document_type||'invoice',number(i.total),i.external_accounting_recorded?'ثبت شده':'ثبت نشده'
 ]);
 const receiptRows=[...payments.map(p=>({
  ts:p.paid_at||p.created_at,ref:p.invoice_number||p.id,customer:p.customer_name||'',
  note:p.note||'',kind:p.method||'payment',amount:p.amount,
  mark:p.external_accounting_recorded?'ثبت شده':'ثبت نشده'
 })),...discounts.map(d=>({
  ts:d.issued_at||d.created_at,ref:d.number||d.id,customer:d.customer_name||'',
  note:d.adjustment_note||d.note||'',kind:'discount',amount:Math.abs(Number(d.total||0)),
  mark:d.external_accounting_recorded?'ثبت شده':'ثبت نشده'
 }))].sort((a,b)=>(Date.parse(b.ts)||0)-(Date.parse(a.ts)||0)).map((p,index)=>[
  index+1,p.ref,formatDate(p.ts),p.customer,p.note,p.kind,number(p.amount),p.mark
 ]);
 const balanceByAccount=new Map(),entryRows=[];
 const ordered=[...ledger].sort((a,b)=>(Date.parse(a.txn_date)||0)-(Date.parse(b.txn_date)||0));
 for(const tx of ordered){
  for(const line of (tx.entries||[])){
   const code=safeText(line.account_code||line.account_name||'unknown',100);
   const customer=safeText(line.customer_id||'',80);
   const key=code+'|'+customer;
   const debit=BigInt(number(line.debit)),credit=BigInt(number(line.credit));
   const balance=(balanceByAccount.get(key)||0n)+debit-credit;
   balanceByAccount.set(key,balance);
   entryRows.push([
    entryRows.length+1,tx.reference_id||tx.id||'',formatDate(tx.txn_date),
    line.account_name||code,tx.description||line.note||'',String(debit),String(credit),String(balance)
   ]);
   if(entryRows.length>10000)fail('finance_snapshot_excessive_entries');
  }
 }
 if(invRows.length>10000||receiptRows.length>10000)fail('finance_snapshot_excessive_rows');
 return{Invoices:invRows,Receipts:receiptRows,Ledger:entryRows};
}
async function defaultRunAccess(script,folder,destination){
 await new Promise((resolve,reject)=>execFile('cscript.exe',['//Nologo',script,folder,destination],{
  windowsHide:true,timeout:90000,maxBuffer:512000
 },(error,stdout,stderr)=>error?reject(Object.assign(Error('access_creation_failed'),{cause:error})):resolve({stdout,stderr})));
}
async function writeFinanceBackup({store,request,folder,stamp,sourceScript,runAccess=defaultRunAccess,log=()=>{}}){
 const labId=store.get('labId');
 if(!store.get('auth')||!labId)return{status:'not_signed_in'};
 if(!/^\d{4}-\d{2}-\d{2}T[\d-]+Z$/.test(stamp))throw Error('backup_timestamp_invalid');
 if(!fs.existsSync(sourceScript))throw Error('access_builder_missing');
 // Fetch only live authenticated, lab-scoped records. Never read cross-account SQLite cache.
 const [invoiceData,paymentData,ledgerData]=await Promise.all(paths.map(p=>responseJson(request,p)));
 if(String(store.get('labId'))!==String(labId)||!store.get('auth'))throw Error('backup_lab_context_changed');
 if(!Array.isArray(invoiceData.invoices)||!Array.isArray(paymentData.payments)||!Array.isArray(ledgerData.transactions))throw Error('finance_snapshot_incomplete');
 const rows=createRows(invoiceData,paymentData,ledgerData,labId);
 const target=path.join(folder,'lab-'+stamp+'-access');
 fs.mkdirSync(target,{recursive:false});
 try{
  const manifest={format:'photobridge-lab-finance-view-v1',labId:String(labId),createdAt:new Date().toISOString(),
   tables:Object.fromEntries(Object.entries(rows).map(([name,data])=>[name,{count:data.length}])),
   source:'authenticated live PhotoBridge API',
   restorable:false,completeServerBackup:false,
   note:'Access/TSV is for financial review. Only the paired SQLite backup preserves the local data snapshot. This export is NOT a server restore.'};
  for(const [name,data] of Object.entries(rows))fs.writeFileSync(path.join(target,name+'.tsv'),tsv(data),'utf8');
  fs.copyFileSync(sourceScript,path.join(target,'BuildFinancialBackup.vbs'));
  fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
  fs.writeFileSync(path.join(target,'README.txt'),
    'PhotoBridge - Access finance viewer\r\nTables: Invoices, Receipts, Ledger\r\nIf Microsoft Access is installed, PhotoBridge_Finance.accdb is generated automatically.\r\nOtherwise use the same builder from an elevated-free Command Prompt: cscript //Nologo BuildFinancialBackup.vbs . PhotoBridge_Finance.accdb\r\nThis is an export, not a restorable server backup.\r\n','utf8');
  const temp=path.join(target,'PhotoBridge_Finance.creating.accdb'),final=path.join(target,'PhotoBridge_Finance.accdb');
  try{
   await runAccess(path.join(target,'BuildFinancialBackup.vbs'),target,temp);
   if(!fs.existsSync(temp)||fs.statSync(temp).size<4096)throw Error('access_output_missing');
   fs.renameSync(temp,final);
   fs.writeFileSync(path.join(target,'AccessStatus.txt'),'Ready: PhotoBridge_Finance.accdb contains three read-only Access forms.\r\n','utf8');
   return{status:'access_ready',folder:target,accessFile:final,counts:manifest.tables};
  }catch(error){
   fs.rmSync(temp,{force:true});
   fs.writeFileSync(path.join(target,'AccessStatus.txt'),'Microsoft Access could not be started automatically. The source data and BuildFinancialBackup.vbs are included.\r\n','utf8');
   log('Access viewer not generated: '+String(error.code||error.message||'unavailable'));
   return{status:'access_requires_microsoft_access',folder:target,counts:manifest.tables};
  }
 }catch(error){
  fs.rmSync(target,{recursive:true,force:true});
  throw error;
 }
}
module.exports={createRows,writeFinanceBackup,defaultRunAccess,formatDate,tsv};
