/* R1660. Install last, after the lab/photographer mobile dock patches. */
import fs from 'node:fs';
const name='photobridge-r1660-mobile-lab-order-number.css';
const source='scripts/r1660-mobile-lab-order-number.css';
const css=fs.readFileSync(source,'utf8');
for(const check of ['@media(max-width:820px)','.labOrderHead>div:first-child>b',
 'white-space:nowrap!important','word-break:keep-all!important','display:block!important'])
 if(!css.includes(check))throw Error('R1660 missing '+check);
const path='dist/web/index.html';
let html=fs.readFileSync(path,'utf8');
if(!html.includes('</head>')||html.includes('/'+name+'?'))
 throw Error('R1660 HTML insertion check failed');
fs.copyFileSync(source,'dist/web/'+name);
html=html.replace('</head>','<link rel="stylesheet" href="/'+name+'?v=r1660">\n</head>');
fs.writeFileSync(path,html);
console.log('[R1660] Lab mobile order numbers stay together and cards use full width.');
