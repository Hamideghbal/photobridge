const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('legacy motion build stages accept the current no-animation lab header',()=>{
 const header='dist/web/photobridge-r1147-lab-admin-header.js',intake='dist/web/photobridge-r1137-lab-local-intake.js',index='dist/web/index.html';
 const names=['photobridge-r1126-desktop-navigation','photobridge-r1163-desktop-gallery-header','photobridge-r1147-lab-admin-header','photobridge-r1137-lab-local-intake'];
 const html=names.map(n=>'<script src="/'+n+'.js?v=r1175"></script>').join('');
 const files=new Map([[header,fs.readFileSync(header,'utf8')],[intake,fs.readFileSync(intake,'utf8')],[index,html],['dist/api/equipment-rental-book.html',html],['dist/web/photobridge-r1126-desktop-navigation.js',"el.animate([{opacity:.85},{opacity:1}],{duration:420,easing:'cubic-bezier(.25,.65,.35,1)'})"],['dist/web/photobridge-r1163-desktop-gallery-header.js',"content?.animate?.([{opacity:.85},{opacity:1}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'})"]]);
 const mockFs={readFileSync:p=>{assert(files.has(p),p);return files.get(p)},writeFileSync:(p,s)=>files.set(p,s)};
 for(const file of ['scripts/enable-r1187-photo-tab-jitter.mjs','scripts/enable-r1188-lab-browser-tabs.mjs','scripts/enable-r1298-lab-header-navigation.mjs']){
  const code=fs.readFileSync(file,'utf8').replace(/^import .*;\n/gm,'');
  vm.runInNewContext(code,{fs:mockFs,execFileSync(){},process:{execPath:process.execPath}});
 }
 assert(files.get(header).includes('button.onclick=()=>navigate(path);'));
 assert(files.get(header).includes('PB1188 no animation on the full laboratory scroll viewport'));
 assert(!files.get(header).includes("document.querySelector('.labRolePageScrollArea')?.animate"));
 assert(files.get(index).includes('navigation=r1298'));
});
