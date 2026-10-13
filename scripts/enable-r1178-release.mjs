import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
await import('./enable-r1178-lab-order-backend.mjs');
await import('./enable-r1178-print-ui.mjs');
const path='dist/web/index.html';let html=fs.readFileSync(path,'utf8');
for(const ext of ['css','js']){
 const name='photobridge-r1137-lab-local-intake.'+ext;
 html=html.replace(new RegExp('('+name.replaceAll('.','\\.')+'\\?v=)[^"\\s]+','g'),'$1r1178');
}
if(!html.includes('&intake=r1178'))html=html.replace(/(&cards=r\d+)/,'$1&intake=r1178');
const assets='<link rel="stylesheet" href="/photobridge-r1178-print-ux.css?v=r1178"><script defer src="/photobridge-r1178-photographer-prices.js?v=r1178"></script>';
if(!html.includes('/photobridge-r1178-print-ux.css'))html=html.replace('</head>',assets+'\n</head>');
fs.writeFileSync(path,html);
execFileSync(process.execPath,['--check','dist/web/photobridge-r1137-lab-local-intake.js'],{stdio:'inherit'});
execFileSync(process.execPath,['--check','dist/web/photobridge-r1178-photographer-prices.js'],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1178-intake-proforma-and-copies.cjs'],{stdio:'inherit'});
