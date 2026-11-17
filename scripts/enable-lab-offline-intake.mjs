import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root='dist/web/lab-desktop-ui';
const intakeName='photobridge-r1137-lab-local-intake.js';
const intakePath=root+'/'+intakeName;
const offlineReturn="if(typeof navigator!=='undefined'&&navigator.onLine===false){error.textContent='این فرم هنوز برای ثبت نهایی به اتصال سرور نیاز دارد. هیچ سفارشی ثبت نشده است؛ پس از اتصال دوباره اقدام کنید.';return;}";
const preflightStart="  if(pb1884PreflightBusy)return;";
const preflightEnd="  if(active!==modal)return;";
const once=(source,anchor,replacement)=>{
 if(source.split(anchor).length!==2)throw Error('Lab offline intake anchor changed: '+anchor.slice(0,100));
 return source.replace(anchor,replacement);
};
let source=fs.readFileSync(intakePath,'utf8');
if(!source.includes('const labOutbox=labIntakeOutbox();')){
 // Capture the existing online request shapes, including optional album and photo fields.
 const order=source.match(/if\(!order\)order=await api\('\/api\/lab\/delegated-orders',({[^\n]+})\);/)?.[1];
 const files=source.match(/const pb1569Payload=(entries\.map\(item=>\(\{[\s\S]*?\}\)\));/)?.[1]
  ||source.match(/'\/files\/presign',\s*({clientFileId:item\.id,[^}]+})\)/)?.[1];
 const submit=source.match(/const result=await api\('\/api\/lab\/delegated-orders\/'\+order\.orderId\+'\/submit',({[^\n]+})\);/)?.[1];
 if(!order||!files||!submit)throw Error('Lab offline intake request shape changed');
 const filePayload=(files.startsWith('{')?'entries.map(item=>('+files+'))':files)
  .replace('localOnly:true','localOnly:true,chassis:!!item.chassis,frame:!!item.frame');
 source=once(source,offlineReturn,'');
 const primaryOpen="cachedPrimary?Promise.resolve({registered:true,isThisDevice:true}):api('/api/lab/download-device')";
 source=once(source,primaryOpen,"cachedPrimary?Promise.resolve({registered:true,isThisDevice:true}):labOutboxPrimary()");
 const primaryCheck="Promise.race([api('/api/lab/download-device'),";
 source=once(source,primaryCheck,"Promise.race([labOutboxPrimary(),");
 const start=source.indexOf(preflightStart),end=source.indexOf(preflightEnd,start);
 if(start<0||end<0)throw Error('Lab offline intake preflight boundary changed');
 const preflight=source.slice(start,end);
 source=once(source,preflight,`  if(pb1884PreflightBusy)return;
  pb1884PreflightBusy=true;
  busy(true);
  let device;
  try{
   error.textContent='در حال بررسی ارتباط با سرور…';
   if(!labOutboxOffline())device=await pb1884Bounded(labOutboxLiveDevice(),2600);
  }catch(problem){
   if(!labOutboxConnectionFailed(problem)){
    error.textContent=problem.message;
    pb1884PreflightBusy=false;busy(false);return;
   }
  }
  pb1884PreflightBusy=false;
  if(device&&!device.queued&&!device.operationId&&(!device.registered||!device.isThisDevice)){
   busy(false);error.textContent=errors.not_primary_download_device;return;
  }
  if(!device||device.queued||device.operationId){
   try{
    error.textContent='در حال ذخیره سفارش و عکس‌ها روی این دستگاه…';
    await labOutboxSave(bootstrap,clientOrderId,${order},${submit},entries,${filePayload});
    form.replaceChildren(node('h3','سفارش روی این دستگاه ذخیره شد'),node('p','شماره پیگیری محلی: '+clientOrderId.slice(0,8)),node('p','در انتظار همگام‌سازی. پس از اتصال به سرور، سفارش به‌صورت خودکار ارسال می‌شود.'));
    const done=node('button','بستن');done.type='button';done.onclick=closeModal;form.append(done);
    modal.classList.add('pb1519IntakeComplete');
    window.dispatchEvent(new Event('photobridge-lab-outbox-changed'));
    void labOutboxSync();
   }catch(problem){
    error.textContent=problem.name==='QuotaExceededError'?'فضای ذخیره‌سازی این دستگاه کافی نیست. سفارش آفلاین ذخیره نشد.':problem.message;
   }finally{busy(false);}
   return;
  }
  busy(false);
`);
 source=once(source,' refreshInvoice();\n modal.showModal();',' refreshInvoice();\n const pendingNotice=node(\'p\');pendingNotice.hidden=true;pendingNotice.setAttribute(\'role\',\'status\');form.prepend(pendingNotice);labOutboxPendingNotice(pendingNotice);\n modal.showModal();');
 source=once(source,'const storage=()=>window.pbLabLocalIntakeStorage;',
  'const storage=()=>window.pbLabLocalIntakeStorage;\n'+fs.readFileSync('scripts/lab-offline-intake.js','utf8'));
 fs.writeFileSync(intakePath,source);
}
execFileSync(process.execPath,['--check',intakePath],{stdio:'inherit'});
const index=root+'/index.html';
let html=fs.readFileSync(index,'utf8');
if(!html.includes('offlineWalkIn=v1'))html=once(html,'nativeResponsive=r1884','nativeResponsive=r1884&offlineWalkIn=v1');
fs.writeFileSync(index,html);
const manifestPath=root+'/manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
for(const name of [intakeName,'index.html']){
 const entry=manifest.files.find(entry=>entry.name===name);
 if(!entry)throw Error('Lab offline intake manifest missing '+name);
 entry.sha256=hash(fs.readFileSync(root+'/'+name));
}
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));

const serverPath='dist/api/server.js';
let server=fs.readFileSync(serverPath,'utf8');
const marker='/* Native walk-in live device probe */';
if(!server.includes(marker)){
 const alias="if(req.method==='GET'&&suffix==='bootstrap')url.pathname='/api/lab/delegated-orders/bootstrap';";
 server=once(server,alias,`${marker}
            ${alias}
            else if(req.method==='GET'&&suffix==='device')url.pathname='/api/lab/download-device';`);
 const deviceResponse='return sendJson(res, 200, { registered, isThisDevice: Boolean(registered && requestDeviceId && requestDeviceId === row.primary_download_device_id),';
 server=once(server,deviceResponse,"res.setHeader('Cache-Control','no-store');\n            "+deviceResponse.replace('{ registered','{ labId, userId:a.userId, registered'));
 fs.writeFileSync(serverPath,server);
}
execFileSync(process.execPath,['--check',serverPath],{stdio:'inherit'});
