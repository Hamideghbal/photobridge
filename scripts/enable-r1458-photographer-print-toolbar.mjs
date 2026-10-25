import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1458 print toolbar */')){
 const anchor='className:"photographerPrintModeUtilityCluster",children:[';
 if(ui.split(anchor).length!==2)throw Error('R1458 utility anchor');
 ui=ui.replace(anchor,anchor+'e.jsx("button",{type:"button",className:"photographerPrintCommonAction pb1458LabPrices",disabled:W||!p,onClick:()=>window.pb1178ShowLabPrices?.(p),children:"تعرفه‌های لابراتوار"}),');
 ui+='\n/* PB1458 print toolbar */\n';fs.writeFileSync(file,ui);
}
const navFile='dist/web/photobridge-r1126-desktop-navigation.js';let nav=fs.readFileSync(navFile,'utf8');
if(!nav.includes('/* PB1458 print toolbar */')){
 const anchor="  const row=chrome.querySelector('.pb1126Secondary'),doc=currentDocument();";
 if(nav.split(anchor).length!==2)throw Error('R1458 navigation anchor');
 nav=nav.replace(anchor,"  /* PB1458 print toolbar */\n  chrome.classList.toggle('pb1458PrintToolbar',active==='print');\n"+anchor);
 fs.writeFileSync(navFile,nav);
}
const cssFile='dist/web/photobridge-r1126-desktop-navigation.css';let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('/* PB1458 print toolbar */')){css+='\n/* PB1458 print toolbar */\n'+fs.readFileSync('scripts/r1458-photographer-print-toolbar.css','utf8');fs.writeFileSync(cssFile,css)}
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let html=fs.readFileSync(file,'utf8');html=html.replace(/(photobridge-r1126-desktop-navigation\.(?:css|js)\?[^"'\s]*)/g,url=>url.includes('printToolbar=r1458')?url:url+'&printToolbar=r1458');html=html.replaceAll('downloadRepair=r1455','downloadRepair=r1458');fs.writeFileSync(file,html)}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});execFileSync(process.execPath,['--check',navFile],{stdio:'inherit'});console.log('[R1458] Right-aligned print tabs, compact identity and prices beside finance/archive.');
