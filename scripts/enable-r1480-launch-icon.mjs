import fs from 'node:fs';import sharp from 'sharp';
const base='dist/web/',mark=base+'photobridge-launch-mark-r1479.png',meta=await sharp(mark).metadata();
// Baked glyph paths cannot disappear on a fontless Docker builder.
const wordmark=fs.readFileSync('scripts/r1480-wordmark.svg');
for(const size of [180,192,512]){
 const width=Math.round(size*.77),height=Math.round(width*meta.height/meta.width);
 const symbol=await sharp(mark).resize(width,height).png().toBuffer();
 const word=await sharp(wordmark).trim().resize(Math.round(size*.68),null).png().toBuffer();const w=await sharp(word).metadata();
 await sharp({create:{width:size,height:size,channels:4,background:'#f8fbff'}}).composite([{input:symbol,left:Math.round((size-width)/2),top:Math.round(size*.18)},{input:word,left:Math.round((size-w.width)/2),top:Math.round(size*.635)}]).png().toFile(base+`photobridge-app-${size}-r1480.png`);
}
const p=base+'photobridge.webmanifest',manifest=JSON.parse(fs.readFileSync(p,'utf8'));
manifest.icons=[192,512].flatMap(size=>['any','maskable'].map(purpose=>({src:`/photobridge-app-${size}-r1480.png`,sizes:`${size}x${size}`,type:'image/png',purpose})));
manifest._legacy_splash_icon='/photobridge-app-512-r1480.png';for(const app of manifest.related_applications||[])if(app.platform==='webapp'&&app.url)app.url=app.url.replace(/\?v=[^&]+/,'?v=r1480');fs.writeFileSync(p,JSON.stringify(manifest,null,2)+'\n');
for(const p of [base+'index.html','dist/api/equipment-rental-book.html','dist/api/equipment-rental-portal.html']){let html=fs.readFileSync(p,'utf8');html=html.replace(/photobridge.webmanifest\?v=[^"']+/g,'photobridge.webmanifest?v=r1480').replace(/photobridge-(?:launch-180-r1479|native-touch-r\d+)\.png/g,'photobridge-app-180-r1480.png');fs.writeFileSync(p,html);}
