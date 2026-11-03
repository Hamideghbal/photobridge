'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
test('Windows 7 copy uses conventional file input and never invokes move or deletion',()=>{
 const s=fs.readFileSync('dist/web/photobridge-r1466-intake-move.js','utf8');
 assert(s.includes('R1571 browser photo copy compatibility'));
 assert(s.includes("input.type='file'"));
 assert(s.includes("input.addEventListener('change'"));
 assert(s.includes("input.setAttribute('aria-label','انتخاب عکس برای کپی')"));
 assert(s.includes("mode==='copy'"));
 assert(s.includes("copyOnly:true"));
 assert(s.includes("if(!nativePicker&&typeof window.showOpenFilePicker!=='function')throw Error(unavailable)"));
});
test('manual intake distinguishes unsupported move from supported copy',()=>{
 const s=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
 assert(s.includes('R1571 Windows 7 manual photo picker'));
 assert(s.includes("choose.onclick=()=>selectPhotos('copy')"));
 assert(s.includes('movePhotos.hidden=true'));
 assert(s.includes('moveMore.hidden=true'));
 assert(s.includes("typeof window.FileSystemFileHandle?.prototype?.remove==='function'"));
 assert(s.includes("const files=await window.pb1466IntakeMove.pick(mode)"));
});
test('web and native packages have same patched picker and correct hash manifests',()=>{
 const m=JSON.parse(fs.readFileSync('dist/web/lab-desktop-ui/manifest.json','utf8'));
 for(const name of ['index.html','photobridge-r1466-intake-move.js','photobridge-r1137-lab-local-intake.js']){
  const a=fs.readFileSync('dist/web/'+name),b=fs.readFileSync('dist/web/lab-desktop-ui/'+name);
  if(name!=='index.html')assert.equal(a.toString(),b.toString());
  const row=m.files.find(x=>x.name===name);
  assert(row,'native manifest needs '+name);
  assert.equal(row.sha256,crypto.createHash('sha256').update(b).digest('hex'));
 }
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert(html.includes('win7Picker=r1571'));
});
