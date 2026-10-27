import fs from 'node:fs';
const root='dist/web/';
fs.writeFileSync(root+'photobridge-r1492-lab-phone-readable-records.css',fs.readFileSync('scripts/r1492-lab-phone-readable-records.css','utf8'));
const index=root+'index.html';let html=fs.readFileSync(index,'utf8');
const tag='<link rel="stylesheet" href="/photobridge-r1492-lab-phone-readable-records.css?v=r1492">';
if(!html.includes(tag)){
 if(!html.includes('photobridge-r1491-mobile-archive-action-grid.css?v=r1491'))throw Error('R1492 expected archive-action phone stage missing');
 html=html.replace('</head>',tag+'\n</head>');fs.writeFileSync(index,html);
}
console.log('[R1492] Increased mobile number sizes, styled statement rows as cards, and left-aligned archive view actions.');
