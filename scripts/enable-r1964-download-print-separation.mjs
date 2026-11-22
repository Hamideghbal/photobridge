// R1964 — a verified file download is not an operator's "start printing" action.
// Run after the existing Lab stage/automation patches and before final compression.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const marker='/* PB1964 DOWNLOAD IS NOT PRINT */';
const read=path=>fs.readFileSync(path,'utf8');
const write=(path,value)=>fs.writeFileSync(path,value);
function one(text,oldValue,newValue,label){
 const count=text.split(oldValue).length-1;
 if(count!==1)throw Error('[R1964] '+label+' ambiguous anchor: '+count);
 return text.replace(oldValue,newValue);
}
function region(text,from,to,replace,label){
 const a=text.indexOf(from),b=a<0?-1:text.indexOf(to,a+from.length);
 if(a<0||b<=a)throw Error('[R1964] '+label+' region missing');
 return text.slice(0,a)+replace(text.slice(a,b))+text.slice(b);
}

const serverFile='dist/api/server.js';
let server=read(serverFile);
if(!server.includes(marker)){
 server=region(server,'const labAlbumDownloadComplete =','const labPaymentReceipt =',part=>{
  part=one(part,
    "album_stage=CASE WHEN album_stage IN ('binding','ready','completed') THEN album_stage ELSE 'printing' END,",
    "album_stage=CASE WHEN album_stage IN ('printing','binding','ready','completed') THEN album_stage ELSE 'files_received' END,",
    'album download must not enter print stage');
  part=one(part,
    "status=CASE WHEN status IN ('ready','completed') THEN status ELSE 'printing' END,",
    "status=CASE WHEN status IN ('printing','reviewing','needs_fix','ready_print','printed','ready','completed') THEN status ELSE 'downloaded' END,",
    'album download must not set printing status');
  part=part.replaceAll('دانلود آلبوم روی هارد کامل شد؛ ورود به مرحله چاپ',
                       'دانلود آلبوم روی هارد کامل شد؛ شروع چاپ در انتظار اپراتور');
  part=part.replaceAll('دانلود آلبوم کامل شد؛ ورود به مرحله چاپ',
                       'دانلود آلبوم کامل شد؛ شروع چاپ در انتظار اپراتور');
  return part;
 },'album download endpoint');
 server+='\n'+marker+'\n';
 write(serverFile,server);
 execFileSync(process.execPath,['--check',serverFile],{stdio:'inherit'});
}

const asset='assets/index-UIRefine-v655-r84.js';
const newMr='function mr(t){const status=String(t?.status||""),stage=String(t?.album_stage||"");'+
 'if(status==="completed")return "completed";if(status==="ready")return "ready";'+
 'if(["printing","binding","ready","completed"].includes(stage))return stage;'+
 'if(["designing","awaiting_photographer_approval","approved"].includes(stage))return "printing";'+
 'if(["printing","reviewing","ready_print","printed"].includes(status))return "printing";'+
 'return "files_received"}';
const newPn='Pn=le=>{const status=String(le?.status||""),stage=String(le?.album_stage||"");'+
 'const explicit=["printing","reviewing","ready_print","printed"].includes(status)||'+
 'kn(le,["printing","reviewing","ready_print","printed"]);'+
 'return Math.max(Hn(mr(le)),status==="completed"?4:status==="ready"?3:explicit?1:0)}';
const newRn='rn=(le,nt)=>{'+
 'const status=String(le?.status||""),albumStage=String(le?.album_stage||"");'+
 'if(pb1798NoPrintOrder(le))return nt==="received"?["received","completed"].includes(status):nt==="completed"?status==="completed":false;'+
 'const printed=kn(le,["printing","reviewing","ready_print","printed","ready","completed"])||'+
 '(o==="album"&&["printing","binding","ready","completed"].includes(albumStage));'+
 'const downloaded=!!le?.downloaded_at||kn(le,["downloaded","printing","reviewing","ready_print","printed","ready","completed"]);'+
 'if(o==="album"){'+
 'if(nt==="download")return downloaded;'+
 'if(nt==="print")return printed;'+
 'if(nt==="binding")return ["binding","ready","completed"].includes(albumStage)||["ready","completed"].includes(status);'+
 'if(nt==="ready")return ["ready","completed"].includes(albumStage)||kn(le,["ready","completed"]);'+
 'if(nt==="completed")return albumStage==="completed"||kn(le,["completed"]);'+
 'return false}'+
 'if(nt==="download")return downloaded;'+
 'if(nt==="print")return printed;'+
 'if(nt==="ready")return kn(le,["ready","completed"]);'+
 'if(nt==="completed")return kn(le,["completed"]);'+
 'return false}';
const newEn='en=(le,nt)=>{if(o==="album"){'+
 'if(nt==="download")return le?.downloaded_at||dn(le,["downloaded"]);'+
 'if(nt==="print")return dn(le,["printing"])||(["printing","binding","ready","completed"].includes(String(le?.album_stage||""))?le.updated_at:null);'+
 'if(nt==="binding")return ["binding","ready","completed"].includes(String(le?.album_stage||""))?le.updated_at:null;'+
 'if(nt==="ready")return dn(le,["ready"]);if(nt==="completed")return dn(le,["completed"]);return null}'+
 'if(nt==="download")return dn(le,["downloaded"]);'+
 'if(nt==="print")return dn(le,["printing","reviewing","ready_print","printed"]);'+
 'if(nt==="ready")return dn(le,["ready"]);if(nt==="completed")return dn(le,["completed"]);return null}';
const albumAction='if(o==="album")return nt==="download"?Vn(le):'+
 'nt==="print"&&rn(le,"download")&&!rn(le,"print")?Cn(le,"printing"):'+
 'nt==="binding"&&rn(le,"print")&&!rn(le,"binding")?Cn(le,"binding"):'+
 'nt==="ready"&&(rn(le,"binding")||!!le.invoice_id)&&(!rn(le,"ready")||le.status==="ready"&&le.invoice_id&&!le.invoice_pdf_ready)?Cn(le,"ready"):'+
 'nt==="completed"&&rn(le,"ready")&&!rn(le,"completed")?Cn(le,"completed"):void 0';
const albumEnabled='o==="album"?'+
 'nt==="download"?!rn(le,"download")&&["sent","received","downloaded"].includes(le.status):'+
 'nt==="print"?rn(le,"download")&&!rn(le,"print"):'+
 'nt==="binding"?rn(le,"print")&&!rn(le,"binding"):'+
 'nt==="ready"?(rn(le,"binding")||!!le.invoice_id)&&!rn(le,"ready")||le.status==="ready"&&le.invoice_id&&!le.invoice_pdf_ready:'+
 'nt==="completed"?rn(le,"ready")&&!rn(le,"completed"):false';

for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/'+asset;
 let ui=read(file);
 if(ui.includes(marker))continue;
 ui=one(ui,'files_received:"دانلود / چاپ",printing:"دانلود / چاپ"',
           'files_received:"دانلود",printing:"شروع چاپ"',root+' album labels');
 ui=region(ui,'function mr(t){','const R0=',()=>newMr,root+' album real stage');
 ui=one(ui,'const R0=[{value:"download_print",label:"دانلود / چاپ"},',
   'const R0=[{value:"download",label:"دانلود"},{value:"print",label:"شروع چاپ"},',
   root+' separate album buttons');
 ui=region(ui,'Pn=le=>',',rn=(le,nt)=>',()=>newPn,root+' album progress');
 ui=region(ui,'rn=(le,nt)=>',',en=(le,nt)=>',()=>newRn,root+' completed stage predicate');
 ui=region(ui,'en=(le,nt)=>',',It=async(le,nt,xt)=>',()=>newEn,root+' stage timestamps');
 ui=region(ui,'aa=async(le,nt)=>',',la=(le,nt)=>',part=>{
  const a=part.indexOf('if(o==="album")return');
  const b=a<0?-1:part.indexOf(';if(nt==="download"',a);
  if(a<0||b<0)throw Error('[R1964] album click handler changed '+root);
  return part.slice(0,a)+albumAction+part.slice(b);
 },root+' explicit album click');
 ui=region(ui,'la=(le,nt)=>',',Wn=async',part=>{
  const a=part.indexOf('o==="album"?');
  const b=a<0?-1:part.indexOf(':nt==="download"?',a);
  if(a<0||b<0)throw Error('[R1964] album enable handler changed '+root);
  return part.slice(0,a)+albumEnabled+part.slice(b);
 },root+' album button gate');

 // Both the order-card timeline and the detail drop-down must expose separate
 // controls. Fixing only the status predicates would leave the merged control
 // unable to start printing after a successful download.
 ui=one(ui,'const mn=o==="album"?[{key:"download_print",label:"دانلود / چاپ"},',
   'const mn=o==="album"?[{key:"download",label:"دانلود"},{key:"print",label:"شروع چاپ"},',
   root+' album timeline buttons');
 ui=one(ui,
   'value:["files_received","printing"].includes(mr(y.order))?"download_print":mr(y.order)',
   'value:["binding","ready","completed"].includes(mr(y.order))?mr(y.order):rn(y.order,"print")?"print":"download"',
   root+' album detail selector value');
 ui=region(ui,'ja=async le=>',',Va=le=>',part=>{
   const a=part.indexOf('if(le==="download_print")');
   const b=a<0?-1:part.indexOf(';const xt={binding:2,ready:3,completed:4}',a);
   if(a<0||b<0)throw Error('[R1964] album detail selector action changed '+root);
   const newAction='if(le==="download")return Vn(y.order,{force:pb1450Retry(y.order,yc(y.order.id))});'+
    'if(le==="print"){if(!rn(y.order,"download")||rn(y.order,"print"))return;'+
    'pe(!0);try{await Cn(y.order,"printing");await Tt({...y.order,album_stage:"printing"},!1).catch(()=>{})}finally{pe(!1)}return;}';
   return part.slice(0,a)+newAction+part.slice(b);
 },root+' album detail selector manual click');
 ui=one(ui,'مسیر آلبوم مستقل است: دانلود / چاپ، صحافی، آماده تحویل و تحویل‌شده.',
   'مسیر آلبوم مستقل است: دانلود، شروع چاپ دستی، صحافی، آماده تحویل و تحویل‌شده.',
   root+' album help');
 ui+='\n'+marker+'\n';
 write(file,ui);
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}
console.log('[R1964] verified download only; operator alone starts print, site and native Lab');
