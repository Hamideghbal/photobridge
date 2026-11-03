// R1571: Chrome 109 / Windows 7 cannot move source files via FileSystemHandle.remove().
// Keep ordinary photo selection + copy working in both the site and native shell.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
const load=p=>fs.readFileSync(p,'utf8'),save=(p,s)=>fs.writeFileSync(p,s);
const once=(s,a,b,k)=>{if(s.split(a).length!==2)throw Error('R1571 '+k+' anchor changed');return s.replace(a,b)};
const file='dist/web/photobridge-r1466-intake-move.js';
let picker=load(file);
if(!picker.includes('/* R1571 browser photo copy compatibility */')){
 const start="files=await new Promise(resolve=>{const input=node('input');input.type='file';input.multiple=true;input.accept='.jpg,.jpeg,.png,.tif,.tiff,.webp';input.hidden=true;document.body.append(input);input.onchange=()=>{const selected=[...input.files];input.remove();resolve(selected);};input.oncancel=()=>{input.remove();resolve(null);};input.click();});";
 const replacement=`files=await new Promise(resolve=>{
    // An actual file input works on Chrome 109 and does not need the File System Access API.
    // Position off-screen instead of [hidden], which may prevent user-gesture activation.
    const input=node('input');input.type='file';input.multiple=true;
    input.accept='.jpg,.jpeg,.png,.tif,.tiff,.webp';
    input.setAttribute('aria-label','انتخاب عکس برای کپی');
    input.style.cssText='position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.append(input);
    let finished=false;
    const done=value=>{if(finished)return;finished=true;removeEventListener('focus',onFocus);input.remove();resolve(value)};
    const onFocus=()=>setTimeout(()=>{if(!finished&&!input.files.length)done(null)},350);
    input.addEventListener('change',()=>done(Array.from(input.files)),{once:true});
    input.addEventListener('cancel',()=>done(null),{once:true});
    addEventListener('focus',onFocus);
    try{input.click()}catch(error){done(null)}
  });`;
 picker=once(picker,start,replacement,'copy picker');
 picker+='\n/* R1571 browser photo copy compatibility */\n';
 save(file,picker);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
const uiFile='dist/web/photobridge-r1137-lab-local-intake.js';
let ui=load(uiFile);
if(!ui.includes('/* R1571 Windows 7 manual photo picker */')){
 const existing="choose.onclick=()=>selectPhotos('copy');movePhotos.onclick=()=>selectPhotos('move');";
 const next=`choose.onclick=()=>selectPhotos('copy');
    // Legacy Windows 7 Chrome cannot delete source files with the File System Access API.
    // Hide misleading Move button; the Copy path remains fully usable.
    const nativeMove=Boolean(window.pbNativeFolder?.pickPhotos);
    const browserMove=typeof window.showOpenFilePicker==='function'
      &&typeof window.FileSystemFileHandle?.prototype?.remove==='function';
    if(!nativeMove&&!browserMove){
      movePhotos.hidden=true;movePhotos.disabled=true;
      movePhotos.title='این مرورگر انتقال مستقیم را پشتیبانی نمی‌کند؛ از کپی عکس استفاده کنید.';
    }else movePhotos.onclick=()=>selectPhotos('move');`;
 ui=once(ui,existing,next,'main picker controls');
 // Extra group button is created in renderGroups; guard it on legacy browsers.
 ui=once(ui,"moveMore.onclick=()=>addMore('move');head.append(moveMore);",
 `if(window.pbNativeFolder?.pickPhotos||(typeof window.showOpenFilePicker==='function'&&typeof window.FileSystemFileHandle?.prototype?.remove==='function')){
   moveMore.onclick=()=>addMore('move');head.append(moveMore);
  }else{moveMore.hidden=true;moveMore.disabled=true;}`, 'group picker controls');
 ui+='\n/* R1571 Windows 7 manual photo picker */\n';
 save(uiFile,ui);
}
execFileSync(process.execPath,['--check',uiFile],{stdio:'inherit'});
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 if(root.endsWith('lab-desktop-ui')){
  fs.copyFileSync(file,root+'/photobridge-r1466-intake-move.js');
  fs.copyFileSync(uiFile,root+'/photobridge-r1137-lab-local-intake.js');
 }
 let html=load(root+'/index.html');
 for(const src of ['photobridge-r1466-intake-move.js','photobridge-r1137-lab-local-intake.js']){
  const escaped=src.replace(/\./g,'\\.');
  html=html.replace(new RegExp('('+escaped+'\\?[^"\\s]*)','g'),url=>url.includes('&win7Picker=r1571')?url:url+'&win7Picker=r1571');
 }
 save(root+'/index.html',html);
}
const manifestPath='dist/web/lab-desktop-ui/manifest.json',manifest=JSON.parse(load(manifestPath));
for(const name of ['index.html','photobridge-r1466-intake-move.js','photobridge-r1137-lab-local-intake.js']){
 const row=manifest.files.find(x=>x.name===name);
 if(!row)throw Error('R1571 native manifest missing '+name);
 row.sha256=crypto.createHash('sha256').update(fs.readFileSync('dist/web/lab-desktop-ui/'+name)).digest('hex');
}
manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
manifest.generatedAt=new Date().toISOString();save(manifestPath,JSON.stringify(manifest));
console.log('R1571 Win7 manual-order image selection and copy compatibility installed');
