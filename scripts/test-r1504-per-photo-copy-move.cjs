'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),vm=require('node:vm');

function harness(){
 const bytes=Buffer.from('verified photo bytes'),file=new File([bytes],'Photo.jpg',{type:'image/jpeg',lastModified:7}),events=[];let permission='prompt',removed=0;
 const handle={kind:'file',name:file.name,async getFile(){events.push('read');return file;},async queryPermission(){events.push('query');return permission;},async requestPermission(){events.push('permission');permission='granted';return permission;},async isSameEntry(other){return other===this;},async remove(options){assert.equal(options.recursive,false);events.push('remove');removed++;}};
 const window={pbLabLocalIntakeStorage:{fileName:name=>name},async showOpenFilePicker(options){events.push('picker');assert.equal(options.multiple,true);assert.equal(options.mode,'read');return[handle];}};
 vm.runInNewContext(fs.readFileSync('scripts/r1466-intake-move.js','utf8'),{window,crypto:crypto.webcrypto,Uint8Array,WeakMap,Map,Error,File});
 const item={file,sourceAction:'copy',copies:1};
 const target={item,file:{original_name:file.name},target:{dir:{async getFileHandle(){return{async getFile(){return file;},async isSameEntry(){return false;}};}}}};
 return{window,item,target,events,get removed(){return removed;},select:()=>window.pb1466IntakeMove.pick('select'),setMode:mode=>window.pb1466IntakeMove.setMode(item,mode),finish:()=>window.pb1466IntakeMove.finish([target])};
}

test('one image selection defaults to copy and can be changed to move on that image; source is removed only after verified finish',async()=>{
 const h=harness(),files=await h.select();assert.equal(files.length,1);assert.equal(files[0],h.item.file);assert.deepEqual(h.events,['picker','read']);
 await h.setMode('move');assert.equal(h.item.sourceAction,'copy');assert(h.events.includes('permission'));assert.equal(h.removed,0);
 const result=await h.finish();assert.equal(result.removed,1,JSON.stringify(result));assert.equal(h.removed,1);assert(h.events.indexOf('remove')>h.events.lastIndexOf('read'));
});

test('copy stays the safe default and never removes the original',async()=>{
 const h=harness();await h.select();const result=await h.finish();assert.equal(result.copied,1,JSON.stringify(result));assert.equal(result.removed,0);assert.equal(h.removed,0);
});

test('the manual form has one file-picker action and puts the copy/move control on each photo',()=>{
 const js=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8'),helper=fs.readFileSync('scripts/r1466-intake-move.js','utf8'),css=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.css','utf8');
 assert(js.includes("pick('select')"));assert(js.includes("node('button',item.sourceAction==='move'?'انتقال':'کپی','pb1501ActionBadge pb1504ActionToggle')"));assert(js.includes('pb1466IntakeMove.setMode(item,next)'));
 assert(!js.includes('movePhotos'));assert(!js.includes('moveMore'));assert(!js.includes("node('button','انتقال عکس')"));
 assert(helper.includes('async function setMode(item,action)'));assert(helper.includes("source.action!=='move'||source.copyOnly"));assert(helper.includes("group.source.action!=='move'"));
 assert(css.includes('.pb1137Intake .pb1139GroupPhotos .pb1504ActionToggle{position:absolute!important'));
});

test('shared site and desktop UI receive the same change before the desktop snapshot, with cache-busted assets',()=>{
 const pipeline=fs.readFileSync('scripts/liara-fast-build.mjs','utf8'),script=fs.readFileSync('scripts/enable-r1504-per-photo-copy-move.mjs','utf8'),revision=fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim();
 const stage=pipeline.indexOf('await deployStep("./enable-r1504-per-photo-copy-move.mjs")'),snapshot=pipeline.indexOf('await deployStep("./prepare-lab-desktop-ui.mjs?final-after-r1344")');
 assert(stage>0&&snapshot>stage);assert(pipeline.indexOf('scripts/test-r1504-per-photo-copy-move.cjs',stage)>stage);assert.equal(revision,'2026-10-30-r1504-build-anchor');
 assert(script.includes("dist/web/photobridge-r1137-lab-local-intake.js"));assert(script.includes("dist/web/photobridge-r1466-intake-move.js"));assert(script.includes("appendFiles(group,input.files,group.size,group.paper,'copy')"),'R1504 must match the post-R1501 browser-file handler');assert(script.includes('r1504-per-photo-mode'));
});

test('build patch is idempotent on the generated shared UI files',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-r1504-'));
 try{
  for(const dir of ['dist/web','dist/api','scripts'])fs.mkdirSync(path.join(root,dir),{recursive:true});
  for(const name of ['photobridge-r1137-lab-local-intake.js','photobridge-r1137-lab-local-intake.css','photobridge-r1466-intake-move.js'])fs.copyFileSync(path.join('dist/web',name),path.join(root,'dist/web',name));
  fs.copyFileSync('scripts/r1466-intake-move.js',path.join(root,'scripts/r1466-intake-move.js'));
  fs.copyFileSync('scripts/enable-r1504-per-photo-copy-move.mjs',path.join(root,'scripts/enable-r1504-per-photo-copy-move.mjs'));
  fs.writeFileSync(path.join(root,'dist/web/index.html'),'<head><script src="/photobridge-r1137-lab-local-intake.js?v=old"></script><link href="/photobridge-r1137-lab-local-intake.css?v=old"><script src="/photobridge-r1466-intake-move.js?v=old"></script></head>');
  fs.writeFileSync(path.join(root,'dist/api/equipment-rental-book.html'),fs.readFileSync(path.join(root,'dist/web/index.html'),'utf8'));
  cp.execFileSync(process.execPath,['scripts/enable-r1504-per-photo-copy-move.mjs'],{cwd:root});
  const html=fs.readFileSync(path.join(root,'dist/web/index.html'),'utf8');assert.equal((html.match(/r1504-per-photo-mode/g)||[]).length,3);
  const js=fs.readFileSync(path.join(root,'dist/web/photobridge-r1137-lab-local-intake.js'),'utf8');assert.equal((js.match(/PB1504 per-photo copy\/move/g)||[]).length,1);
  const css=fs.readFileSync(path.join(root,'dist/web/photobridge-r1137-lab-local-intake.css'),'utf8');assert.equal((css.match(/PB1504 per-photo copy\/move/g)||[]).length,1);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
