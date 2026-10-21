import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const bundle='index-UIRefine-v655-r84.js';
const bundlePath='dist/web/assets/'+bundle;
const cssName='photobridge-r1332-gallery-cards.css';
const cssPath='dist/web/'+cssName;
let source=fs.readFileSync(bundlePath,'utf8');

function changeOnce(before,after,label){
  if(source.includes(after))return;
  const count=source.split(before).length-1;
  if(count!==1)throw new Error('R1337 '+label+' anchor expected once, found '+count);
  source=source.replace(before,after);
}

// Re-fetch without temporarily unmounting and recreating the open gallery.
changeOnce(
  'l(null),l(await Me(',
  'String(o?.gallery?.id||"")!==String(L)&&l(null),l(await Me(',
  'manager refresh'
);

// The latest retouch is a corrected version only when uploaded later than the
// still-open customer revision request, not merely because a file exists.
changeOnce(
  'return[...we.values()].map(H=>({...H,openRevision:[...H.revisions||[]].reverse().find(z=>!z.resolvedAt&&!z.resolved_at)||null}))',
  'return[...we.values()].map(H=>{const revision=[...(H.revisions||[])].reverse().find(z=>!z.resolvedAt&&!z.resolved_at)||null;const latest=Date.parse(String(H.retouch?.created_at||""));const requested=Date.parse(String(revision?.createdAt||revision?.created_at||""));return{...H,openRevision:revision,revisionUploaded:!!(revision&&Number.isFinite(latest)&&Number.isFinite(requested)&&latest>requested)}})',
  'correction timestamp'
);
changeOnce(
  'className:"clientGalleryRetouchCard clientGalleryRetouchCardV409 "+(Ee.openRevision?"needsRevision":"")',
  'className:"clientGalleryRetouchCard clientGalleryRetouchCardV409 "+(Ee.openRevision&&!Ee.revisionUploaded?"needsRevision":Ee.revisionUploaded?"revisionUploaded":"")',
  'corrected card highlight'
);
changeOnce(
  'e.jsx("figcaption",{children:"نسخه روتوش"})',
  'e.jsx("figcaption",{children:Ee.revisionUploaded?"نسخه اصلاح‌شده جدید":"نسخه روتوش"})',
  'correction caption'
);
changeOnce(
  'e.jsx("small",{children:Ee.kinds.join(" · ")}),Ee.note&&',
  'e.jsx("small",{children:Ee.kinds.join(" · ")}),e.jsx("span",{className:"pb1337RetouchUploadState "+(Ee.revisionUploaded?"isUpdated":Ee.openRevision?"needsUpdate":"hasRetouch"),role:"status",children:F===Ee.mediaId?"در حال بارگذاری نسخه جدید…":Ee.openRevision?(Ee.revisionUploaded?"✓ نسخه اصلاح‌شده جدید بارگذاری شد":"این عکس منتظر آپلود اصلاحیه است"):Ee.retouch?"✓ نمونه روتوش بارگذاری شده":"هنوز نمونه روتوش بارگذاری نشده"}),Ee.note&&',
  'per-photo upload feedback'
);
changeOnce(
  '),await o()}catch(z){window.pb1113GalleryNotice',
  '),await o(),window.pb1113GalleryNotice("✓ نمونه روتوش جدید بارگذاری شد و پیش‌نمایش به‌روز شد.")}catch(z){window.pb1113GalleryNotice',
  'upload confirmation'
);
fs.writeFileSync(bundlePath,source);

let css=fs.readFileSync(cssPath,'utf8');
if(!css.includes('/* R1337 gallery retouch upload feedback */')){
  css+='\n/* R1337 gallery retouch upload feedback */\n'
  +'.clientGalleryRetouchMeta .pb1337RetouchUploadState{display:inline-flex;align-items:center;width:fit-content;max-width:100%;margin:8px 0;padding:5px 10px;border-radius:9px;border:1px solid #cbd5e1;background:#f8fafc;color:#475467;font:700 12px/1.9 Vazirmatn,Tahoma,sans-serif;white-space:normal}\n'
  +'.clientGalleryRetouchMeta .pb1337RetouchUploadState.needsUpdate{background:#fff5eb;border-color:#fed7aa;color:#9a3412}\n'
  +'.clientGalleryRetouchMeta .pb1337RetouchUploadState.isUpdated{background:#ecfdf3;border-color:#abefc6;color:#067647}\n'
  +'.clientGalleryRetouchCard.revisionUploaded{border-color:#abefc6!important;box-shadow:0 0 0 1px #abefc644!important}\n';
}
fs.writeFileSync(cssPath,css);

function walk(dir){
  if(!fs.existsSync(dir))return;
  for(const item of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,item.name);
    if(item.isDirectory()){walk(file);continue;}
    if(!file.endsWith('.html'))continue;
    let html=fs.readFileSync(file,'utf8');
    if(!html.includes(bundle))continue;
    html=html.replace(/(index-UIRefine-v655-r84\.js)([^"'<>\s]*)/g,(_,name,q)=>{
      const clean=q.replace(/[?&]retouchReload=[^&]*/g,'').replace(/[?&]$/,'');
      return name+clean+(clean.includes('?')?'&':'?')+'retouchReload=r1337';
    });
    html=html.replace(/(photobridge-r1332-gallery-cards\.css)([^"'<>\s]*)/g,(_,name,q)=>{
      const clean=q.replace(/[?&]retouchReload=[^&]*/g,'').replace(/[?&]$/,'');
      return name+clean+(clean.includes('?')?'&':'?')+'retouchReload=r1337';
    });
    fs.writeFileSync(file,html);
    if(html.includes(cssName)){
      const dest=path.join(path.dirname(file),cssName);
      if(fs.existsSync(dest)&&path.resolve(dest)!==path.resolve(cssPath))fs.copyFileSync(cssPath,dest);
    }
  }
}
walk('dist/web');walk('dist/api');

for(const channel of ['desktop-ui','lab-desktop-ui']){
  const root=path.resolve('dist/web',channel);
  for(const [from,to] of [[bundlePath,path.join(root,'assets',bundle)],[cssPath,path.join(root,cssName)]]){
    if(fs.existsSync(to))fs.copyFileSync(from,to);
  }
  const manifestPath=path.join(root,'manifest.json');
  if(!fs.existsSync(manifestPath))continue;
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  for(const entry of manifest.files){
    const file=path.resolve(root,entry.name);
    if(!file.startsWith(root+path.sep))throw new Error('R1337 invalid desktop manifest path');
    entry.sha256=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  }
  manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
  fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
}
console.log('[R1337] Gallery refresh stays mounted; revised retouch proofs show explicit per-photo status.');
