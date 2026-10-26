const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function harness({denied=false,blockedRead=false,unsupported=false}={}){
 let granted=false;const events=[],file=new File(['photo'],'Photo.jpg',{lastModified:1}),source={kind:'file',name:file.name,async queryPermission(){events.push('query');return denied?'denied':granted?'granted':'prompt';},async requestPermission(){events.push('permission');granted=!denied;return denied?'denied':'granted';},async getFile(){events.push('read');if(blockedRead)throw Object.assign(Error('raw getFile denied'),{name:'NotAllowedError'});return file;},async isSameEntry(h){return h===this;},async remove(options){events.push('remove');assert.equal(options.recursive,false);}};
 if(unsupported)delete source.remove;
 const window={pbLabLocalIntakeStorage:{fileName:x=>x},async showOpenFilePicker(options){events.push('picker');assert.equal(options.mode,'readwrite');return[source];},showDirectoryPicker(){throw Error('folder prompt prohibited');}};
 const document={body:{append(){}},createElement(){return {remove(){},click(){this.files=[file];queueMicrotask(()=>this.onchange());}};}};
 vm.runInNewContext(fs.readFileSync('scripts/r1466-intake-move.js','utf8'),{window,document,crypto:crypto.webcrypto,Uint8Array,WeakMap,Map,Error,queueMicrotask});
 return{events,source,file,move:window.pb1466IntakeMove};
}
test('copy selection bypasses blocked FileSystemFileHandle access completely',async()=>{
 const s=harness({blockedRead:true});const files=await s.move.pick('copy');assert.equal(files[0],s.file);assert.deepEqual(s.events,[]);
});
test('transfer requests file permission before getFile, never asks for a folder and deletes only after verification',async()=>{
 const s=harness(),files=await s.move.pick('move');assert.deepEqual(s.events,['picker','query','permission','read']);const target={item:{file:files[0]},file:{original_name:'Photo.jpg'},target:{dir:{async getFileHandle(){return{getFile:async()=>s.file,isSameEntry:async()=>false};}}}};await s.move.prepare([target]);await s.move.verify([target]);assert(!s.events.includes('remove'));const r=await s.move.finish([target]);assert.equal(r.removed,1);assert.equal(s.events.filter(e=>e==='remove').length,1);
});
test('denied or unavailable file deletion never silently becomes a move or deletes an original',async()=>{
 for(const options of [{denied:true},{unsupported:true},{blockedRead:true}]){const s=harness(options);await assert.rejects(s.move.pick('move'),/کپی عکس/);assert(!s.events.includes('remove'));}
});
test('the manual form exposes copy/move directly and removes the intermediate source-directory dialog',()=>{
 const intake=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8'),helper=fs.readFileSync('scripts/r1466-intake-move.js','utf8');assert(intake.includes("choose.setAttribute('aria-label','کپی عکس')"));assert(intake.includes("movePhotos.setAttribute('aria-label','انتقال عکس')"));assert(intake.includes("choose.onclick=()=>selectPhotos('copy');movePhotos.onclick=()=>selectPhotos('move')"));assert(!helper.includes('showDirectoryPicker('));assert(!helper.includes('روش ذخیرهٔ عکس‌های انتخاب‌شده'));assert(helper.includes('await group.source.handle.remove({recursive:false})'));
});
