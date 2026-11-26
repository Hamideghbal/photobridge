'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib');
const root='dist/web/',bundle=root+'assets/index-UIRefine-v655-r84.js';
const read=p=>fs.readFileSync(p,'utf8');
test('R2044 delivered React photo component owns all three direct actions and cancel',()=>{
 const ui=read(bundle),start=ui.indexOf('function ej('),end=ui.indexOf('function vh(',start);
 assert(start>=0&&end>start);const part=ui.slice(start,end);
 assert.equal(part.split('className:"pb2044NativePhotoActions"').length,2);
 assert.doesNotThrow(()=>new vm.Script(part));
 for(const [name,handler] of [['pb2044NativeChoose','onClick:()=>M(!0)'],['pb2044NativeProduct','onClick:()=>pb1793SetStandalone(true)'],['pb2044NativeSend','onClick:qe'],['pb2044NativeCancel','onClick:ce']]){
   const pos=part.indexOf('className:"'+name+'"');assert(pos>=0,name);assert(part.slice(pos,pos+180).includes(handler),name+' direct handler');
 }
 assert(part.includes('!pb2044Phone&&e.jsx("div",{className:"simplePrintPilotMobileInlineActions"'));
 assert(part.includes('!pb2044Phone&&!De&&dt'));
 assert(part.includes('document.body):De&&ra.createPortal(dt,De)'));
 assert(part.includes('window===window.top'));
 assert(part.includes('!/Windows/i.test'));
 const patch=new Function(read('scripts/r2044-native-photo-patch.js.txt')+'\nreturn pb2044PatchNativePhoto')();
 assert.equal(patch(ui),ui,'idempotent');
});
test('R2044 final served HTML and precompressed assets deliver the native toolbar',()=>{
 const html=read(root+'index.html');
 assert.match(html,/index-UIRefine-v655-r84\.js\?[^"']*nativePhoto=r2044/);
 assert.match(html,/photobridge-v904r100f41-header-date-name-fit\.js\?[^"']*nativePhoto=r2044/);
 const cssUrl=html.match(/href="([^"]*photobridge-boot-[^"]+\.css)(?:\?[^"]*)?"/);
 const css=cssUrl?root+cssUrl[1].replace(/^\//,''):root+'photobridge-r2036-mobile-photo-composer.css';
 const style=read(css);
 assert(style.includes('pb2044NativePhotoActions[data-pb-photo-revision="R2044"]'));
 assert(style.includes('main.photographerMain:has(.simplePrintPilot)>.photographerRolePageScrollArea'));
 assert(style.includes('.globalModalLayer,.uploadChoiceOverlay'));
 for(const file of [bundle,css,root+'index.html',root+'photobridge-v904r100f41-header-date-name-fit.js']){
   const original=fs.readFileSync(file);
   for(const [suffix,decode] of [['.br',zlib.brotliDecompressSync],['.gz',zlib.gunzipSync]])
     if(fs.existsSync(file+suffix))assert(decode(fs.readFileSync(file+suffix)).equals(original),'stale compressed '+file+suffix);
 }
});
