'use strict';
// R1568: Native-only default-printer bridge. Persist before spooling: never reprint uncertain jobs.
const {URL}=require('node:url');
function validateJob(job){
 if(!job||typeof job!=='object'||Array.isArray(job)||!/^([A-Za-z0-9_.:-]{1,160})$/.test(String(job.jobKey||'')))throw Error('invalid_print_job');
 const html=String(job.html||'');
 if(!html.startsWith('<!doctype html>')||Buffer.byteLength(html,'utf8')>600000||/<script\b/i.test(html)||/<(?:iframe|object|embed)\b/i.test(html))throw Error('invalid_print_document');
 return {jobKey:String(job.jobKey),html};
}
function installAutoPrint({ipcMain,BrowserWindow,store,getWindow,getOrigin}){
 if(!ipcMain?.handle||!BrowserWindow||!store?.get||!store?.set)throw Error('invalid_auto_printer_host');
 const pending=new Set();
 const submit=async(event,raw)=>{
  const main=getWindow();let senderOrigin='';
  try{senderOrigin=new URL(String(event.senderFrame?.url||'')).origin}catch{}
  if(!main||event.sender!==main.webContents||senderOrigin!==getOrigin()||!store.get('labId')||!store.get('auth'))return {ok:false,error:'forbidden'};
  let job;
  try{job=validateJob(raw)}catch(error){return {ok:false,error:error.message}}
  const key='lab-auto-print:v1:'+store.get('labId')+':'+job.jobKey;
  if(store.get(key)||pending.has(key))return {ok:false,error:'already_submitted',state:store.get(key)?.state||'in_progress'};
  pending.add(key);
  const printers=await Promise.resolve().then(()=>main.webContents.getPrintersAsync()).catch(()=>[]);
  const printer=printers.find(p=>p.isDefault||p.isDefaultPrinter);
  if(!printer?.name){pending.delete(key);return {ok:false,error:'no_default_printer'}}
  let hidden=null,attempted=false;
  try{
   hidden=new BrowserWindow({width:900,height:1200,show:false,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,javascript:false,webSecurity:true,backgroundThrottling:false}});
   await hidden.loadURL('data:text/html;charset=utf-8;base64,'+Buffer.from(job.html,'utf8').toString('base64'));
   store.set(key,{state:'submitting',printer:printer.name,at:new Date().toISOString()});
   attempted=true;
   const outcome=await new Promise(resolve=>hidden.webContents.print({silent:true,printBackground:true,deviceName:printer.name,copies:1},(success,reason)=>resolve({success,reason})));
   store.set(key,{state:outcome.success?'submitted':'needs_review',printer:printer.name,at:new Date().toISOString(),error:outcome.reason||null});
   return outcome.success?{ok:true,submitted:true,printer:printer.name}:{ok:false,error:'spooler_rejected_needs_review'};
  }catch(error){
   if(attempted)try{store.set(key,{state:'needs_review',printer:printer.name,at:new Date().toISOString(),error:String(error.message||error)})}catch{}
   return {ok:false,error:attempted?'print_uncertain_needs_review':'print_preparation_failed'};
  }finally{try{hidden?.destroy()}catch{}pending.delete(key)}
 };
 ipcMain.handle('lab-auto-print',submit);
 return()=>ipcMain.removeHandler?.('lab-auto-print');
}
module.exports={installAutoPrint,validateJob};
