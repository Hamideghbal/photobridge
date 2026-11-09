// R1720: mobile Print chooser isolation and invitation-origin entry routing.
// Apply at the very end of the Docker build, AFTER desktop UI snapshots exist.
// No native Windows, API, payments, or desktop CSS/JS is modified.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const one=(source,needle,replacement,what)=>{
  const count=source.split(needle).length-1;
  if(count!==1)throw Error('[R1720] '+what+' anchor count '+count);
  return source.replace(needle,replacement);
};
const routeFile='dist/web/photobridge-r100f5-entry-routing.js';
let route=fs.readFileSync(routeFile,'utf8');
const routeOld=[
  '      // Gallery is the default entry tab for every photographer account.',
  "      done=true;location.replace('/photographer/gallery');"
].join('\n');
const routeNew=[
  '      // R1720: the server reports the ORIGINAL accepted invitation origin.',
  '      // Keep all desktop routes unchanged; only mobile first entry uses it.',
  "      let destination='/photographer/gallery';",
  "      if(window.matchMedia?.('(max-width:820px)')?.matches){",
  '        const context=await r.json().catch(()=>({}));',
  "        if(context?.destination==='lab')destination='/photographer/orders/flow?workspace=print&pbLabChooser=1';",
  "        else if(context?.destination==='rental')destination='/equipment-rental/book?pbStoreChooser=1';",
  '      }',
  '      done=true;location.replace(destination);'
].join('\n');
if(!route.includes('R1720: the server reports'))route=one(route,routeOld,routeNew,'first-entry origin');
fs.writeFileSync(routeFile,route);
execFileSync(process.execPath,['--check',routeFile],{stdio:'inherit'});

const chooserFile='dist/web/photobridge-v904r99-lab-chooser.js';
let chooser=fs.readFileSync(chooserFile,'utf8');
// The chooser refreshes on visibility/focus and explicit collaboration events.
// Expensive automatic directory refresh every 8 seconds is unnecessary on mobile.
const refreshOld="setInterval(()=>{if(!document.hidden&&isPrintRoute()&&document.getElementById(ROOT_ID))void run(false,true)},8000);";
const refreshNew="setInterval(()=>{if(!document.hidden&&isPrintRoute()&&document.getElementById(ROOT_ID))void run(false,true)},window.matchMedia?.('(max-width:820px)')?.matches?30000:8000);";
if(!chooser.includes("matches?30000:8000"))chooser=one(chooser,refreshOld,refreshNew,'mobile lab-directory refresh');
fs.writeFileSync(chooserFile,chooser);
execFileSync(process.execPath,['--check',chooserFile],{stdio:'inherit'});

const orderFile='dist/web/photobridge-r1122-mobile-print-orders.js';
let orders=fs.readFileSync(orderFile,'utf8');
const orderOld="    const old=document.getElementById(id);";
const orderNew=[
  orderOld,
  '    // R1720: do not build or update an invisible status rail behind the mobile chooser.',
  "    if(document.body.classList.contains('pbR100F14ChoosingLab')){old?.remove();return;}"
].join('\n');
if(!orders.includes('R1720: do not build'))orders=one(orders,orderOld,orderNew,'hidden order-status work');
const scheduleOld="  function schedule(){\n    if(scheduled)return;";
const scheduleNew="  function schedule(){\n    // R1720: pause whole-body status scanning while the chooser is visible.\n    if(document.body.classList.contains('pbR100F14ChoosingLab')&&!document.getElementById(id))return;\n    if(scheduled)return;";
if(!orders.includes('R1720: pause whole-body'))orders=one(orders,scheduleOld,scheduleNew,'chooser status observer work');
fs.writeFileSync(orderFile,orders);
execFileSync(process.execPath,['--check',orderFile],{stdio:'inherit'});

const css=fs.readFileSync('scripts/r1720-mobile-print-chooser.css.txt','utf8');
const cssFile='dist/web/photobridge-r1720-mobile-print-chooser.css';
fs.writeFileSync(cssFile,css);
const htmlFile='dist/web/index.html';
let html=fs.readFileSync(htmlFile,'utf8');
if(html.split('photobridge-r100f5-entry-routing.js').length!==2)throw Error('[R1720] entry script must be linked once');
html=html.replace(/(photobridge-r100f5-entry-routing\.js\?v=)[^&"'\s]+/,'$1r1720');
if(!html.includes('photobridge-r1720-mobile-print-chooser.css')){
 html=one(html,'</head>','<link rel="stylesheet" href="/photobridge-r1720-mobile-print-chooser.css?v=r1720">\n</head>','mobile-only stylesheet');
}
fs.writeFileSync(htmlFile,html);
console.log('[R1720] Mobile chooser print-status isolation, lighter refresh and invitation-based entry ready; desktop snapshots untouched.');
