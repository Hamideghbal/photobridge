import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1606 anchor changed: '+a.slice(0,100));return s.replace(a,b)};
const nav='dist/web/photobridge-r1126-desktop-navigation.js';let s=fs.readFileSync(nav,'utf8');
s=once(s,"  const native=nativeHeader(currentDocument()||document)||nativeHeader(document);if(!native)return;",`  // R1606: select the final Gallery frame before mounting any header row.
  document.documentElement.classList.toggle('pb1310GalleryHome',kind()==='gallery'&&!document.querySelector('.clientGalleryManager'));
  const native=nativeHeader(currentDocument()||document)||nativeHeader(document);if(!native)return;`);
s=once(s,' function queueWarmPanels(){',` function queueWarmPanels(){
  // R1606: Gallery startup must not load two unrelated full applications.
  // open() still prepares either panel on its first explicit click.
  if(kind()==='gallery')return;`);fs.writeFileSync(nav,s);execFileSync(process.execPath,['--check',nav]);
const layout='dist/web/photobridge-r1310-layout.js';s=fs.readFileSync(layout,'utf8');s=once(s,"active==='gallery'&&!!qs('.clientGalleryWorkspace')&&!qs('.clientGalleryManager')","active==='gallery'&&!qs('.clientGalleryManager')");fs.writeFileSync(layout,s);execFileSync(process.execPath,['--check',layout]);
const html='dist/web/index.html';s=fs.readFileSync(html,'utf8').replace(/(photobridge-(?:r1126-desktop-navigation|r1310-layout)\.js)([^"'<>\s]*)/g,(_,name,q)=>name+q+(q.includes('?')?'&':'?')+'galleryStart=r1606');fs.writeFileSync(html,s);
fs.copyFileSync('scripts/r1606-store-availability.js','dist/web/photobridge-r1606-store-availability.js');execFileSync(process.execPath,['--check','dist/web/photobridge-r1606-store-availability.js']);s=fs.readFileSync(html,'utf8').replace('<head>','<head>\n'+fs.readFileSync('scripts/r1606-store-prepaint.html','utf8'));fs.writeFileSync(html,s);
