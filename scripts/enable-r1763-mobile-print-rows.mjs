/* R1763: final, web-mobile-only print action layout. */
import fs from 'node:fs';
const cssFile='dist/web/photobridge-r1763-mobile-print-rows.css';
const htmlFile='dist/web/index.html';
const css=fs.readFileSync('scripts/r1763-mobile-print-rows.css','utf8');
if(!css.startsWith('/* R1763:')||!css.includes('grid-template-areas:"add send"')||!css.includes('simplePrintPilotMobileInlineActions'))throw Error('[R1763] incomplete mobile-only layout');
fs.writeFileSync(cssFile,css);
let html=fs.readFileSync(htmlFile,'utf8');
const link='<link rel="stylesheet" href="/photobridge-r1763-mobile-print-rows.css?v=r1763">';
if(!html.includes(link)){
 if(!html.includes('</head>'))throw Error('[R1763] missing web head');
 html=html.replace('</head>',link+'\n</head>');
 fs.writeFileSync(htmlFile,html);
}
console.log('[R1763] iPhone/small mobile print buttons are two in-flow columns; desktop and upload behavior unchanged.');
