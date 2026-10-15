// R1163: validate the photographer desktop header and gallery-manager controls after legacy generators.
import fs from 'node:fs';
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const header=fs.readFileSync('dist/web/photobridge-r1163-desktop-gallery-header.js','utf8');
const desktopCss=fs.readFileSync('dist/web/photobridge-r1124-photographer-desktop-header.css','utf8');
const galleryCss=fs.readFileSync('dist/web/photobridge-r1153-gallery-manager.css','utf8');
for(const marker of ['className:"pb1163LogoPicker"','className:"pb1163GalleryPassword"','رمز قبلی به‌صورت امن','placeholder:"برای تغییر رمز، رمز تازه وارد کنید"']){
 if(!ui.includes(marker))throw Error('R1163 gallery field missing: '+marker);
}
if(!header.includes('pb1163ManagerRow')||!header.includes('pb1163HeaderTools')||!desktopCss.includes('/* R1163')||!galleryCss.includes('/* R1163'))throw Error('R1163 photographer header or gallery layout missing');
const path='dist/web/index.html';
let html=fs.readFileSync(path,'utf8');
const replace=(regexp,target)=>{
 if(!regexp.test(html))throw Error('R1163 asset missing: '+target);
 html=html.replace(regexp,target);
};
replace(/photobridge-r1153-gallery-manager\.css\?v=r(?:1158|1162|1163|1164|1165)/g,'photobridge-r1153-gallery-manager.css?v=r1163');
replace(/photobridge-r1124-photographer-desktop-header\.css\?v=r(?:1129|1135|1163|1164|1165)/g,'photobridge-r1124-photographer-desktop-header.css?v=r1163');
replace(/index-UIRefine-v655-r84\.js\?v=r1159(?:&wallet=r1238)?&cards=r(?:1161|1163|1164)/g,'index-UIRefine-v655-r84.js?v=r1159&wallet=r1238&cards=r1163');
const asset='<script defer src="/photobridge-r1163-desktop-gallery-header.js?v=r1163"></script>';
if(!/photobridge-r1163-desktop-gallery-header\.js\?v=r(?:1163|1164|1165)/.test(html))html=html.replace('</head>',asset+'\n</head>');
fs.writeFileSync(path,html);
console.log('[R1163] unified desktop controls and gallery profile/password fields ready');
