import fs from 'node:fs';

const cssFile='dist/web/photobridge-r1137-lab-local-intake.css';
const indexFile='dist/web/index.html';
const marker='/* PB1500 manual-order preview and quantity visibility */';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes(marker)){
 css+=`\n${marker}\n.pb1137Intake .pb1139GroupPhotos{max-height:min(240px,36dvh)!important;overflow-x:auto!important;overflow-y:auto!important;scrollbar-width:thin!important;align-items:flex-start!important}\n.pb1137Intake .pb1139GroupPhotos figure{overflow:visible!important}\n.pb1137Intake .pb1139GroupPhotos img{height:82px!important;object-fit:contain!important}\n.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions{min-height:32px!important;height:auto!important;overflow:visible!important}\n.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1180IntakePaper{min-height:30px!important;height:30px!important;font-size:10.5px!important}\n.pb1137Intake .pb1139GroupPhotos .pb1142Quantity{display:flex!important;visibility:visible!important;opacity:1!important;position:static!important;min-height:32px!important;height:32px!important;overflow:visible!important;align-items:center!important}\n.pb1137Intake .pb1139GroupPhotos .pb1142Quantity input{width:42px!important;min-width:42px!important;height:30px!important;min-height:30px!important;text-align:center!important;font-size:12px!important}\n.pb1137Intake .pb1139GroupPhotos .pb1142Quantity button{width:26px!important;min-width:26px!important;height:30px!important;min-height:30px!important;flex:0 0 26px!important;font-size:14px!important}\n`;
 fs.writeFileSync(cssFile,css);
}
let html=fs.readFileSync(indexFile,'utf8');
const link=/href="(\/photobridge-r1137-lab-local-intake\.css)\?v=[^"]+"/g;
const matches=[...html.matchAll(link)];
if(!html.includes('photobridge-r1137-lab-local-intake.css?v=r1500-manual-order-quantity')){
 if(matches.length!==1)throw Error(`R1500 expected one manual-order stylesheet reference; found ${matches.length}`);
 html=html.replace(link,'href="$1?v=r1500-manual-order-quantity"');fs.writeFileSync(indexFile,html);
}
