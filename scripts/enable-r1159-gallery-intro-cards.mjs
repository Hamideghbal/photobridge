// Apply the newest gallery asset revision *after* legacy generators reset bundle cache keys.
import fs from 'node:fs';
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';
const source=fs.readFileSync(bundle,'utf8');
if(!source.includes('className:"clientGalleryIntro card pb1158Intro pb1159Intro"') ||
   !source.includes('className:"pb1159IntroCosts"'))
  throw Error('R1159 gallery overview source is missing after generators');
const css='/photobridge-r1159-gallery-intro-cards.css?v=r1159';
const path='dist/web/index.html';
let html=fs.readFileSync(path,'utf8');
if(!html.includes(css)){
 const after='<link rel="stylesheet" href="/photobridge-r1153-gallery-manager.css?v=r1158">';
 if(!html.includes(after))throw Error('R1159 gallery CSS insertion anchor missing');
 html=html.replace(after,after+'\n<link rel="stylesheet" href="'+css+'">');
}
const before=html;
html=html.replace(/(\/assets\/index-UIRefine-v655-r84\.js\?v=)[^"']+/g,(_,prefix)=>prefix+'r1159');
if(!html.includes('/assets/index-UIRefine-v655-r84.js?v=r1159'))
 throw Error('R1159 gallery bundle asset query missing');
if(html!==before)fs.writeFileSync(path,html);
console.log('[R1159] compact blue gallery introduction and full-width card actions prepared');
