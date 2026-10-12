// Keep the latest five-button gallery layout cached separately from R1159.
import fs from 'node:fs';
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';
const ui=fs.readFileSync(bundle,'utf8');
if(!ui.includes('className:"clientGalleryCardActions pb1160GalleryActions"') ||
   !ui.includes('className:"pbActionButton pb1160GalleryDelete"') ||
   !ui.includes('await Me(`/api/customer/client-galleries/${L.id}`,{method:"DELETE"})') ||
   !ui.includes('await window.pb1113GalleryConfirm(`گالری «${L.title}»'))
 throw Error('R1160 gallery-card actions or delete confirmation are missing');
const cssFile='dist/web/photobridge-r1159-gallery-intro-cards.css';
const css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('/* R1160:') || !css.includes('grid-template-columns:repeat(14,minmax(0,1fr))'))
 throw Error('R1160 gallery layout CSS is missing');
const htmlFile='dist/web/index.html';
let html=fs.readFileSync(htmlFile,'utf8');
for(const [pattern,replacement] of [
 [/photobridge-r1159-gallery-intro-cards\.css\?v=r1159(?:&cards=r1160)?/g,'photobridge-r1159-gallery-intro-cards.css?v=r1159&cards=r1160'],
 [/index-UIRefine-v655-r84\.js\?v=r1159(?:&cards=r1160)?/g,'index-UIRefine-v655-r84.js?v=r1159&cards=r1160']
]){
 if(!pattern.test(html))throw Error('R1160 HTML asset reference missing: '+replacement);
 html=html.replace(pattern,replacement);
}
fs.writeFileSync(htmlFile,html);
console.log('[R1160] gallery card action layout and cache revisions ready');
