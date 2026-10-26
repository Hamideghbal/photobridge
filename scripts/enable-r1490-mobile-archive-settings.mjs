import fs from 'node:fs';
const root='dist/web/';
const css=fs.readFileSync('scripts/r1490-mobile-archive-settings.css','utf8');
const file=root+'photobridge-r1490-mobile-archive-settings.css';
fs.writeFileSync(file,css);
const index=root+'index.html';let html=fs.readFileSync(index,'utf8');
const tag='<link rel="stylesheet" href="/photobridge-r1490-mobile-archive-settings.css?v=r1490">';
if(!html.includes(tag)){
 if(!html.includes('photobridge-r1489-unified-phone-picker.css?v=r1489'))throw Error('R1490 expected prior phone UI stage missing');
 html=html.replace('</head>',tag+'\n</head>');
 fs.writeFileSync(index,html);
}
console.log('[R1490] Phone-only archive action layout, invoice close control, paired settings pickers and editable tariff cards linked.');
