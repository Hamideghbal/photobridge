import fs from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';

const require=createRequire(import.meta.url);
const {PB1588makeCompletionQueue}=require('./r1588-completion-queue.cjs');
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';
let js=fs.readFileSync(bundle,'utf8');

const insert='const PB1587uploadOne=async({bt,tt})=>{';
const original='await Me("/api/customer/uploads/complete",{method:"POST",body:JSON.stringify({fileId:Gt.fileId})});';
const newConfirm='await PB1588verifyUpload(Gt.fileId,tt.file);';
const helper=[
  'const PB1588verifyUpload=('+PB1588makeCompletionQueue.toString()+')({',
  'complete:fileId=>Me("/api/customer/uploads/complete",{method:"POST",body:JSON.stringify({fileId})}),',
  'assertActive:ye,sleep:ms=>new Promise(resolve=>setTimeout(resolve,ms)),maxRetries:2',
  '});'
].join('\n');

if(js.includes('const PB1588verifyUpload=')){
 if(js.includes(original))throw new Error('R1588 old and new completion paths are both present');
 console.log('R1588 confirmation retry queue already installed');
}else{
 if(!js.includes('PB1587runUploadPool(PB1587jobs,E.current.some'))
   throw new Error('R1588 requires R1587 print upload pool');
 for(const anchor of [insert,original]){
   const n=js.split(anchor).length-1;
   if(n!==1)throw new Error('R1588 expected one anchor, found '+n+': '+anchor.slice(0,75));
 }
 js=js.replace(insert,helper+insert);
 js=js.replace(original,newConfirm);
 const fallback=':"ارسال سفارش کامل نشد؛ دوباره تلاش کن.")';
 const better=':([502,503,504].includes(Number(ye?.status||0))?"عکس‌ها منتقل شدند، ولی سرور هنگام تأیید نهایی پاسخ نداد (خطای "+String(ye.status)+"). لطفاً کمی بعد دوباره تلاش کن.":"ارسال سفارش کامل نشد؛ دوباره تلاش کن."))';
 if(js.split(fallback).length===2)js=js.replace(fallback,better);
 if(!js.includes(newConfirm)||js.includes(original))throw new Error('R1588 patch validation failed');
 fs.writeFileSync(bundle,js);
 execFileSync(process.execPath,['--check',bundle],{stdio:'inherit'});
 console.log('[R1588] 3 parallel PUTs preserved, one completion at a time, same-file JPEG confirmation retry on transient gateway error');
}
