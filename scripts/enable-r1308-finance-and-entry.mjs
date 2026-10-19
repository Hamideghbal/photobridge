import fs from 'node:fs';
import path from 'node:path';
const files=['v813-finance-parity','v814-finance-store-print-polish','v815-print-finance-tabs','v816-print-finance-unify','v817-print-header-stability','v818-print-finance-composer-fix','v821-store-print-finance-fix','v822-direct-ui-fix'].map(name=>'dist/web/photobridge-'+name+'.js');
const helpers=`\n  /* PB1308: styling must settle and preserve React-owned child order. */
  function pb1308Add(el,...names){if(el)for(const name of names)if(!el.classList.contains(name))el.classList.add(name)}
  function pb1308Remove(el,...names){if(el)for(const name of names)if(el.classList.contains(name))el.classList.remove(name)}
  function pb1308Text(el,value){if(el&&el.textContent!==value)el.textContent=value}
  function pb1308Hidden(el,value){if(el&&el.hidden!==value)el.hidden=value}
  function pb1308Attr(el,name,value){if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value)}
  function pb1308Order(el,value){if(el&&el.style.order!==String(value))el.style.order=String(value)}
`;
for(const file of files){
 let code=fs.readFileSync(file,'utf8');if(code.includes('/* PB1308:'))continue;
 code=code.replace(/\b(\w+)\.classList\.add\(([^\n;]+?)\)/g,'pb1308Add($1,$2)');
 // Also handle nullable controls without writing unchanged classes.
 code=code.replace(/\b(\w+)\?\.classList\.add\(([^\n;]+?)\)/g,'pb1308Add($1,$2)');
 code=code.replace(/\b(\w+)\.classList\.remove\(([^\n;]+?)\)/g,'pb1308Remove($1,$2)');
 code=code.replace(/\b(\w+)\.textContent=([^;\n]+)/g,'pb1308Text($1,$2)');
 code=code.replace(/\b(\w+)\.setAttribute\(('(?:[^']*)'),'([^']*)'\)/g,"pb1308Attr($1,$2,'$3')");
 code=code.replace(/\b(\w+)\.hidden=(true|false)/g,'pb1308Hidden($1,$2)');
 code=code.replace("qs('.photographerMain .photographerPrintModeNav>.photographerPrintTopLab')?.classList.add('pb821CenteredLab')","pb1308Add(qs('.photographerMain .photographerPrintModeNav>.photographerPrintTopLab'),'pb821CenteredLab')");
 code=code.replace("qs('.financeSummary.accountingSummary',finance)?.classList.add('pb817FinanceSummary')","pb1308Add(qs('.financeSummary.accountingSummary',finance),'pb817FinanceSummary')");
 code=code.replace(/(?:w\.insertBefore\(nav,top\))/g,'pb1308Order(nav,0),pb1308Order(top,1)');
 code=code.replace(/if\(b\)tabs\.appendChild\(b\)/g,'if(b)pb1308Order(b,(typeof desired!=="undefined"?desired:typeof order!=="undefined"?order:wanted).indexOf(label))');
 code=code.replace('if(el)summary.appendChild(el)','if(el)pb1308Order(el,wanted.indexOf(label))');
 code=code.replace('if(!wanted.includes(label))el.remove()','if(!wanted.includes(label))pb1308Hidden(el,true)');
 code=code.replace("'use strict';","'use strict';"+helpers);
 fs.writeFileSync(file,code);
}
const navFile='dist/web/photobridge-r1126-desktop-navigation.js';let nav=fs.readFileSync(navFile,'utf8');
if(!nav.includes('function queueWarmPanels()')){
 const start=" function open(key,push=true){\n  if(selected===key)return;\n  let panel=panels.get(key);if(!panel){";
 if(!nav.includes(start))throw Error('R1308 panel preparation anchor missing');
 nav=nav.replace(start," function preparePanel(key){\n  let panel=panels.get(key);if(!panel){");
 const end="  closePanels();panel.hidden=false;selected=key;";
 if(!nav.includes(end))throw Error('R1308 panel activation anchor missing');
 nav=nav.replace(end,"  return panel;\n }\n function open(key,push=true){\n  if(selected===key)return;\n  const panel=preparePanel(key);\n"+end);
 nav=nav.replace("panel=document.createElement('section');panel.className='pb1126ContentPanel';","panel=document.createElement('section');panel.hidden=true;panel.className='pb1126ContentPanel';");
 const warm=`
 let warmQueued=false,warmEpoch=0;
 const whenIdle=fn=>typeof requestIdleCallback==='function'?requestIdleCallback(fn,{timeout:1500}):setTimeout(fn,250);
 function queueWarmPanels(){
  if(warmQueued||!authenticated||document.hidden||navigator.connection?.saveData)return;
  warmQueued=true;const epoch=warmEpoch;
  whenIdle(()=>{
   if(epoch!==warmEpoch||!authenticated)return;
   const print=preparePanel('print'),frame=print.querySelector('iframe');
   const next=()=>whenIdle(()=>{if(epoch===warmEpoch&&authenticated)preparePanel('store');});
   if(frame.contentDocument?.querySelector('.photographerPrintModeNav,#pbR99LabChooser'))next();else frame.addEventListener('load',next,{once:true});
  });
 }
 window.addEventListener('focus',queueWarmPanels);
`;
 nav=nav.replace(' function schedule(){if(!scheduled)',warm+'\n function schedule(){if(!scheduled)');
 nav=nav.replace("window.addEventListener('photobridge-navigation-tabs',e=>{if(e.detail?.tabs){settings=e.detail;","window.addEventListener('photobridge-navigation-tabs',e=>{if(e.detail?.tabs){authenticated=true;settings=e.detail;queueWarmPanels();");
 nav=nav.replace("authenticated=false;walletBalance=null;","authenticated=false;warmEpoch++;warmQueued=false;walletBalance=null;");
 fs.writeFileSync(navFile,nav);
}
const cssFile='dist/web/photobridge-r1126-desktop-navigation.css';let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('/* PB1308 chooser titles */')){
 css+=`\n/* PB1308 chooser titles */
html body #pbR99LabChooser .pbR99LabIntro.pbR99LabIntro::before,html body #storePhotographerWorkspace .pbR96StoreChooserHead::before,html body.pbR96ChoosingStore .pbR96StoreChooser::before{content:none!important;display:none!important}
html:is(.pb1126Desktop,.pb1126Embedded) body :is(#storePhotographerWorkspace,#pbR99LabChooser) :is(.pbR96StoreChooserHead,.pbR99LabIntro){height:auto!important;min-height:0!important;padding:18px 22px!important;margin-bottom:12px!important}
html body #pbR99LabChooser .pbR99LabIntroIcon{display:none!important}
`;
 fs.writeFileSync(cssFile,css);
}
function updateHtml(dir){if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())updateHtml(file);else if(entry.name.endsWith('.html')){const html=fs.readFileSync(file,'utf8');const next=html.replace(/(photobridge-(?:r1126-desktop-navigation\.(?:js|css)|v(?:81[3-8]|82[12])-[^"'<>\s?]+\.js))([^"'<>\s]*)/g,(_,name,query)=>{const clean=query.replace(/([?&])financeEntry=[^&]*/g,'$1').replace(/[?&]$/,'');return name+clean+(clean.includes('?')?'&':'?')+'financeEntry=r1308';});if(next!==html)fs.writeFileSync(file,next);}}}
updateHtml('dist/web');updateHtml('dist/api');
console.log('[PhotoBridge R1308] finance controls settle; desktop entry prepares reusable hidden panels.');
