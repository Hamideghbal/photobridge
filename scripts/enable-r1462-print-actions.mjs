import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const uiFile='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(uiFile,'utf8');
if(!ui.includes('/* PB1462 settings prices */')){
 const anchor='e.jsx("button",{className:m==="account"?"active":"",onClick:()=>h("account"),children:"وضعیت حساب"}),';
 if(ui.split(anchor).length!==2)throw Error('R1462 settings anchor');
 ui=ui.replace(anchor,anchor+'t.lab&&!t.lab.service_only&&e.jsx("button",{type:"button",className:"pb1462SettingsPrices",disabled:o,onClick:()=>window.pb1178ShowLabPrices?.(t),children:"تعرفه‌های لابراتوار"}),');ui+='\n/* PB1462 settings prices */\n';fs.writeFileSync(uiFile,ui);
}
if(!ui.includes('/* PB1462 automatic lab crop */')){
 const start=ui.indexOf('function ej('),end=ui.indexOf('function ',start+20);let intake=ui.slice(start,end);
 const warningStart=intake.indexOf('if(pbMismatch&&!window.__photobridgePrintDelegateToLabV666'),warningEnd=intake.indexOf('const ue=new AbortController',warningStart);
 if(start<0||end<0||warningStart<0||warningEnd<0||intake.split('cropHandling:"none"').length!==2)throw Error('R1462 crop warning anchor');
 intake=intake.slice(0,warningStart)+'if(pbMismatch)PB1462RatioNotice(pbMismatch);'+intake.slice(warningEnd);
 intake=intake.replace('cropHandling:"none"','cropHandling:"lab"');ui=ui.slice(0,start)+intake+ui.slice(end)+'\n/* PB1462 automatic lab crop */\n'+fs.readFileSync('scripts/r1462-ratio-notice.js','utf8');fs.writeFileSync(uiFile,ui);
}
fs.writeFileSync('dist/web/photobridge-print-delegation-v666.js',"/* R1462: Simple Print always delegates crop adjustment to the lab; no opt-in UI. */\nwindow.__photobridgePrintDelegationRuntimeV666=true;window.__photobridgePrintDelegateToLabV666=true;\n");
const navFile='dist/web/photobridge-r1126-desktop-navigation.js';let nav=fs.readFileSync(navFile,'utf8');
if(!nav.includes('/* PB1462 toolbar prices retired */')){const anchor="&&!el.classList.contains('photographerPrintModeBack'));";if(nav.split(anchor).length!==2)throw Error('R1462 print visibility anchor');nav=nav.replace(anchor,"&&!el.classList.contains('photographerPrintModeBack')&&!el.classList.contains('pb1458LabPrices')); /* PB1462 toolbar prices retired */");fs.writeFileSync(navFile,nav)}
const cssFile='dist/web/photobridge-r1126-desktop-navigation.css';let css=fs.readFileSync(cssFile,'utf8');if(!css.includes('/* PB1462 compact print actions */')){css+='\n/* PB1462 compact print actions */\n'+fs.readFileSync('scripts/r1462-print-actions.css','utf8');fs.writeFileSync(cssFile,css)}
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let html=fs.readFileSync(file,'utf8');html=html.replace(/(photobridge-r1126-desktop-navigation\.(?:js|css)\?[^"'\s]*)/g,url=>url.includes('printActions=r1462')?url:url+'&printActions=r1462');html=html.replaceAll('downloadRepair=r1459','downloadRepair=r1462');html=html.replace(/(photobridge-print-delegation-v666\.js\?)[^"'\s]*/g,(_,prefix)=>prefix+'v=r1462');fs.writeFileSync(file,html)}
execFileSync(process.execPath,['--check',uiFile],{stdio:'inherit'});execFileSync(process.execPath,['--check',navFile],{stdio:'inherit'});console.log('[R1462] Compact lab-style status controls, centered New Print and tariffs in Settings.');
