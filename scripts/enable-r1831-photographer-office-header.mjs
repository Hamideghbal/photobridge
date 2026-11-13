/* R1831: photographer camera Store and Office ONLY; lab, frame/chassis and admin unaffected. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
function once(s,from,to,label){const n=s.split(from).length-1;if(n!==1)throw Error('[R1831] '+label+' anchor count '+n);return s.replace(from,to)}
let nav=read('dist/web/photobridge-r1126-desktop-navigation.js');
nav=once(nav,
 "const sources=choosing?[]:active==='store'?[...native.querySelectorAll('#pbR1123StoreDesktopNav>button')]:",
 "const sources=choosing?[]:active==='store'?[...(doc?.querySelectorAll('#pbR1123StoreDesktopNav>button')||[])]:",
 'store tabs read from iframe');
nav=once(nav,
 "const cameraStoreControls=cameraStore?visible.filter(el=>el.dataset.storePanel!=='salesPanel'):[];",
 "const cameraStoreControls=cameraStore?visible:[];",
 'restore sale panel tab');
const a=nav.indexOf('    // Camera/photo-video store: bring the REAL category action up beside cart.');
const b=nav.indexOf('    row.append(title,nav,cart);',a);
if(a<0||b<=a)throw Error('[R1831] camera-only cart/category block not found');
nav=nav.slice(0,a)+
 "    // Camera Store header contains navigation ONLY; real cart and filters are in Sales.\n"+
 "    if(cameraStore)row.append(nav);\n"+
 "    else row.append(title,nav,cart);"+
 nav.slice(b+'    row.append(title,nav,cart);'.length);
nav=once(nav,
 "const labels={equipmentPanel:'اجاره تجهیزات',bookingsPanel:'آفیش‌های من',financePanel:'مالی'};",
 "const labels={equipmentPanel:'اجاره تجهیزات',salesPanel:'فروش تجهیزات',bookingsPanel:'آفیش‌های من',financePanel:'مالی'};",
 'sale tab label');
new Function(nav);
write('dist/web/photobridge-r1126-desktop-navigation.js',nav);
let css=read('dist/web/photobridge-r1126-desktop-navigation.css');
const cameraCss=read('scripts/r1831-photographer-store-header.css');
if(css.includes('/* R1831: the camera photographer'))throw Error('[R1831] CSS already applied');
write('dist/web/photobridge-r1126-desktop-navigation.css',css+'\n'+cameraCss);
let office=read('dist/web/photobridge-r63-photographer-store.js');
const start=office.indexOf('  function openOffice(){'),end=office.indexOf('  function rentalIntro()',start);
if(start<0||end<=start)throw Error('[R1831] Office function missing');
office=office.slice(0,start)+read('scripts/r1831-photographer-office-function.js.txt')+office.slice(end);
new Function(office);
write('dist/web/photobridge-r63-photographer-store.js',office);
function bust(path){
 let html=read(path);
 for(const asset of ['photobridge-r1126-desktop-navigation.js','photobridge-r1126-desktop-navigation.css']){
  const re=new RegExp('('+asset.replace(/[.]/g,'\\.')+'\\?[^"\\x27]+)(["\\x27])','g');
  const hits=[...html.matchAll(re)];
  if(hits.length!==1)throw Error('[R1831] '+path+' cache anchor '+asset+' count '+hits.length);
  html=html.replace(re,(_,v,end)=>v+'&r1831=1'+end);
 }
 if(path==='dist/api/equipment-rental-book.html'){
  html=once(html,'photobridge-r63-photographer-store.js?v=r1130','photobridge-r63-photographer-store.js?v=r1130&r1831=1','calendar JS cache');
  html=once(html,'photobridge-r63-photographer-store.css?v=100f13','photobridge-r63-photographer-store.css?v=100f13&r1831=1','calendar CSS cache');
 }
 write(path,html);
}
bust('dist/web/index.html');
bust('dist/api/equipment-rental-book.html');
for(const file of ['dist/web/photobridge-r1126-desktop-navigation.js','dist/web/photobridge-r63-photographer-store.js'])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('[R1831] photographer camera sales tab restored, second header uncluttered, Office date confirmation wired.');
