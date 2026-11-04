import fs from 'node:fs';
const source='scripts/r1591-desktop-print-four-section.css';
const destination='dist/web/photobridge-r1591-desktop-print-four-section.css';
const htmlPath='dist/web/index.html';
const css=fs.readFileSync(source,'utf8');
const expected=['liveOrderMainRow','customerOrderFacts','pb1464OrderProgress','customerOrderQuickRail','customerOrderQuickActions','pb1126Embedded','pb1126Desktop'];
for(const marker of expected)if(!css.includes(marker))throw new Error('R1591 missing layout marker '+marker);
fs.writeFileSync(destination,css);
let html=fs.readFileSync(htmlPath,'utf8');
const marker='/photobridge-r1591-desktop-print-four-section.css?v=r1591';
if(!html.includes(marker)){
 if(!html.includes('</head>'))throw new Error('R1591 missing HTML head');
 html=html.replace('</head>','<link rel="stylesheet" href="'+marker+'">\n</head>');
 fs.writeFileSync(htmlPath,html);
}
console.log('[R1591] Four-section desktop print card with centered middle zones and 3 dividers.');
