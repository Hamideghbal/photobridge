import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const bundle='assets/index-UIRefine-v655-r84.js';
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const one=(s,a,b,label)=>{
 if(s.split(a).length!==2)throw Error('R1547 '+label+' changed');
 return s.replace(a,b);
};
let s=fs.readFileSync('dist/web/'+bundle,'utf8');
if(!s.includes('/* PB1547 readable invoice and fast ready stage */')){
 const a=s.indexOf('function Oc({role:t,invoice:'),b=s.indexOf('function ',a+19);
 if(a<0||b<a)throw Error('R1547 invoice component missing');
 let invoice=s.slice(a,b);
 invoice=one(invoice,'f(Math.max(.58,F))',
  'f(t==="lab"?Math.max(.9,Math.min(1.05,k/C)):Math.max(.58,F))','invoice zoom');
 invoice=one(invoice,'e.jsx("button",{onClick:s,children:"×"})',
  'e.jsx("button",{type:"button",className:"pb1547InvoiceClose","aria-label":"بستن پنجره فاکتور",title:"بستن",onClick:s,children:e.jsx("span",{"aria-hidden":true,children:"×"})})','close control');
 s=s.slice(0,a)+invoice+s.slice(b);
 const downloadStart=s.indexOf('Vn=async(le,options={})=>'),downloadEnd=s.indexOf(',un=async le=>',downloadStart);
 if(downloadStart<0||downloadEnd<0)throw Error('R1547 download handler missing');
 let download=s.slice(downloadStart,downloadEnd);
 download=one(download,'alert(warning||(result.alreadyComplete?', 'pb1547DownloadDialog(warning||(result.alreadyComplete?','download confirmed notice');
 s=s.slice(0,downloadStart)+download+s.slice(downloadEnd);
 const printStart=s.indexOf('un=async le=>'),printEnd=s.indexOf(',Cn=async(le,nt)=>',printStart);
 if(printStart<0||printEnd<0)throw Error('R1547 print ready handler missing');
 let print=s.slice(printStart,printEnd);
 const ready='await ye(),await Gt(le,"ready"),qt=!0';
 if(print.split(ready).length!==3)throw Error('R1547 two print-ready transitions missing');
 print=print.replaceAll(ready,'k("ready");qt=!0;void ye().catch(()=>{});void Gt(le,"ready").catch(()=>{})');
 const p1=print.indexOf('const Bt=await Wu(Zt.invoice)');
 const p2=print.indexOf('}catch(Zt){',p1);
 if(p1<0||p2<0)throw Error('R1547 invoice PDF block missing');
 const success='P("سفارش #"+V(le.number)+" آماده تحویل شد · فاکتور #"+V(Zt.invoice.number)+" صادر شد");';
 print=print.slice(0,p1)+success+'void pb1547CompletePdf(Zt.invoice,le.id,ai());return'+print.slice(p2);
 s=s.slice(0,printStart)+print+s.slice(printEnd);
 const albumStart=s.indexOf('Cn=async(le,nt)=>'),albumEnd=s.indexOf(',aa=async(le,nt)=>',albumStart);
 if(albumStart<0||albumEnd<0)throw Error('R1547 album ready handler missing');
 let album=s.slice(albumStart,albumEnd);
 album=one(album,'nt==="ready"&&(await ye(),await Gt(le,"ready"),qt=!0)',
  'nt==="ready"&&(k("ready"),qt=!0,void ye().catch(()=>{}),void Gt(le,"ready").catch(()=>{}))','album ready transition');
 const a1=album.indexOf('nt==="ready"&&Zt.invoice){');
 const a2=album.indexOf('nt!=="ready"&&(',a1);
 if(a1<0||a2<0)throw Error('R1547 album PDF block missing');
 const albumPDF='nt==="ready"&&Zt.invoice){void pb1547CompletePdf(Zt.invoice,le.id,ai())}';
 album=album.slice(0,a1)+albumPDF+album.slice(a2);
 s=s.slice(0,albumStart)+album+s.slice(albumEnd);
 s+='\n/* PB1547 readable invoice and fast ready stage */\n'+fs.readFileSync('scripts/r1547-invoice-download-notice.js.txt','utf8')+'\n';
 fs.writeFileSync('dist/web/'+bundle,s);
}
execFileSync(process.execPath,['--check','dist/web/'+bundle],{stdio:'inherit'});
const css='photobridge-r1547-invoice-download.css';
const native='dist/web/lab-desktop-ui';
for(const root of ['dist/web',native]){
 let html=fs.readFileSync(root+'/index.html','utf8');
 if(!html.includes(css))html=html.replace('</head>','<link rel="stylesheet" href="/'+css+'?v=r1547"></head>');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,value=>value.includes('&labInvoice=r1547')?value:value+'&labInvoice=r1547');
 fs.writeFileSync(root+'/index.html',html);
}
const nativeBundle=s.replace('const ai=()=>!pb1483Phone()&&typeof window.showDirectoryPicker=="function"','const ai=()=>typeof window.showDirectoryPicker=="function"');
if(!nativeBundle.includes('const ai=()=>typeof window.showDirectoryPicker=="function"'))throw Error('R1547 native storage capability changed');
fs.writeFileSync(native+'/'+bundle,nativeBundle);
fs.copyFileSync('dist/web/'+css,native+'/'+css);
const manifestPath=native+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(manifest.protocol!==1||manifest.channel!=='lab')throw Error('R1547 Windows UI contract changed');
for(const name of [bundle,css,'index.html']){
 const value=hash(fs.readFileSync(native+'/'+name)),entry=manifest.files.find(file=>file.name===name);
 if(entry)entry.sha256=value;else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256:value});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log('[PhotoBridge R1547] readable lab invoice, branded download confirmation, confirmed-first ready status',manifest.build.slice(0,12));
