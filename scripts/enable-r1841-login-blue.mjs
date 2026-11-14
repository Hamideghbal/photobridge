#!/usr/bin/env node
// R1841: brand-blue login theme. Pure CSS: no auth/session/routing changes.
import fs from 'node:fs';

const stylesheet='/photobridge-r1841-login-blue.css?v=r1841';
const cssPath='dist/web/photobridge-r1841-login-blue.css';
if(!fs.existsSync(cssPath))throw Error('[R1841] login stylesheet missing');
const css=fs.readFileSync(cssPath,'utf8');
if(!css.includes('#315efb')||!css.includes('.unifiedLoginPage')||
   !css.includes('.rentalUnifiedLogin')||!css.includes('.passwordResetCard'))
  throw Error('[R1841] expected login palette or scope missing');
let installed=0;
for(const file of ['dist/web/index.html','dist/api/equipment-rental-portal.html']){
  if(!fs.existsSync(file))continue;
  let html=fs.readFileSync(file,'utf8');
  // The rental portal may be generated later from a placeholder.
  if(!html.trim())continue;
  if(!html.includes('</head>'))throw Error('[R1841] missing head in '+file);
  if(!html.includes(stylesheet)){
    html=html.replace('</head>','<link rel="stylesheet" href="'+stylesheet+'">\n</head>');
    fs.writeFileSync(file,html);
  }
  if(html.split(stylesheet).length!==2)throw Error('[R1841] duplicate blue stylesheet in '+file);
  installed++;
}
if(!installed)throw Error('[R1841] no HTML entry received stylesheet');
console.log('[R1841] blue login CSS installed in '+installed+' web entry document(s)');
