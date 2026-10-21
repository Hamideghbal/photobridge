import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const bundle='dist/web/assets/index-UIRefine-v655-r84.js';
const cssFile='dist/web/photobridge-r1332-gallery-cards.css';
let js=fs.readFileSync(bundle,'utf8');
function change(before,after,label){
 if(js.includes(after))return;
 const count=js.split(before).length-1;
 if(count!==1)throw Error('[R1340] '+label+': expected one anchor, got '+count);
 js=js.replace(before,after);
}
// Initial retouch gets only neutral upload metadata. The correction indicator
// is reserved for an actual open revision request.
change(
 'e.jsx(PB1337RetouchStatus,{item:Ee,uploaded:PB1337uploads[Ee.mediaId],status:O.status})',
 'Ee.openRevision?e.jsxs("div",{className:"pb1340CorrectionState "+(Ee.revisionUploaded?"uploaded":"pending"),role:"status",children:[e.jsx("strong",{children:Ee.revisionUploaded?"✓ اصلاحیه جدید بارگذاری شد":"در انتظار بارگذاری اصلاحیه"}),Ee.revisionUploaded&&Ee.retouch?.created_at?e.jsx("small",{children:"زمان بارگذاری: "+Zn(Ee.retouch.created_at)}):null]}):Ee.retouch?.created_at?e.jsx("small",{className:"pb1340InitialRetouchDate",children:"تاریخ بارگذاری روتوش: "+Zn(Ee.retouch.created_at)}):null',
 'distinct initial and correction status'
);
// Allow first retouch proof for any selected photo, but after that only a photo
// with an unresolved customer correction may accept another upload.
change(
 '["submitted","retouching"].includes(String(O.status))&&e.jsxs("label",{className:"pbActionButton secondaryAction clientGalleryRetouchUpload "',
 '["submitted","retouching"].includes(String(O.status))&&(!Ee.retouch||!!Ee.openRevision)&&e.jsxs("label",{className:"pbActionButton secondaryAction clientGalleryRetouchUpload "',
 'correction-only button visibility'
);
change(
 'Ee.retouch?"تعویض نمونه روتوش":"بارگذاری نمونه روتوش"',
 'Ee.openRevision?"بارگذاری اصلاحیه":"بارگذاری نمونه روتوش"',
 'action label'
);
// Guard the handler against stale/cached UI as well.
change(
 'Ke=async(Ee,we)=>{var H;if(!(!we||!O)){M(Ee),PB1338setProgress',
 'Ke=async(Ee,we)=>{var H;if(!(!we||!O)){const photo=Z.find(item=>item.mediaId===Ee);if(photo?.retouch&&!photo.openRevision){window.pb1113GalleryNotice("برای این عکس درخواست اصلاح ثبت نشده است.");return;}M(Ee),PB1338setProgress',
 'file selection guard'
);
fs.writeFileSync(bundle,js);

let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('/* R1340 retouch revision distinction */')){
 css+='\n/* R1340 retouch revision distinction */\n'
 +'.clientGalleryRetouchMeta .pb1340InitialRetouchDate{display:block;margin-top:5px;color:#778397;font:500 11px/1.8 Vazirmatn,Tahoma,sans-serif;background:none;border:0;padding:0}\n'
 +'.clientGalleryRetouchMeta .pb1340CorrectionState{display:flex;flex-direction:column;gap:2px;align-items:flex-start;width:fit-content;max-width:100%;margin:8px 0;padding:7px 10px;border-radius:10px;font:700 12px/1.8 Vazirmatn,Tahoma,sans-serif}\n'
 +'.clientGalleryRetouchMeta .pb1340CorrectionState.pending{color:#9a3412;background:#fff7ed;border:1px solid #fed7aa}\n'
 +'.clientGalleryRetouchMeta .pb1340CorrectionState.uploaded{color:#067647;background:#ecfdf3;border:1px solid #abefc6}\n'
 +'.clientGalleryRetouchMeta .pb1340CorrectionState small{font-size:11px;font-weight:500;opacity:.8}\n';
}
fs.writeFileSync(cssFile,css);

function refreshHtml(dir){
 if(!fs.existsSync(dir))return;
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){refreshHtml(file);continue;}
  if(!file.endsWith('.html'))continue;
  const prev=fs.readFileSync(file,'utf8');
  const next=prev.replaceAll('retouchReload=r1338','retouchReload=r1340');
  if(prev!==next)fs.writeFileSync(file,next);
 }
}
refreshHtml('dist/web');
refreshHtml('dist/api');
for(const channel of ['desktop-ui','lab-desktop-ui']){
 const root=path.resolve('dist/web',channel);
 const copies=[[bundle,path.join(root,'assets/index-UIRefine-v655-r84.js')],[cssFile,path.join(root,'photobridge-r1332-gallery-cards.css')]];
 for(const [from,to] of copies)if(fs.existsSync(to))fs.copyFileSync(from,to);
 const manifestPath=path.join(root,'manifest.json');
 if(!fs.existsSync(manifestPath))continue;
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 for(const item of manifest.files){
  const file=path.resolve(root,item.name);
  if(!file.startsWith(root+path.sep))throw Error('[R1340] Invalid offline asset');
  item.sha256=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 }
 manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
 fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
}
console.log('[R1340] Initial retouch remains neutral; only requested corrections can be uploaded again.');
