'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {patchCrop}=require('./r1599-crop-patch.cjs');
const source=fs.readFileSync('scripts/r1599-crop-send-confirm.js','utf8');
const installer=fs.readFileSync('scripts/enable-r1599-mobile-crop-nav.mjs','utf8');
test('R1599: print and album crop warnings have two explicit choices and are before order/upload',()=>{
 const legacy=[
  'const xe=async()=>{const Jt=[];if(Jt.length&&!we&&!window.confirm("album warning"))return;const gt=++dt.current;}',
  'const he=async()=>{const pbMismatch=T.reduce((n,g)=>n,0);if(pbMismatch&&!window.__photobridgePrintDelegateToLabV666&&!window.confirm("print warning"))return;const ue=new AbortController;}'
 ].join('\n');
 const done=patchCrop(legacy);
 assert.match(done,/if\(Jt\.length&&!we&&!await pb1599ConfirmCropSend\(/);
 assert.match(done,/if\(pbMismatch&&!window\.__photobridgePrintDelegateToLabV666&&!await pb1599ConfirmCropSend\(/);
 assert.ok(done.indexOf('pb1599ConfirmCropSend("album warning")')<done.indexOf('const gt='));
 assert.ok(done.indexOf('pb1599ConfirmCropSend("print warning")')<done.indexOf('const ue='));
 assert.equal(patchCrop(done),done);
 assert.doesNotThrow(()=>new Function('async function fake(){'+
  'let Jt=[],we=false,pbMismatch=0,window={__photobridgePrintDelegateToLabV666:false};'+
  'const pb1599ConfirmCropSend=async()=>false;'+done+'}'));
});
test('R1600: release handles duplicate or rewritten warning without failing Docker',()=>{
 const twice=[
   'const xe=async()=>{const Jt=[1];if(Jt.length&&!we&&!window.confirm("album warning"))return;const gt=++dt.current;}',
   'const he=async()=>{const pbMismatch=T.reduce((n,g)=>n,0);',
   'if(pbMismatch&&!window.__photobridgePrintDelegateToLabV666&&!window.confirm("first"))return;',
   'if(pbMismatch&&!window.__photobridgePrintDelegateToLabV666&&!window.confirm("second"))return;',
   'const ue=new AbortController;}'
 ].join('\n');
 const multiple=patchCrop(twice);
 assert.equal((multiple.match(/await pb1599ConfirmCropSend\(/g)||[]).length,3);
 assert.doesNotThrow(()=>new Function(multiple));
 const changed=[
   'const xe=async()=>{const Jt=[1];if(Jt.length&&!we&&!window.confirm("album warning"))return;const gt=++dt.current;}',
   'const he=async()=>{const pbMismatch=T.reduce((n,g)=>n,0);',
   'if(pbMismatch&&someGate&&!window.confirm("print warning"))return;',
   'const ue=new AbortController;}'
 ].join('\n');
 const alternative=patchCrop(changed);
 assert.equal((alternative.match(/await pb1599ConfirmCropSend\(/g)||[]).length,2);
 assert.doesNotThrow(()=>new Function(alternative));
 const absent=[
   'const xe=async()=>{const Jt=[1];const gt=++dt.current;}',
   'const he=async()=>{const pbMismatch=T.reduce((n,g)=>n,0);const ue=new AbortController;}'
 ].join('\n');
 const fallback=patchCrop(absent);
 assert.equal((fallback.match(/await pb1599ConfirmCropSend\(/g)||[]).length,2);
 assert.ok(fallback.indexOf('if(pbMismatch&&!window.__photobridgePrintDelegateToLabV666&&!await')<
    fallback.indexOf('const ue=new AbortController'));
 assert.doesNotThrow(()=>new Function(fallback));
});
test('R1599: cancellation rejects and sending needs an explicit button',async()=>{
 const buttons={};
 const mk=selector=>({
   textContent:'',focus(){},addEventListener:(name,fn)=>{buttons[selector+':'+name]=fn}
 });
 const dialog={
   open:false,style:{},dir:'',innerHTML:'',
   setAttribute(){},querySelector:sel=>mk(sel),
   addEventListener:(name,fn)=>buttons['dialog:'+name]=fn,
   showModal(){this.open=true},close(){this.open=false},remove(){}
 };
 const document={createElement:tag=>dialog,body:{appendChild(){}}};
 const fn=new Function('document',source+'\nreturn pb1599ConfirmCropSend;')(document);
 const reject=fn('کراپ');buttons['.pb1599CropCancel:click']();
 assert.equal(await reject,false);
 const approve=fn('کراپ');buttons['.pb1599CropProceed:click']();
 assert.equal(await approve,true);
 const escape=fn('کراپ');buttons['dialog:cancel']({preventDefault(){}});assert.equal(await escape,false);
});
test('R1599: phone dock belongs to active role including customer finance',()=>{
 const js=fs.readFileSync('scripts/r1598-photographer-mobile-invoice-dock.js','utf8');
 const css=fs.readFileSync('scripts/r1598-photographer-mobile-invoice-dock.css','utf8');
 const lab=fs.readFileSync('scripts/r1482-lab-mobile.js','utf8');
 assert.match(js,/const role=\(\)=>/);
 assert.match(js,/pb1599PhotographerRoute/);
 assert.match(js,/data-pb1598-duplicate/);
 assert.match(css,/pb1599PhotographerRoute body nav\.labMobileUtilityRail/);
 assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
 assert.match(lab,/phone\.matches&&root&&/);
});
test('R1599: website-only bundle; preserve safe Windows and disabled flight',()=>{
 const pipeline=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert.match(pipeline,/enable-r1599-mobile-crop-nav\.mjs/);
 assert.doesNotMatch(pipeline,/await deployStep\('\.\/enable-r1593-lab-card-flight\.mjs'\)/);
 assert.match(installer,/const root='dist\/web\/'/);
 assert.doesNotMatch(installer,/lab-desktop-ui/);
 assert.match(installer,/index-UIRefine-v655-r84\.js/);
 if(process.env.PB1599_VERIFY_BUNDLE==='1'){
   const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
   assert.match(ui,/R1599 explicit crop cancellation/);
   assert.ok((ui.match(/!await pb1599ConfirmCropSend\(/g)||[]).length>=2);
   assert.doesNotThrow(()=>new Function(ui));
   const html=fs.readFileSync('dist/web/index.html','utf8');
   assert.match(html,/id="pb1599RoutePrepaint"/);
 }
});
