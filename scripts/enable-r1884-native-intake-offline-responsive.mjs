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
 code=once(code,
  " finally{opening=false;if(launch){launch.disabled=false;launch.textContent='ثبت سفارش عکس حضوری';}}",
  " finally{opening=false;if(launch){launch.disabled=false;launch.textContent='ثبت سفارش عکس حضوری';}}\n if(pb1884Cancelled)return;\n  if(pb1884Warmup.open)pb1884Warmup.close();pb1884Warmup.remove();",
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
 // A previously validated primary device must keep its launcher during
 // temporary connectivity loss; never grant new primary authorization offline.
 code=once(code,
  "catch{primaryState=false;}finally{checking=false;schedule();}",
  "catch{if(primaryState!==true)primaryState=false;}finally{checking=false;schedule();}",
  'retain existing verified device state only');
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
