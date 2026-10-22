'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sharp=require('sharp');
const read=f=>fs.readFileSync(f,'utf8');
const brand=[38,116,255];

test('installed mobile PWA uses brand-blue background and plain PhotoBridge name, not dark artwork',()=>{
 const m=JSON.parse(read('dist/web/photobridge.webmanifest'));
 assert.equal(m.id,'/photobridge-pwa');assert.equal(m.display,'standalone');
 assert.equal(m.name,'PhotoBridge');assert.equal(m.short_name,'PhotoBridge');
 assert.equal(m.background_color,'#2674ff');assert.equal(m.theme_color,'#2674ff');
 assert.equal(m.icons.length,2);
 for(const size of [192,512]){
  const icon=m.icons.find(icon=>icon.sizes===`${size}x${size}`);
  assert.deepEqual(icon,{src:`/photobridge-native-${size}-r1359.png`,sizes:`${size}x${size}`,type:'image/png',purpose:'any maskable'});
 }
 assert.equal(m._legacy_splash_icon,'/photobridge-native-512-r1359.png');
 assert(m.related_applications.every(app=>!app.url||app.url.includes('photobridge.webmanifest?v=r1359')));
});

test('generated icons have large white mark and uninterrupted blue maskable background',async()=>{
 const svg=read('dist/web/photobridge-icon-blue-r1359.svg');
 assert(svg.includes('M108 299 Q256 103 404 299'));
 assert(!svg.includes('<text'),'do not bake an additional low-quality text label into the icon');
 for(const [size,name] of [[192,'photobridge-native-192-r1359.png'],[512,'photobridge-native-512-r1359.png'],[180,'photobridge-native-touch-r1359.png']]){
  const {data,info}=await sharp('dist/web/'+name).removeAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,size);assert.equal(info.height,size);
  const at=(x,y)=>{const p=(y*size+x)*info.channels;return Array.from(data.subarray(p,p+3))};
  assert.deepEqual(at(0,0),brand);assert.deepEqual(at(size-1,size-1),brand);
  assert.deepEqual(at(Math.round(size*.5),Math.round(size*.32)),[255,255,255],`top mark at ${size}px`);
  assert.deepEqual(at(Math.round(size*.5),Math.round(size*.59)),[255,255,255],`bridge bar at ${size}px`);
 }
});

test('mobile launch has one OS-owned splash; theme matches icon; other app UI untouched',()=>{
 const html=read('dist/web/index.html');
 assert(!html.includes('<div id="pbAppSplashV780"'));
 const style=html.match(/<style id="pbR1284LaunchStyle">[\s\S]*?<\/style>/)?.[0];
 assert(style&&style.includes('#2674ff')&&!style.includes('#040e1a'));
 assert(style.includes('#fff'));
 assert(html.includes('photobridge.webmanifest?v=r1359'));
 assert(html.includes('href="/photobridge-native-touch-r1359.png"'));
 assert.equal((html.match(/id="pbR1284LaunchStyle"/g)||[]).length,1);
 assert(!html.includes('id="pbAppSplashV780"'));
 const portal=read('dist/api/equipment-rental-book.html');
 assert(portal.includes('photobridge.webmanifest?v=r1359'));
});
