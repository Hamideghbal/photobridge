import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/web/assets/index-UIRefine-v655-r84.js';let s=fs.readFileSync(path,'utf8');
function change(region,a,b,name){const n=region.split(a).length-1;if(n!==1)throw Error('R1182 browser '+name+': '+n);return region.replace(a,b);}
const alreadyPatched=(s.includes('pbDownloadName=filename')&&s.includes('downloadName=o.pbDownloadName||a.original_name')&&s.includes('preflight.fallbackOriginalCount'))
 ||(s.includes("pbFallbackOriginal=res.headers.get('x-pb-fallback-original')==='1'")&&s.includes('async function Qy(t,a,s){return pb1445DownloadFile')&&s.includes('async function Dg(t,a,s={}){return pb1450Download'));
if(!s.includes('PB1182 original-format download fallback')&&!alreadyPatched){
 const a=s.indexOf('async function Ky(t){'),b=s.indexOf('async function Qy(',a),c=s.indexOf('async function Dg(',b);
 if(a<0||b<0||c<0)throw Error('R1182 download helpers changed');
 let ky=s.slice(a,b),qy=s.slice(b,c);
 ky=change(ky,'return r}',"/* PB1182 original-format download fallback */r.pbDownloadName=String(a.name||'');r.pbDownloadBytes=Number(a.bytes||0);r.pbFallbackOriginal=!!a.fallbackOriginal;return r}",'response metadata');
 const nameCount=qy.split('a.original_name').length-1,byteCount=qy.split('a.bytes').length-1;
 if(nameCount!==3||byteCount!==1)throw Error('R1182 Qy shape changed '+nameCount+'/'+byteCount);
 qy=qy.replaceAll('a.original_name','downloadName').replaceAll('a.bytes','downloadBytes');
 qy=change(qy,'const r=await el(t,a),o=await Ky(a.id);',
 'const r=await el(t,a),o=await Ky(a.id),downloadName=o.pbDownloadName||a.original_name,downloadBytes=Number(o.pbDownloadBytes||a.bytes||0);','actual file name and bytes');
 qy=change(qy,'return{rootName:r.root.name,day:r.day,size:c.size}',
 'return{rootName:r.root.name,day:r.day,size:c.size,fallbackOriginal:!!o.pbFallbackOriginal,downloadName}','download warning metadata');
 s=s.slice(0,a)+ky+qy+s.slice(c);
 const bt=String.fromCharCode(96),expression='$'+'{t.order.id}',needle='await Me('+bt+'/api/lab/orders/'+expression+'/download-check'+bt+');';
 const replacement='await Me('+bt+'/api/lab/orders/'+expression+'/download-check'+bt+').then(preflight=>{if(Number(preflight.fallbackOriginalCount||0)>0)window.alert("نسخه آماده چاپ "+String(preflight.fallbackOriginalCount)+" عکس روی سرور پیدا نشد؛ نسخه اصلی این عکس‌ها دریافت می‌شود. قبل از چاپ فرمت فایل‌ها را بررسی کنید: "+(preflight.fallbackNames||[]).join("، "));});';
 s=change(s,needle,replacement,'operator fallback warning');
 fs.writeFileSync(path,s);
}
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});

execFileSync(process.execPath,['--test','scripts/test-r1182-lab-file-availability.cjs'],{stdio:'inherit'});
