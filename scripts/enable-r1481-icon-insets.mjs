import fs from 'node:fs';import sharp from 'sharp';
const base='dist/web/',mark=base+'photobridge-launch-mark-r1479.png',meta=await sharp(mark).metadata();
// Keep the approved web launch; reserve lower/right space for browser badges.
// Baked glyph paths retain the visible name without system fonts.
const wordmark=fs.readFileSync('scripts/r1480-wordmark.svg');
for(const size of [180,192,512]){
 const width=Math.round(size*.64),height=Math.round(width*meta.height/meta.width);
 const symbol=await sharp(mark).resize(width,height).png().toBuffer();
 const word=await sharp(wordmark).trim().resize(Math.round(size*.58),null).png().toBuffer();const w=await sharp(word).metadata();
 await sharp({create:{width:size,height:size,channels:4,background:'#f8fbff'}}).composite([{input:symbol,left:Math.round((size-width)/2),top:Math.round(size*.22)},{input:word,left:Math.round((size-w.width)/2),top:Math.round(size*.58)}]).png().toFile(base+`photobridge-app-${size}-r1481.png`);
}
const p=base+'photobridge.webmanifest',manifest=JSON.parse(fs.readFileSync(p,'utf8'));
manifest.icons=[192,512].flatMap(size=>['any','maskable'].map(purpose=>({src:`/photobridge-app-${size}-r1481.png`,sizes:`${size}x${size}`,type:'image/png',purpose})));
manifest._legacy_splash_icon='/photobridge-app-512-r1481.png';for(const app of manifest.related_applications||[])if(app.platform==='webapp'&&app.url)app.url=app.url.replace(/\?v=[^&]+/,'?v=r1481');fs.writeFileSync(p,JSON.stringify(manifest,null,2)+'\n');
for(const p of [base+'index.html','dist/api/equipment-rental-book.html','dist/api/equipment-rental-portal.html']){let html=fs.readFileSync(p,'utf8');html=html.replace(/photobridge.webmanifest\?v=[^"']+/g,'photobridge.webmanifest?v=r1481').replace(/photobridge-(?:launch-180-r1479|app-180-r1480|native-touch-r\d+)\.png/g,'photobridge-app-180-r1481.png');fs.writeFileSync(p,html);}
