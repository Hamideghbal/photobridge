'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sharp=require('sharp');
const read=f=>fs.readFileSync(f,'utf8');
const brand=[38,116,255];

test('installed mobile PWA uses brand blue and simple system-rendered app title',()=>{
 const m=JSON.parse(read('dist/web/photobridge.webmanifest'));
 assert.equal(m.id,'/photobridge-pwa');assert.equal(m.display,'standalone');
 assert.equal(m.name,'PhotoBridge');assert.equal(m.short_name,'PhotoBridge');
 assert.equal(m.background_color,'#2674ff');assert.equal(m.theme_color,'#2674ff');
 assert.equal(m.icons.length,2);
 for(const size of [192,512]){
  const icon=m.icons.find(icon=>icon.sizes===size+'x'+size);
  assert.deepEqual(icon,{src:`/photobridge-native-${size}-r1359.png`,sizes:`${size}x${size}`,type:'image/png',purpose:'any maskable'});
 }
 assert.equal(m._legacy_splash_icon,'/photobridge-native-512-r1359.png');
 assert(m.related_applications.every(app=>!app.url||app.url.includes('photobridge.webmanifest?v=r1359')));
});

test('all icons reproduce the exact real bridge/aperture artwork in white; never fabricate a new mark',async()=>{
 const generator=read('scripts/enable-r1359-mobile-blue-launch.mjs');
 assert(generator.includes("photobridge-brand-script-r1285.png"),'use authentic app brand artwork');
 assert(!generator.includes('photobridge-icon-blue-r1359.svg'),'do not use the invented SVG');
 const source='dist/web/photobridge-brand-script-r1285.png';
 const original=await sharp(source).metadata();
 assert.deepEqual([original.width,original.height,original.hasAlpha],[1254,1254,true]);
 const crop={left:Math.round(original.width*.078),top:Math.round(original.height*.174),
  width:Math.round(original.width*.844),height:Math.round(original.height*.423)};
 for(const [size,name] of [[192,'photobridge-native-192-r1359.png'],[512,'photobridge-native-512-r1359.png'],[180,'photobridge-native-touch-r1359.png']]){
  const path='dist/web/'+name;
  const width=Math.round(size*.68),height=Math.round(width*crop.height/crop.width);
  const expected=await sharp(source).extract(crop).resize(width,height).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {data,info}=await sharp(path).removeAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual([info.width,info.height],[size,size]);
  const sample=(x,y)=>{const p=(y*size+x)*info.channels;return [...data.subarray(p,p+3)]};
  assert.deepEqual(sample(0,0),brand);assert.deepEqual(sample(size-1,size-1),brand);
  const left=Math.floor((size-width)/2),top=Math.floor((size-height)/2);
  let checkedOpaque=0,checkedClear=0;
  for(let y=0;y<height;y+=2)for(let x=0;x<width;x+=2){
   const alpha=expected.data[(y*width+x)*4+3],actual=sample(left+x,top+y);
   if(alpha>=252){assert(actual.every(c=>c>=250),'source artwork must become white');checkedOpaque++;}
   else if(alpha===0){assert.deepEqual(actual,brand,'transparent source pixels must remain brand blue');checkedClear++;}
  }
  assert(checkedOpaque>100&&checkedClear>100,'source bridge/aperture must have real filled and transparent regions');
 }
});

test('mobile launch keeps only the OS-owned splash and blue auth-loading canvas',()=>{
 const html=read('dist/web/index.html');
 assert(!html.includes('<div id="pbAppSplashV780"'));
 const style=html.match(/<style id="pbR1284LaunchStyle">[\s\S]*?<\/style>/)?.[0];
 assert(style&&style.includes('#2674ff')&&!style.includes('#040e1a'));
 assert(style.includes('#fff'));
 assert(html.includes('photobridge.webmanifest?v=r1359'));
 assert.match(html,/<link[^>]+rel="apple-touch-icon"[^>]+href="\/photobridge-[^"<>]+\.png"/);
 assert.equal((html.match(/id="pbR1284LaunchStyle"/g)||[]).length,1);
 const portal=read('dist/api/equipment-rental-book.html');
 assert(portal.includes('photobridge.webmanifest?v=r1359'));
});
