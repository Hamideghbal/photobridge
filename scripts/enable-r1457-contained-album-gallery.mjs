import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1457 contained gallery body */')){
 const start=ui.indexOf('function PB1384GalleryModal('),end=ui.indexOf('\nfunction PB1384StoredColor',start);
 if(start<0||end<0)throw Error('R1457 gallery missing');
 let modal=ui.slice(start,end);
 const once=(a,b)=>{if(modal.split(a).length!==2)throw Error('R1457 anchor '+a.slice(0,90));modal=modal.replace(a,b)};
 once("e.jsx('p',{children:'عکس اول", "e.jsxs('div',{className:'pb1457GalleryBody',children:[e.jsx('p',{children:'عکس اول");
 once("e.jsxs('footer',{children:","]}),e.jsxs('footer',{children:");
 ui=ui.slice(0,start)+modal+ui.slice(end)+'\n/* PB1457 contained gallery body */\n';fs.writeFileSync(file,ui);
}
const cssFile='dist/web/photobridge-r1380-album-editor.css';let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('/* PB1457 contained gallery */')){css+=`\n/* PB1457 contained gallery */
html body .pb1384GalleryBackdrop{box-sizing:border-box;min-width:0;overflow:hidden}
html body .pb1384GalleryModal{min-width:0;max-width:100%;overflow:hidden}
html body .pb1384GalleryModal>header,html body .pb1384GalleryModal>footer{flex:0 0 auto;min-width:0}
html body .pb1384GalleryModal h3{overflow-wrap:anywhere;min-width:0;flex:1}
html body .pb1457GalleryBody{display:flex;flex-direction:column;gap:12px;flex:1 1 auto;min-height:0;min-width:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;padding:2px 4px;scrollbar-width:thin}
html body .pb1457GalleryBody>*{flex:0 0 auto;min-width:0;max-width:100%;box-sizing:border-box}
html body .pb1457GalleryBody .pb1454SampleChoices,html body .pb1457GalleryBody .pb1455RecoveryChoices{max-height:none;overflow:visible;grid-template-columns:repeat(auto-fill,minmax(min(115px,100%),1fr))}
html body .pb1457GalleryBody .pb1384GalleryGrid{overflow:visible;min-height:0;grid-template-columns:repeat(auto-fill,minmax(min(160px,100%),1fr))}
html body .pb1457GalleryBody button,html body .pb1384GalleryModal footer small{max-width:100%;overflow-wrap:anywhere}
html body .pb1457GalleryBody .pb1454SampleChoices button{min-width:0}
html body .pb1457GalleryBody .pb1454SampleChoices img{max-width:100%}
`;fs.writeFileSync(cssFile,css)}
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let html=fs.readFileSync(file,'utf8');html=html.replace(/(photobridge-r1380-album-editor\.css\?[^"'\s]*)/g,url=>url.includes('galleryBounds=r1457')?url:url+'&galleryBounds=r1457');fs.writeFileSync(file,html)}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});console.log('[R1457] Album gallery has one contained scroll body and persistent header/footer.');
