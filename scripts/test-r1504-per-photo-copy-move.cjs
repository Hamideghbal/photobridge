'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),vm=require('node:vm');

function harness(){
 const bytes=Buffer.from('verified photo bytes'),file=new File([bytes],'Photo.jpg',{type:'image/jpeg',lastModified:7}),events=[];let permission='prompt',removed=0;
 const handle={kind:'file',name:file.name,async getFile(){events.push('read');return file;},async queryPermission(){events.push('query');return permission;},async requestPermission(){events.push('permission');permission='granted';return permission;},async isSameEntry(other){return other===this;},async remove(options){assert.equal(options.recursive,false);events.push('remove');removed++;}};
 const window={pbLabLocalIntakeStorage:{fileName:name=>name},async showOpenFilePicker(options){events.push('picker');assert.equal(options.multiple,true);assert.equal(options.mode,'readwrite');return[handle];}};
 vm.runInNewContext(fs.readFileSync('scripts/r1466-intake-move.js','utf8'),{window,crypto:crypto.webcrypto,Uint8Array,WeakMap,Map,Error,File});
 const item={file,sourceAction:'move',copies:1};
 const target={item,file:{original_name:file.name},target:{dir:{async getFileHandle(){return{async getFile(){return file;},async isSameEntry(){return false;}};}}}};
 return{window,item,target,events,get removed(){return removed;},select:()=>window.pb1466IntakeMove.pick('select'),setMode:mode=>window.pb1466IntakeMove.setMode(item,mode),finish:()=>window.pb1466IntakeMove.finish([target])};
}

test('Windows transfer removes the original only after the saved order copy is verified',async()=>{
 const h=harness(),files=await h.select();assert.equal(files.length,1);assert.equal(files[0],h.item.file);assert.deepEqual(h.events,['picker','query','permission','read']);
 await h.setMode('move');const result=await h.finish();assert.equal(result.removed,1,JSON.stringify(result));assert.equal(h.removed,1);assert(h.events.indexOf('remove')>h.events.lastIndexOf('read'));
});

test('right-click copy mode preserves the original source',async()=>{
 const h=harness();await h.select();await h.setMode('copy');const result=await h.finish();assert.equal(result.copied,1,JSON.stringify(result));assert.equal(result.removed,0);assert.equal(h.removed,0);
});

test('manual-order cards default to transfer in Windows and right-click changes only that photo to copy',()=>{
 const script=fs.readFileSync('scripts/enable-r1504-per-photo-copy-move.mjs','utf8'),helper=fs.readFileSync('scripts/r1466-intake-move.js','utf8');
 assert(script.includes("defaultPhotoAction=()=> 'move'"));
 assert(script.includes("photo.addEventListener('contextmenu',event=>{event.preventDefault();void setPhotoAction('copy');})"));
 assert(script.includes('window.pb1466IntakeMove.track(item,item.file,sourceAction)'));
	 assert(script.includes("actionBadge=node('button',item.sourceAction==='copy'?'کپی':'برش'"));
	 assert(script.includes("'pb1504ActionToggle');actionBadge.type='button'"));
	 assert(!script.includes("'pb1501ActionBadge pb1504ActionToggle'"));
 assert(script.includes("actionBadge.onclick=()=>setPhotoAction(item.sourceAction==='copy'?'move':'copy')"));
	 assert(!script.includes("کپی ✓"));
 assert(helper.includes('async function setMode(item,action)'));assert(helper.includes("source.action!=='move'||source.copyOnly"));assert(helper.includes("group.source.action!=='move'"));
 assert(script.includes('.pb1137Intake .pb1139GroupPhotos .pb1504ActionToggle{position:absolute!important'));
});

test('card layout is part of the same verified Windows/site UI snapshot',()=>{
 const pipeline=fs.readFileSync('scripts/liara-fast-build.mjs','utf8'),revision=fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim();
 const r1504=pipeline.indexOf('await deployStep("./enable-r1504-per-photo-copy-move.mjs")');
 const r1502=pipeline.indexOf('await deployStep("./enable-r1502-web-intake-card-layout.mjs")',r1504);
 const snapshot=pipeline.indexOf('await deployStep("./prepare-lab-desktop-ui.mjs?final-after-r1344")',r1502);
 const verify=pipeline.indexOf('await deployStep("./verify-lab-desktop-ui-freshness.mjs")',snapshot);
 assert(r1504>0&&r1502>r1504&&snapshot>r1502&&verify>snapshot);assert(pipeline.indexOf('scripts/test-r1502-web-intake-card-layout.cjs',r1502)<snapshot);
	 assert.equal(revision,'2026-11-01-r1520-live-status-release');
});

test('build patch accepts the exact post-R1501 output, adds copy-on-context-menu, and is idempotent',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-r1504-'));
 try{
  for(const dir of ['dist/web','dist/api','scripts'])fs.mkdirSync(path.join(root,dir),{recursive:true});
  let intake=[
   "const choose=node('button','انتخاب عکس‌ها');choose.type='button';choose.setAttribute('aria-label','انتخاب عکس‌ها');field(settings,'عکس‌ها',choose);choose.textContent='کپی عکس';choose.setAttribute('aria-label','کپی عکس');const movePhotos=node('button','انتقال عکس');movePhotos.type='button';movePhotos.setAttribute('aria-label','انتقال عکس');const fileActions=node('div',null,'pb1468FileActions');choose.replaceWith(fileActions);fileActions.append(choose,movePhotos);const selectPhotos=async mode=>{if(locked||submitting)return;error.textContent='';try{const files=await window.pb1466IntakeMove.pick(mode);if(files?.length){pendingFiles=files;pendingAction=mode;choose.textContent='کپی عکس';movePhotos.textContent='انتقال عکس';error.textContent=files.length.toLocaleString('fa-IR')+' عکس برای '+(mode==='move'?'انتقال':'کپی')+' انتخاب شد؛ «افزودن» را بزنید.';}}catch(e){error.textContent=e.message;}};choose.onclick=()=>selectPhotos('copy');movePhotos.onclick=()=>selectPhotos('move');",
   "const more=node('button','افزودن عکس');more.type='button';more.textContent='کپی عکس';const moveMore=node('button','انتقال عکس');moveMore.type='button';const addMore=async mode=>{if(locked||submitting)return;try{const files=await window.pb1466IntakeMove.pick(mode);if(!files?.length)return;busy(true);await appendFiles(group,files,group.size,group.paper,mode);syncEntries();renderGroups();error.textContent='';}catch(e){error.textContent=e.message;}finally{busy(false);}};more.onclick=()=>addMore('copy');moveMore.onclick=()=>addMore('move');head.append(moveMore);input.onchange=async()=>{if(locked||submitting)return;busy(true);try{await appendFiles(group,input.files,group.size,group.paper,'copy');syncEntries();renderGroups();error.textContent='';}catch(e){error.textContent=e.message;}finally{busy(false);}};head.append(more,input);",
   "async function appendFiles(group,files,size,paper,sourceAction='copy'){",
   "const item=group.items.find(x=>x.hash===hash)||additions.find(x=>x.hash===hash);",
   "if(item){additions.push({existing:item.existing||item,sourceFile:file,sourceAction});}else additions.push({file,hash,size,paper,copies:1,sourceActions:[sourceAction]});}",
   "window.pb1466IntakeMove.track(item.existing,item.sourceFile);item.existing.copies++;item.existing.sourceActions ||= [];",
   "item.id=crypto.randomUUID();item.sourceActions ||= [sourceAction];item.preview=URL.createObjectURL(item.file);previews.push(item.preview);group.items.push(item);",
   "const photo=node('figure');const frame=node('div',null,'pb1181IntakeFrame');const image=node('img');image.src=item.preview;image.alt=item.file.name;frame.append(image);const modes=[...new Set(item.sourceActions||['copy'])];const modeLabel=modes.includes('copy')&&modes.includes('move')?'کپی و انتقال':modes.includes('move')?'انتقال':'کپی';const actionBadge=node('span',modeLabel,'pb1501ActionBadge');actionBadge.dataset.action=modes.length>1?'both':modes[0];photo.append(frame,node('figcaption',item.file.name),actionBadge);"
  ].join('\n');
  // R1501 has already made duplicate identity sensitive to paper and the
  // selected per-photo action before R1504 enters the release pipeline.
  intake=intake
   .replace("const item=group.items.find(x=>x.hash===hash)||additions.find(x=>x.hash===hash);","const item=group.items.find(x=>sameIntakeCopyTarget(x,{hash,paper},albumMode,group.paper))||additions.find(x=>sameIntakeCopyTarget(x.existing||x,{hash,paper},albumMode,group.paper));")
   .replace("item.id=crypto.randomUUID();item.preview=URL.createObjectURL(item.file);previews.push(item.preview);group.items.push(item);","item.id=crypto.randomUUID();item.sourceActions ||= [sourceAction];item.preview=URL.createObjectURL(item.file);previews.push(item.preview);group.items.push(item);");
  fs.writeFileSync(path.join(root,'dist/web/photobridge-r1137-lab-local-intake.js'),intake);
  fs.writeFileSync(path.join(root,'dist/web/photobridge-r1137-lab-local-intake.css'),'/* base */');
  fs.copyFileSync('scripts/r1466-intake-move.js',path.join(root,'scripts/r1466-intake-move.js'));
  fs.copyFileSync('scripts/enable-r1504-per-photo-copy-move.mjs',path.join(root,'scripts/enable-r1504-per-photo-copy-move.mjs'));
  fs.writeFileSync(path.join(root,'dist/web/photobridge-r1466-intake-move.js'),fs.readFileSync('scripts/r1466-intake-move.js','utf8'));
  fs.writeFileSync(path.join(root,'dist/web/index.html'),'<head><script src="/photobridge-r1137-lab-local-intake.js?v=old"></script><link href="/photobridge-r1137-lab-local-intake.css?v=old"><script src="/photobridge-r1466-intake-move.js?v=old"></script></head>');
  fs.writeFileSync(path.join(root,'dist/api/equipment-rental-book.html'),fs.readFileSync(path.join(root,'dist/web/index.html'),'utf8'));
  // Match Liara's actual order: the fixture above contains the post-R1501 JS.
  cp.execFileSync(process.execPath,['scripts/enable-r1504-per-photo-copy-move.mjs'],{cwd:root});
  const html=fs.readFileSync(path.join(root,'dist/web/index.html'),'utf8'),js=fs.readFileSync(path.join(root,'dist/web/photobridge-r1137-lab-local-intake.js'),'utf8'),css=fs.readFileSync(path.join(root,'dist/web/photobridge-r1137-lab-local-intake.css'),'utf8');
	  assert.equal((html.match(/r1504-per-photo-mode/g)||[]).length,3);assert(js.includes("defaultPhotoAction=()=> 'move'"));assert(js.includes("actionBadge=node('button',item.sourceAction==='copy'?'کپی':'برش','pb1504ActionToggle')"));assert(!js.includes("pb1501ActionBadge pb1504ActionToggle"));assert(!js.includes("کپی ✓"));assert(js.includes("actionBadge.onclick=()=>setPhotoAction(item.sourceAction==='copy'?'move':'copy')"));assert(js.includes("event.preventDefault();void setPhotoAction('copy')"));assert.equal((js.match(/PB1504 per-photo copy\/move/g)||[]).length,1);assert(css.includes('PB1504 per-photo copy/move'));
  cp.execFileSync(process.execPath,['scripts/enable-r1504-per-photo-copy-move.mjs'],{cwd:root});assert.equal(fs.readFileSync(path.join(root,'dist/web/photobridge-r1137-lab-local-intake.js'),'utf8').split('PB1504 per-photo copy/move').length-1,1);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
