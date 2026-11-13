
/* R1821: invoices belong to the issuing laboratory, not to PhotoBridge.
   Update the shared invoice preview, browser print HTML and browser PDF canvas.
   Never change document amounts, lab/customer identity, accounting or API. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const once=(s,a,b,label)=>{
 const count=s.split(a).length-1;
 if(count!==1)throw Error('[R1821] '+label+' occurrence count '+count);
 return s.replace(a,b);
};
const region=(s,start,end,fn,label)=>{
 const a=s.indexOf(start),b=a<0?-1:s.indexOf(end,a+start.length);
 if(a<0||b<=a)throw Error('[R1821] '+label+' bounds changed');
 return s.slice(0,a)+fn(s.slice(a,b))+s.slice(b);
};
/* Earlier invoice patches can change the PDF footer wording. Only the issuer
   brand is replaced; do not match an entire historical sentence. */
function pb1821PatchCanvasCaption(src,label){
 let changed=0;
 const out=src.replace(/s\.fillText\("([^"]*PhotoBridge[^"]*)",o,(\d+)(?:,\d+)?\)/g,(full,caption,y)=>{
  if(Number(y)<1000)return full;
  changed++;
  const quote=String.fromCharCode(96);
  return 's.fillText('+quote+caption.replaceAll('PhotoBridge','${pb1821LabInvoiceIssuer(t)}')+quote+',o,'+y+',1050)';
 });
 if(changed>1)throw Error('[R1821] '+label+' duplicate PDF issuer captions '+changed);
 if(/s\.fillText\("[^"]*PhotoBridge[^"]*",o,(?:1[0-9]{3}|[2-9][0-9]{3})/.test(out))
  throw Error('[R1821] '+label+' unhandled branded PDF footer');
 return out;
}
function pb1821PatchHtmlCaption(src,label){
 let changed=0;
 const out=src.replace(/<div class="note">([^<]*PhotoBridge[^<]*)<\/div>/g,(full,caption)=>{
  changed++;
  return '<div class="note">'+caption.replaceAll('PhotoBridge','${_n(pb1821LabInvoiceIssuer(t))}')+'</div>';
 });
 if(changed>1)throw Error('[R1821] '+label+' duplicate printable issuer captions '+changed);
 if(/<div class="note">[^<]*PhotoBridge/.test(out))
  throw Error('[R1821] '+label+' unhandled branded print footer');
 return out;
}
const asset='assets/index-UIRefine-v655-r84.js';
const helper='function pb1821LabInvoiceIssuer(t){return String((t==null?void 0:t.lab_name)||(t==null?void 0:t.labName)||"").trim()||"لابراتوار";}';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/'+asset;
 let js=read(file);
 js=once(js,'async function Wu(t){',helper+'async function Wu(t){',root+' invoice issuer resolver');
 js=region(js,'async function Wu(t){','function Vy(t,a){',s=>{
  s=once(s,'s.fillText("PhotoBridge",o,c)','s.fillText(pb1821LabInvoiceIssuer(t),o,c,720)',root+' invoice PDF heading');
  s=pb1821PatchCanvasCaption(s,root+' invoice PDF issuer caption');
  return s;
 },root+' PDF canvas');
 js=region(js,'function Vy(t,a){','function Wy(t,a){',s=>{
  s=once(s,'<div class="brand">PhotoBridge</div>',
   '<div class="brand">\${_n(pb1821LabInvoiceIssuer(t))}</div>',root+' printable invoice heading');
  s=pb1821PatchHtmlCaption(s,root+' printable invoice issuer caption');
  return s;
 },root+' print HTML');
 js=once(js,'e.jsx("span",{className:"invoicePaperBrand",children:"PhotoBridge"})',
  'e.jsx("span",{className:"invoicePaperBrand",children:pb1821LabInvoiceIssuer(a)})',
  root+' onscreen invoice preview');
 const start=js.indexOf('async function Wu(t){'),end=js.indexOf('function Wy(t,a){',start);
 const invoice=js.slice(start,end);
 if(!invoice.includes('pb1821LabInvoiceIssuer(t)')||invoice.includes('<div class="brand">PhotoBridge</div>')||invoice.includes('فاکتور توسط PhotoBridge')||js.split('function pb1821LabInvoiceIssuer(').length!==2)
  throw Error('[R1821] '+root+' invoice contract validation failed');
 write(file,js);
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const htmlPath=root+'/index.html';
 let html=read(htmlPath);
 html=once(html,'</head>','</head>',root+' page head'); 
 let updated=0;
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>{updated++;return u+'&invoiceIssuer=r1821';});
 if(updated!==1)throw Error('[R1821] '+root+' frontend JS tag count '+updated);
 write(htmlPath,html);
}
const native='dist/web/lab-desktop-ui',manifestPath=native+'/manifest.json',m=JSON.parse(read(manifestPath));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const name of [asset,'index.html']){
 const hash=sha(fs.readFileSync(native+'/'+name));
 const entry=m.files.find(x=>x.name===name);
 if(entry)entry.sha256=hash;
 else m.files.push({name,url:'/lab-desktop-ui/'+name,sha256:hash});
}
m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
m.build=sha(JSON.stringify(m.files));
m.generatedAt=new Date().toISOString();
write(manifestPath,JSON.stringify(m));
console.log('[R1821] laboratory name now heads invoice preview, print HTML and browser-generated PDF in web and Windows');
