'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sharp=require('sharp');

test('mobile-only launch preserves native splash and uses a readable white PhotoBridge label below authentic mark',()=>{
 const html=fs.readFileSync('dist/web/index.html','utf8');
 const generator=fs.readFileSync('scripts/enable-r1361-mobile-startup-caption.mjs','utf8');
 assert(generator.includes('photobridge-brand-script-r1285.png'),'icon MUST come from the authentic bridge/aperture brand');
 assert(!generator.includes('photobridge-icon-blue-r1359.svg'),'reject invented replacement logo');
 assert(!html.includes('<div id="pbAppSplashV780"'),'legacy splash is still removed');
 if(html.includes('pb1479Identity')){
  assert(html.includes('photobridge-launch-mark-r1479.png')&&html.includes('pb1479Name')&&html.includes('pb1479Tagline'),'newer mobile launch handoff retains the brand mark, name and Persian tagline');
  assert(!html.includes('<div id="pbAppSplashV780"'));
 }else{
  assert.match(html,/<div id="pbR1361MobileSplash" role="status"[^>]+><img src="\/photobridge-mobile-launch-symbol-r1361\.png"[^>]*><span>PhotoBridge<\/span><\/div>/);
  assert.match(html,/<style id="pbR1361MobileSplashStyle">[\s\S]+<\/style>/);
  assert.equal((html.match(/id="pbR1361MobileSplash"/g)||[]).length,1);
  assert(html.includes('html:has(#root:empty) #pbR1361MobileSplash{display:flex}'));
  assert(html.includes('html.pbR1361IosStandalone:has(#root:empty)'));
  assert(html.includes('html.pbR1361Embedded #pbR1361MobileSplash{display:none!important}'));
  assert(html.includes('font-stretch:normal'));
  assert(html.includes('font-family:Arial,Helvetica,system-ui,sans-serif'));
  assert(html.includes('font-size:clamp(25px,7vw,34px)'));
  assert(html.includes('width:min(84vw,360px)'));
 }
 assert(!generator.includes('setTimeout('),'do not delay launch artificially');
});

test('generated white startup logo is transparent outside its original bridge and aperture silhouette',async()=>{
 const path='dist/web/photobridge-mobile-launch-symbol-r1361.png';
 const png=await sharp(path).metadata();
 assert.deepEqual([png.width,png.hasAlpha],[920,true]);
 assert(png.height>300&&png.height<650);
 const {data,info}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let opaque=0,clear=0;
 for(let i=0;i<data.length;i+=4){
   const a=data[i+3];
   if(a===0)clear++;
   if(a>=250){
     assert.deepEqual([...data.subarray(i,i+3)],[255,255,255]);
     opaque++;
   }
 }
 assert(opaque>6000&&clear>6000,'brand logo must not be a filled rectangle or an empty graphic');
});

test('existing installed PWA icon and native launch manifest stay unchanged by mobile web handoff',()=>{
 const manifest=JSON.parse(fs.readFileSync('dist/web/photobridge.webmanifest','utf8'));
 assert.equal(manifest.background_color,'#2674ff');
 assert.deepEqual(manifest.icons.map(x=>x.src),['/photobridge-native-192-r1359.png','/photobridge-native-512-r1359.png']);
 assert.equal(manifest.name,'PhotoBridge');
});
