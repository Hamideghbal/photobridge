import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('className:"clientGalleryManagerTop pb1155ManagerTop"')){
 const start=ui.indexOf('e.jsxs("div",{className:"clientGalleryManagerViewTabs"');
 const nav=ui.indexOf('e.jsxs("nav",{className:"clientGalleryManagerMobileNav"',start);
 const grid=ui.indexOf('e.jsxs("div",{className:"clientGalleryManagerGrid"',nav);
 if(start<0||nav<start||grid<nav)throw Error('Gallery manager filters not found');
 const tabs=ui.slice(start,nav-1);
 ui=ui.slice(0,start)+'null,'+ui.slice(grid);
 ui=ui.replace('className:"clientGalleryManagerTop",children:[','className:"clientGalleryManagerTop pb1155ManagerTop",children:['+tabs+',');
}
ui=ui.replace('children:"سفارش چاپ و فاکتور"','children:"نمایش قیمت و صدور فاکتور"');
fs.writeFileSync(file,ui);
const page='dist/web/index.html';let html=fs.readFileSync(page,'utf8');
html=html.replace(/photobridge-r1153-gallery-manager.css\?v=[^"']+/g,'photobridge-r1153-gallery-manager.css?v=r1156');
fs.writeFileSync(page,html);

html=fs.readFileSync(page,'utf8').replace(/photobridge-v904r100f41-header-date-name-fit.js\?v=[^"']+/g,'photobridge-v904r100f41-header-date-name-fit.js?v=r1156');fs.writeFileSync(page,html);
