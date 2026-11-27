const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const helper=fs.readFileSync('scripts/r2089-mobile-equipment-camera.js.txt','utf8');
const settle=async()=>{for(let i=0;i<15;i++)await Promise.resolve()};
function fixture({native=true,fallbackAt=0,slowSubmit=false}={}){
 let stopped=0,now=1000,raw='PB|CAM-1|S1',frames=[],timers=[],codes=[],formats=[],draws=[],samples=[],constraints=[],settings=null,delays=[];
 const track={stop:()=>stopped++,getCapabilities:()=>({focusMode:['continuous'],exposureMode:['continuous']}),applyConstraints:async c=>{constraints.push(c)}};
 const stream={getTracks:()=>[track],getVideoTracks:()=>[track]};
 const video={srcObject:null,readyState:2,videoWidth:1280,videoHeight:720,play:async()=>{},requestVideoFrameCallback:fn=>(frames.push(fn),1),cancelVideoFrameCallback:()=>{frames=[]}};
 const state={textContent:''},window={jsQR:(_data,w,h,opts)=>{samples.push({w,h,invert:opts.inversionAttempts});return fallbackAt&&samples.length>=fallbackAt?{data:'PB|FALLBACK|S2'}:null},BarcodeDetector:class{static async getSupportedFormats(){return ['qr_code','code_128']}constructor(o){formats=o.formats}async detect(){return raw?[{rawValue:raw}]:[]}}};if(!native)delete window.BarcodeDetector;
 const ctx={window,navigator:{mediaDevices:{getUserMedia:async c=>{settings=c;return stream}}},document:{hidden:false},matchMedia:()=>({matches:true}),Date:{now:()=>now},
 setTimeout:(fn,ms)=>(delays.push(ms),timers.push(fn),timers.length),clearTimeout:()=>{timers=[]}};
 vm.runInNewContext(helper,ctx);
 const scanner=window.pb2089Camera.mount({wrap:{clientWidth:220,clientHeight:220},state,video,canvas:{getContext:()=>({drawImage:(...a)=>draws.push(a.slice(1)),getImageData:()=>({data:[]})})},onCode:async code=>{codes.push(code);if(slowSubmit)now+=1500}});
 const tick=async()=>{timers.shift()?.();frames.shift()?.();await settle();now+=100};
 return {window,scanner,tick,codes,video,formats:()=>formats,stopped:()=>stopped,setRaw:v=>raw=v,advance:ms=>now+=ms,draws,samples,constraints,settings:()=>settings,delays};
}
test('R2089: native QR/linear detection, one scan per held label, successive distinct units, cleanup',async()=>{
 const f=fixture();await f.scanner.start();assert.deepEqual(Array.from(f.formats()),['qr_code','code_128']);
 await f.tick();await f.tick();assert.deepEqual(f.codes,['PB|CAM-1|S1']);
 f.setRaw('PB|CAM-2|S2');await f.tick();assert.equal(f.codes.length,2);
 f.scanner.stop();assert.equal(f.stopped(),1);assert.equal(f.video.srcObject,null);
 await f.tick();assert.equal(f.codes.length,2);
});
test('R2089: visible crop preserves sensor geometry and mobile scope excludes desktop app',()=>{
 const f=fixture(),c=f.window.pb2089Camera.crop(1280,720,2);
 assert.equal(c.w,1280);assert.equal(c.h,640);assert.equal(c.y,40);
 assert.equal(f.window.pb2089Camera.mobile(),true);f.window.__PB_DESKTOP_APP__=true;assert.equal(f.window.pb2089Camera.mobile(),false);
});
test('R2089: both handover paths use mobile camera, compact preview and explicit checklist, Windows unchanged',()=>{
 const p=fs.readFileSync('dist/api/equipment-rental-portal.html','utf8'),r=fs.readFileSync('dist/web/photobridge-r100f73-staff-desktop-return.js','utf8');
 assert.ok(p.includes('id="pb2089MobileScanRuntime"'));assert.ok(p.includes('aspect-ratio:1/1!important'));assert.ok(p.includes('grid-template-columns:minmax(0,1fr) 80px'));assert.ok(p.includes('margin:8px 0 4px!important'));assert.ok(p.includes('!mobileScan&&s.requiresExternal?'));
 assert.ok(p.includes('await mobileCamera.start()'));assert.ok(p.includes('cameraPending'));assert.ok(p.includes('mobileCamera?.stop()'));
 assert.ok(p.includes('mobileCamera=r2094'));assert.ok(p.includes('pb2092ManualCode'));assert.ok(p.includes('.pbR86OrderAsset:not(.pbR91Supplied) .pbR86InlineCode'));assert.ok(p.includes('progress.textContent=mobileScan'));assert.ok(r.includes('summary.textContent=mobileScan'));assert.ok(r.includes('camera:mobileScan'));assert.ok(r.includes('returnMatch(slots,raw)'));
 assert.ok(r.includes('camera?.stop()'));assert.ok(r.includes('window.confirm(prompt)'));assert.ok(r.includes('missingConfirmed'));
 const root='dist/web/desktop-ui/',manifest=JSON.parse(fs.readFileSync(root+'manifest.json','utf8'));
 for(const name of ['equipment-rental-portal.html','photobridge-r100f73-staff-desktop-return.js']){
  const bytes=fs.readFileSync(root+name);assert.ok(!bytes.toString().includes('PB2089'));
  assert.equal(manifest.files.find(x=>x.name===name).sha256,crypto.createHash('sha256').update(bytes).digest('hex'));
 }
});

test('R2092: phone scanner ignores desktop mode preference and submits one manual input without changing camera mode',async()=>{
 const source=fs.readFileSync('scripts/r2082-equipment-reader.js.txt','utf8'),events={},calls=[],pending=[];
 const input={value:'PB-100'},submit={disabled:false},feedback={textContent:'',dataset:{}};
 const panel={className:'',innerHTML:'',setAttribute(){},querySelector:s=>s==='[data-scan]'?input:s==='button'?submit:feedback,addEventListener:(k,fn)=>events[k]=fn,remove(){}};
 const ctx={window:{pb2089Camera:{mobile:()=>true}},document:{createElement:tag=>{assert.equal(tag,'form');return panel}},localStorage:{getItem(){throw Error('mobile must not read desktop preference')}},navigator:{}};
 vm.runInNewContext(source,ctx);
 let attached=false;
 const reader=ctx.window.pb2082QrReader.mount({before:{after:p=>{assert.equal(p,panel);attached=true}},kind:'pickup',camera:true,onCode:async raw=>{calls.push(raw);return raw==='PB-100'||'کد اشتباه است';},onPending:n=>pending.push(n)});
 assert.equal(reader.mode(),'camera');assert.equal(attached,true);
 assert(!panel.innerHTML.includes('data-mode'));assert(!panel.innerHTML.includes('data-test'));
 events.submit({preventDefault(){}});await settle();assert.deepEqual(calls,['PB-100']);assert.equal(input.value,'');assert.deepEqual(pending,[1,0]);
 input.value='WRONG';events.submit({preventDefault(){}});await settle();assert.equal(input.value,'WRONG');assert.equal(feedback.textContent,'کد اشتباه است');
 reader.close();events.submit({preventDefault(){}});await settle();assert.equal(calls.length,2);
});

test('R2093: mobile pickup replaces source selector with one explicit external supply check while retaining inventory validation',()=>{
 const p=fs.readFileSync('dist/api/equipment-rental-portal.html','utf8');
 assert.ok(p.includes("!mobileScan&&mode==='pickup'&&Array.isArray(s.supplyOptions)"));
 assert.ok(p.includes('data-mobile-supply'));
 assert.ok(p.includes('sourceFor(s)?'));
 assert.ok(p.includes('!chooseSource(i,true)'));
 assert.ok(p.includes('slot.mobileSelectedSupply=true;slot.scanned=true;slot.autoSupplied=true'));
 assert.ok(p.includes('!slot.requiresExternal&&!slot.lockedSupplied'));
 assert.ok(p.includes('data-supplied-toggle'));
 const desktop=fs.readFileSync('dist/web/desktop-ui/equipment-rental-portal.html','utf8');
 assert.ok(!desktop.includes('data-mobile-supply'));
});

test('R2094: square QR fallback starts on first frame, alternates scale and contrast, applies supported focus',async()=>{
 const f=fixture({native:false,fallbackAt:3});await f.scanner.start();
 assert.equal(f.settings().video.width.ideal,1920);assert.equal(f.settings().video.frameRate.ideal,30);
 assert.deepEqual(JSON.parse(JSON.stringify(f.constraints[0].advanced)),[{focusMode:'continuous'},{exposureMode:'continuous'}]);
 await f.tick();await f.tick();await f.tick();
 assert.deepEqual(f.samples.map(x=>[x.w,x.h,x.invert]),[[560,560,'dontInvert'],[720,720,'dontInvert'],[560,560,'attemptBoth']]);
 assert.deepEqual(f.draws[0].slice(0,4),[280,0,720,720]);
 assert.deepEqual(f.codes,['PB|FALLBACK|S2']);assert.ok(f.delays.every(n=>n===85));
 f.scanner.stop();
});
test('R2094: native miss immediately uses fallback, held QR stays deduplicated after slow validation',async()=>{
 const f=fixture({fallbackAt:1});f.setRaw('');await f.scanner.start();await f.tick();assert.deepEqual(f.codes,['PB|FALLBACK|S2']);assert.equal(f.delays[0],45);f.scanner.stop();
 const g=fixture({slowSubmit:true});await g.scanner.start();await g.tick();await g.tick();assert.equal(g.codes.length,1);g.scanner.stop();
});
