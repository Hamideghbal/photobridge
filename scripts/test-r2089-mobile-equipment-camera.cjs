const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const helper=fs.readFileSync('scripts/r2089-mobile-equipment-camera.js.txt','utf8');
const settle=async()=>{for(let i=0;i<15;i++)await Promise.resolve()};
function fixture(){
 let stopped=0,now=1000,raw='PB|CAM-1|S1',frames=[],timers=[],codes=[],formats=[];
 const track={stop:()=>stopped++,getCapabilities:()=>({focusMode:['continuous']}),applyConstraints:async()=>{}};
 const stream={getTracks:()=>[track],getVideoTracks:()=>[track]};
 const video={srcObject:null,readyState:2,videoWidth:1280,videoHeight:720,play:async()=>{},requestVideoFrameCallback:fn=>(frames.push(fn),1),cancelVideoFrameCallback:()=>{frames=[]}};
 const state={textContent:''},window={jsQR:()=>null,BarcodeDetector:class{static async getSupportedFormats(){return ['qr_code','code_128']}constructor(o){formats=o.formats}async detect(){return raw?[{rawValue:raw}]:[]}}};
 const ctx={window,navigator:{mediaDevices:{getUserMedia:async()=>stream}},document:{hidden:false},matchMedia:()=>({matches:true}),Date:{now:()=>now},
 setTimeout:fn=>(timers.push(fn),timers.length),clearTimeout:()=>{timers=[]}};
 vm.runInNewContext(helper,ctx);
 const scanner=window.pb2089Camera.mount({wrap:{clientWidth:340,clientHeight:140},state,video,canvas:{getContext:()=>({})},onCode:async code=>codes.push(code)});
 const tick=async()=>{timers.shift()?.();frames.shift()?.();await settle();now+=100};
 return {window,scanner,tick,codes,video,formats:()=>formats,stopped:()=>stopped,setRaw:v=>raw=v,advance:ms=>now+=ms};
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
 assert.ok(p.includes('id="pb2089MobileScanRuntime"'));assert.ok(p.includes('height:clamp(92px,17dvh,128px)'));
 assert.ok(p.includes('await mobileCamera.start()'));assert.ok(p.includes('cameraPending'));assert.ok(p.includes('mobileCamera?.stop()'));
 assert.ok(p.includes('mobileCamera=r2089'));assert.ok(r.includes('camera:mobileScan'));assert.ok(r.includes('returnMatch(slots,raw)'));
 assert.ok(r.includes('camera?.stop()'));assert.ok(r.includes('window.confirm(prompt)'));assert.ok(r.includes('missingConfirmed'));
 const root='dist/web/desktop-ui/',manifest=JSON.parse(fs.readFileSync(root+'manifest.json','utf8'));
 for(const name of ['equipment-rental-portal.html','photobridge-r100f73-staff-desktop-return.js']){
  const bytes=fs.readFileSync(root+name);assert.ok(!bytes.toString().includes('PB2089'));
  assert.equal(manifest.files.find(x=>x.name===name).sha256,crypto.createHash('sha256').update(bytes).digest('hex'));
 }
});
