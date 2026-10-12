// R1162: leave gallery desktop header and duplicate delete guard intact after older build generators.
import fs from 'node:fs';
const htmlFile='dist/web/index.html';
const cssFile='dist/web/photobridge-r1153-gallery-manager.css';
const scriptFile='dist/web/photobridge-r1162-gallery-card-cleanup.js';
const css=fs.readFileSync(cssFile,'utf8');
const script=fs.readFileSync(scriptFile,'utf8');
if(!css.includes('/* R1162:') || !css.includes('grid-template-areas:"back identity tabs"'))
 throw Error('R1162 gallery desktop header stylesheet is absent');
if(!script.includes('extraDeleteLabel') || !script.includes("button.hidden=true"))
 throw Error('R1162 duplicate-delete protection is missing');
let html=fs.readFileSync(htmlFile,'utf8');
const oldCss='<link rel="stylesheet" href="/photobridge-r1153-gallery-manager.css?v=r1158">';
const newCss='<link rel="stylesheet" href="/photobridge-r1153-gallery-manager.css?v=r1162">';
if(html.includes(oldCss))html=html.replace(oldCss,newCss);
if(!html.includes(newCss))throw Error('R1162 gallery manager CSS asset is not linked');
const newScript='<script defer src="/photobridge-r1162-gallery-card-cleanup.js?v=r1162"></script>';
if(!html.includes(newScript))html=html.replace(newCss,newCss+'\n'+newScript);
fs.writeFileSync(htmlFile,html);
console.log('[R1162] gallery manager desktop header and icon-only deletion prepared');
