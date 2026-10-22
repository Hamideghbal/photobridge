/** R1359: only the installed mobile PWA icon and OS-managed launch appearance.
 * Keep the single native/OS splash; never inject a second HTML splash.
 * The native system renders its own compact "PhotoBridge" app label below
 * the logo. Avoid including the old distorted wordmark inside the icon.
 */
import fs from 'node:fs';
import sharp from 'sharp';
const base='dist/web/';
const brand='#2674ff';
const revision='r1359';
// The source PNG is the REAL PhotoBridge artwork currently used by the
// app (aperture inside the suspension bridge, cursive PhotoBridge below).
// Extract only its existing bridge/aperture emblem. Android/iOS draws the
// app name separately; do not bake tiny distorted typography into the icon.
// No hand-drawn replacement SVG or substitute brand shape is permitted.
const source=base+'photobridge-brand-script-r1285.png';
if(!fs.existsSync(source))throw Error('[R1359] Original PhotoBridge brand PNG is missing; refusing to fabricate a logo');
const original=await sharp(source).metadata();
if(original.width!==1254||original.height!==1254||!original.hasAlpha)
 throw Error('[R1359] Original brand artwork changed: review crop before releasing');
const emblemCrop={left:Math.round(original.width*.078),top:Math.round(original.height*.174),
 width:Math.round(original.width*.844),height:Math.round(original.height*.423)};
if(emblemCrop.left+emblemCrop.width>original.width||emblemCrop.top+emblemCrop.height>original.height)
 throw Error('[R1359] Source emblem exceeds original image');
const icons=[[192,'photobridge-native-192-r1359.png'],[512,'photobridge-native-512-r1359.png'],[180,'photobridge-native-touch-r1359.png']];
for(const [size,name] of icons){
 const width=Math.round(size*.68);
 const height=Math.round(width*emblemCrop.height/emblemCrop.width);
 const {data,info}=await sharp(source).extract(emblemCrop).resize(width,height).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.channels!==4)throw Error('[R1359] Original emblem lost transparency');
 let nontransparent=0;
 for(let i=0;i<data.length;i+=4){
   if(data[i+3]>0){data[i]=255;data[i+1]=255;data[i+2]=255;nontransparent++;}
 }
 if(nontransparent<data.length/4*.04)throw Error('[R1359] Original emblem is unexpectedly empty');
 const whiteEmblem=await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
 await sharp({create:{width:size,height:size,channels:4,background:brand}})
  .composite([{input:whiteEmblem,left:Math.floor((size-info.width)/2),top:Math.floor((size-info.height)/2)}])
  .png({compressionLevel:9}).toFile(base+name);
}
const manifestPath=base+'photobridge.webmanifest';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(manifest.id!=='/photobridge-pwa'||manifest.display!=='standalone')throw Error('[R1359] unexpected PWA manifest identity');
manifest.name='PhotoBridge';
manifest.short_name='PhotoBridge';
manifest.background_color=brand;
manifest.theme_color=brand;
manifest.icons=[192,512].map(size=>({src:`/photobridge-native-${size}-r1359.png`,sizes:`${size}x${size}`,type:'image/png',purpose:'any maskable'}));
manifest._legacy_splash_icon='/photobridge-native-512-r1359.png';
if(Array.isArray(manifest.related_applications))manifest.related_applications=manifest.related_applications.map(app=>({...app,url:app.url?.replace(/photobridge\.webmanifest\?v=[^&]+/,'photobridge.webmanifest?v='+revision)}));
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html','dist/api/equipment-rental-portal.html']){
 if(!fs.existsSync(file))continue;
 let html=fs.readFileSync(file,'utf8');
 html=html.replace(/photobridge\.webmanifest\?v=[^"'<>\s]+/g,'photobridge.webmanifest?v='+revision);
 html=html.replace(/photobridge-(?:native|apple)-touch-r\d+\.png/g,'photobridge-native-touch-r1359.png');
 if(file==='dist/web/index.html'){
  const style=/<style id="pbR1284LaunchStyle">[\s\S]*?<\/style>/;
  if(!style.test(html))throw Error('[R1359] OS-managed launch guard missing');
  html=html.replace(style,block=>block.replace(/#040e1a/gi,brand).replace(/#9fb5ce/gi,'#fff'));
  if(html.includes('<div id="pbAppSplashV780"'))throw Error('[R1359] duplicate web splash would appear after native launch');
  if(!html.includes('href="/photobridge-native-touch-r1359.png"'))throw Error('[R1359] Apple touch icon is not linked');
 }
 fs.writeFileSync(file,html);
}
console.log('[R1359] Mobile app: white enlarged bridge mark on PhotoBridge blue, single OS splash and clean system-rendered title.');
