import fs from 'node:fs';
import path from 'node:path';

const source='scripts/r1590-photographer-desktop-card-fit.css';
const destination='dist/web/photobridge-r1590-photographer-desktop-card-fit.css';
const htmlPath='dist/web/index.html';
const css=fs.readFileSync(source,'utf8');
if(!css.includes('liveTimeline') || !css.includes('albumOrderSummaryFactsPrimary') ||
   !css.includes('pb1126Embedded') || !css.includes('pb1126Desktop'))
  throw new Error('R1590 desktop-only stylesheet incomplete');
fs.writeFileSync(destination,css);
let html=fs.readFileSync(htmlPath,'utf8');
const marker='/photobridge-r1590-photographer-desktop-card-fit.css?v=r1590';
const tag='<link rel="stylesheet" href="'+marker+'">';
if(!html.includes(marker)){
  if(!html.includes('</head>'))throw new Error('R1590 main HTML head missing');
  html=html.replace('</head>',tag+'\n</head>');
  fs.writeFileSync(htmlPath,html);
}
console.log('[R1590] Desktop photographer print and album cards: centered dots/labels; album facts contained; mobile unchanged.');
