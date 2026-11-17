// R1884: Windows Lab manual intake must not leave its launcher unresponsive
// during slow/unreachable server bootstrap. This patch changes only the
// native UI snapshot; it does NOT claim an offline server order was committed.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root='dist/web/lab-desktop-ui';
const name='photobridge-r1137-lab-local-intake.js';
const path=root+'/'+name;
const mark='/* PB1884 native intake immediate preparation */';
const once=(source,before,after,label)=>{
 const n=source.split(before).length-1;
 if(n!==1)throw Error('[R1884] '+label+' expected once, got '+n);
 return source.replace(before,after);
};
let code=fs.readFileSync(path,'utf8');
if(!code.includes(mark)){
 const prepare=[
  '  '+mark,
  "  const pb1884Warmup=node('dialog',null,'pb1137Intake pb1884IntakeWarmup');",
  "  const pb1884Header=node('header'),pb1884Dismiss=node('button','بستن');",
  "  pb1884Dismiss.type='button';",
  "  pb1884Header.append(node('h2','سفارش دستی'),pb1884Dismiss);",
  "  pb1884Warmup.append(pb1884Header,node('p','در حال بررسی مسیر هارد و اطلاعات لابراتوار…'));",
  "  let pb1884Cancelled=false;",
  "  const pb1884Close=()=>{pb1884Cancelled=true;if(pb1884Warmup.open)pb1884Warmup.close();pb1884Warmup.remove();};",
  "  pb1884Dismiss.onclick=pb1884Close;",
  "  pb1884Warmup.addEventListener('cancel',e=>{e.preventDefault();pb1884Close();});",
  "  document.body.append(pb1884Warmup);pb1884Warmup.showModal();",
  "  const pb1884Bounded=(promise,ms)=>{let timer;return Promise.race([Promise.resolve(promise),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('دریافت اطلاعات از سرور انجام نشد. اتصال را بررسی کنید و دوباره تلاش کنید.')),ms);})]).finally(()=>clearTimeout(timer));};"
 ].join('\n');
 code=once(code,
  " const provider=storage();let directory,bootstrap,loadError;",
  prepare+"\n const provider=storage();let directory,bootstrap,loadError;",
  'initial modal preparation');
 code=once(code,
  "const [primary,root,data]=await Promise.all([",
  "const [primary,root,data]=await pb1884Bounded(Promise.all([",
  'bootstrap barrier');
 // Close only the top-level three-request bootstrap Promise.all. Later optional
 // live customer enrichment remains a separate guarded request.
 const start=code.indexOf("const [primary,root,data]=await pb1884Bounded(Promise.all([");
 const end=code.indexOf("  if(!primary.registered",start);
 if(start<0||end<0)throw Error('[R1884] device bootstrap section unavailable');
 const section=code.slice(start,end);
 if(section.split("  ]);").length!==2)throw Error('[R1884] bootstrap Promise.all terminator changed');
 code=code.slice(0,start)+section.replace("  ]);","  ]),(typeof navigator!=='undefined'&&navigator.onLine===false)?1200:4500);")+code.slice(end);
 // All earlier installers can alter the launch button's finally block.
 // Insert the cleanup at the *next stable stage* (construction of the real
 // order modal) instead of pinning the obsolete finally statement exactly.
 code=once(code,
  "const modal=node('dialog',null,'pb1137Intake');",
  "if(pb1884Cancelled)return;\n if(pb1884Warmup.open)pb1884Warmup.close();pb1884Warmup.remove();\n const modal=node('dialog',null,'pb1137Intake');",
  'release preparation dialog');
 // Optional live-only enrichment in older installers can independently
 // wait for a dead connection, even after the normal bootstrap returned.
 const optional="try{const live=await api('/api/lab/intake-live/download/bootstrap'+(albumMode?'':'?mode=print'));";
 if(code.includes(optional))code=once(code,optional,
  "try{const live=await pb1884Bounded(api('/api/lab/intake-live/download/bootstrap'+(albumMode?'':'?mode=print')),1200);",
  'optional live customer enrichment');
 code=once(code,
  " form.onsubmit=async e=>{\n  e.preventDefault();if(submitting)return;",
  " form.onsubmit=async e=>{\n  e.preventDefault();if(submitting)return;\n  if(typeof navigator!=='undefined'&&navigator.onLine===false){error.textContent='این فرم هنوز برای ثبت نهایی به اتصال سرور نیاز دارد. هیچ سفارشی ثبت نشده است؛ پس از اتصال دوباره اقدام کنید.';return;}",
  'no false offline order success');
 // R1884: on Windows 7 a disconnected cable can still report navigator.onLine=true.
 // Verify connectivity with a bounded read-only request BEFORE any order/files
 // POST. This avoids a long unresponsive "submit" with no accidental writes.
 code=once(code,
  " form.onsubmit=async e=>{",
  " let pb1884PreflightBusy=false;\n form.onsubmit=async e=>{",
  'single-flight submission readiness');
 code=once(code,
  "  busy(true);error.textContent='در حال ذخیره روی هارد و ثبت سفارش…';",
  [
   "  if(pb1884PreflightBusy)return;",
   "  pb1884PreflightBusy=true;submit.disabled=true;",
   "  error.textContent='در حال بررسی ارتباط با سرور…';",
   "  try{",
   "   const device=await pb1884Bounded(api('/api/lab/download-device?manualPreflight='+Date.now()),2600);",
   "   if(!device?.registered||!device?.isThisDevice)throw Error('primary_device_required');",
   "  }catch{error.textContent='ارتباط با سرور برای ثبت سفارش برقرار نیست یا دستگاه اصلی تأیید نشد؛ هیچ سفارش جدیدی ثبت نشده است.';return;}",
   "  finally{pb1884PreflightBusy=false;submit.disabled=false;}",
   "  if(active!==modal)return;",
   "  busy(true);error.textContent='در حال ذخیره روی هارد و ثبت سفارش…';"
  ].join('\n'),
  'bounded submit preflight with no side effects');
 // Native offline startup: show the launcher even while a read-only primary
 // check is pending. A secondary device is still rejected after a definitive
 // response; open() and submit both retain server-side authorization checks.
 // Rate-limit read-only retries when the network is unreachable.
 code=once(code,
  "let primaryState=null,checking=false,primaryCheckedAt=0;",
  "let primaryState=null,checking=false,primaryCheckedAt=0,pb1884PrimaryFailAt=0;",
  'native primary-check backoff');
 // R1886: the Windows build can alter this guard before R1884 runs.
 // Only rewrite a recognized authorization gate in mount(), and never let
 // cosmetic launcher availability block the whole production deployment.
 const mountStart=code.indexOf('function mount(){');
 const mountEnd=code.indexOf('\nlet primaryState=',mountStart);
 if(mountStart<0||mountEnd<=mountStart)throw Error('[R1886] native launcher function boundary missing');
 const mountCode=code.slice(mountStart,mountEnd);
 // R1888: The final Windows installer can expose the launcher despite a
 // definitive negative primary-device response. Deny that state before any
 // legacy mount rendering; offline "unknown" remains subject to the server
 // verification in open() and before submit. Never authorize a secondary PC.
 const denySecondary="/* PB1888 deny secondary lab device */if(primaryState===false){document.getElementById('pb1137LocalIntakeButton')?.remove();return;}";
 if(!mountCode.includes('/* PB1888 deny secondary lab device */')){
  code=code.slice(0,mountStart)+mountCode.replace('function mount(){','function mount(){\n '+denySecondary+'\n')+code.slice(mountEnd);
 }
 // Refresh the isolated mount source after inserting the explicit denial.
 const currentMountCode=code.slice(mountStart,code.indexOf('\nlet primaryState=',mountStart));
 const guardPattern=/if\s*\(\s*primaryState\s*===\s*null\s*\)\s*\{[\s\S]{0,350}?\}\s*(?:else\s*)?if\s*\(\s*!primaryState\s*\)\s*\{[\s\S]{0,180}?\}/g;
 const guards=[...currentMountCode.matchAll(guardPattern)];
 const guard=guards.length===1?guards[0][0]:null;
 const safeGuard=guard&&/checkPrimary\s*\(/.test(guard)&&/old\?\.remove\s*\(/.test(guard)&&
   (guard.match(/\breturn\s*;/g)||[]).length>=2;
 if(safeGuard){
  const next="if(primaryState===null){if(!checking&&Date.now()-pb1884PrimaryFailAt>30000)checkPrimary();}else if(!primaryState){old?.remove();return;}";
  code=code.slice(0,mountStart)+currentMountCode.replace(guard,next)+code.slice(code.indexOf('\nlet primaryState=',mountStart));
  console.log('[R1886] Native launcher authorized-state guard updated.');
 }else{
  // The original guard is retained untouched. Other offline/slow-server
  // improvements still apply, without risking access from an unverified PC.
  console.warn('[R1886] Native launcher gate differs; preserving original device check.');
 }
 // R1886: an earlier native UI installer may have changed the device
 // polling implementation as well. Preserve its verified-only authorization
 // semantics instead of aborting the entire deployment on an unknown form.
 const optionalOnce=(source,before,after,label)=>{
  const count=source.split(before).length-1;
  if(count===1)return source.replace(before,after);
  console.warn('[R1886] '+label+' changed earlier; native device check retained (matches='+count+').');
  return source;
 };
 code=optionalOnce(code,
  "const state=await api('/api/lab/download-device');primaryState=state.registered&&state.isThisDevice;primaryCheckedAt=Date.now();",
  "const state=await Promise.race([api('/api/lab/download-device'),new Promise((_,reject)=>setTimeout(()=>reject(Error('offline')),2600))]);if(state?.queued||state?.operationId)throw Error('offline');primaryState=state.registered&&state.isThisDevice;primaryCheckedAt=Date.now();pb1884PrimaryFailAt=0;",
  'bounded primary-device read');
 code=optionalOnce(code,
  "catch{primaryState=false;}finally{checking=false;schedule();}",
  "catch{if(primaryState!==true)primaryState=null;pb1884PrimaryFailAt=Date.now();}finally{checking=false;schedule();}",
  'retain verified state during temporary disconnect');
 code=optionalOnce(code,
  "primaryState=null;primaryCheckedAt=0;schedule();",
  "primaryState=null;primaryCheckedAt=0;pb1884PrimaryFailAt=0;schedule();",
  'reset offline primary backoff after auth change');
 fs.writeFileSync(path,code);
}
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
const htmlPath=root+'/index.html';
let html=fs.readFileSync(htmlPath,'utf8');
const re=/(photobridge-r1137-lab-local-intake\.js\?[^"'<\s]*)/g;
let count=0;
html=html.replace(re,url=>{count++;return url.includes('nativeResponsive=r1884')?url:url+'&nativeResponsive=r1884';});
if(count!==1)throw Error('[R1884] native intake script URL expected once, got '+count);
fs.writeFileSync(htmlPath,html);
const manifestPath=root+'/manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(manifest.protocol!==1||manifest.channel!=='lab'||!Array.isArray(manifest.files))throw Error('[R1884] native manifest unexpected');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
for(const file of [name,'index.html']){
 const item=manifest.files.find(entry=>entry.name===file);
 if(!item)throw Error('[R1884] required native payload missing: '+file);
 item.sha256=hash(fs.readFileSync(root+'/'+file));
}
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log('[R1884] Native Lab intake opens responsive preparation dialog; missing connection fails visibly without fake order success.');
