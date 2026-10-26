import fs from 'node:fs';
const root='dist/web/';
const file=root+'photobridge-r1491-mobile-archive-action-grid.css';
fs.writeFileSync(file,fs.readFileSync('scripts/r1491-mobile-archive-action-grid.css','utf8'));
const index=root+'index.html';let html=fs.readFileSync(index,'utf8');
const tag='<link rel="stylesheet" href="/photobridge-r1491-mobile-archive-action-grid.css?v=r1491">';
if(!html.includes(tag)){
 if(!html.includes('photobridge-r1490-mobile-archive-settings.css?v=r1490'))throw Error('R1491 expected R1490 phone UI stage missing');
 html=html.replace('</head>',tag+'\n</head>');fs.writeFileSync(index,html);
}
console.log('[R1491] Aligned all four archived invoice, file and reprint actions in the lab phone archive list.');
