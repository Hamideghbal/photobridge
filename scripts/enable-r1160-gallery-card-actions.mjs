// R1161: validate explicit two-row controls and refresh client assets.
import fs from 'node:fs';
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';
const ui=fs.readFileSync(bundle,'utf8');
if(!ui.includes('className:"clientGalleryCardActions pb1160GalleryActions"') ||
   !ui.includes('className:"pbActionButton pb1160GalleryDelete"') ||
   !ui.includes('className:"pb1161GalleryTopRow"') ||
   !ui.includes('className:"pb1161GalleryBottomRow"') ||
   !ui.includes('await Me(`/api/customer/client-galleries/${L.id}`,{method:"DELETE"})') ||
   !ui.includes('await window.pb1113GalleryConfirm(`گالری «${L.title}»'))
 throw Error('R1161 gallery-card actions or delete confirmation are missing');
const cssFile='dist/web/photobridge-r1159-gallery-intro-cards.css';
const css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('/* R1161:') || !css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'))
 throw Error('R1161 two-row gallery layout CSS is missing');
const htmlFile='dist/web/index.html';
let html=fs.readFileSync(htmlFile,'utf8');
for(const [pattern,replacement] of [
 [/photobridge-r1159-gallery-intro-cards\.css\?v=r1159(?:&cards=r1160|&cards=r1161|&cards=r1163|&cards=r1164)?/g,'photobridge-r1159-gallery-intro-cards.css?v=r1159&cards=r1161'],
 [/index-UIRefine-v655-r84\.js\?v=r1159(?:&cards=r1160|&cards=r1161|&cards=r1163|&cards=r1164)?/g,'index-UIRefine-v655-r84.js?v=r1159&cards=r1161']
]){
 if(!pattern.test(html))throw Error('R1161 HTML asset reference missing: '+replacement);
 html=html.replace(pattern,replacement);
}
fs.writeFileSync(htmlFile,html);
console.log('[R1161] two gallery-card action rows ready');
