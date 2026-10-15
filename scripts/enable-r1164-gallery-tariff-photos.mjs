// R1164: keep pricing, photo-only UI, modal layering, and gallery-tab assets stable after build generators.
import fs from 'node:fs';
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const managerCss=fs.readFileSync('dist/web/photobridge-r1153-gallery-manager.css','utf8');
const desktopCss=fs.readFileSync('dist/web/photobridge-r1124-photographer-desktop-header.css','utf8');
const desktopJs=fs.readFileSync('dist/web/photobridge-r1163-desktop-gallery-header.js','utf8');
for(const marker of [
  'className:"pb1164TariffDigitalPrice"',
  'digitalPrice:c.digitalPrice,onDigitalPriceChange:',
  'await Me(`/api/customer/client-galleries/${l.id}`,{method:"PATCH",body:JSON.stringify({digitalPrice:Number(c.digitalPrice||0)})})',
  'children:"عکس‌ها"',
  '"＋ افزودن عکس"',
  'accept:"image/jpeg,image/png,image/webp"'
]){
 if(!ui.includes(marker))throw Error('R1164 gallery pricing/photo marker missing: '+marker);
}
if(ui.includes('عکس‌ها و ویدیوها')||ui.includes('＋ افزودن عکس / ویدیو'))throw Error('R1164 gallery must be photo-only');
if(!managerCss.includes('/* R1165:')||!desktopCss.includes('/* R1165:')||!desktopJs.includes("bar.querySelectorAll(':scope > button')")||!desktopJs.includes("find(current,'.clientGalleryMediaPanel')"))throw Error('R1165 tariff layout or desktop gallery motion patch missing');
if(!managerCss.includes('/* R1164:')||!managerCss.includes('z-index:2147483600!important')||!desktopCss.includes('/* R1164:')||!desktopJs.includes('pb1164MovingIndicator')||!desktopJs.includes('pb1164TabCount'))throw Error('R1164 desktop overlay or gallery tab animation is missing');
const htmlFile='dist/web/index.html';let html=fs.readFileSync(htmlFile,'utf8');
const rewrites=[
 [/photobridge-r1153-gallery-manager\.css\?v=r(?:1163|1164|1165)/g,'photobridge-r1153-gallery-manager.css?v=r1165'],
 [/photobridge-r1124-photographer-desktop-header\.css\?v=r(?:1163|1164|1165)/g,'photobridge-r1124-photographer-desktop-header.css?v=r1165'],
 [/photobridge-r1163-desktop-gallery-header\.js\?v=r(?:1163|1164|1165)/g,'photobridge-r1163-desktop-gallery-header.js?v=r1165'],
 [/index-UIRefine-v655-r84\.js\?v=r1159(?:&wallet=r1238)?&cards=r(?:1163|1164)/g,'index-UIRefine-v655-r84.js?v=r1159&wallet=r1238&cards=r1164']
];
for(const [pattern,version] of rewrites){if(!pattern.test(html))throw Error('R1164 HTML asset missing: '+version);html=html.replace(pattern,version);}
fs.writeFileSync(htmlFile,html);
console.log('[R1164] gallery tariff overlay, digital price and photo-only navigation ready');
