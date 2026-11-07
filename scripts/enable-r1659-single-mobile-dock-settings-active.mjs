/* R1659 — install after R1658 and all older mobile navigation stages. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const cssName='photobridge-r1659-single-dock-settings-active.css';
const dockName='photobridge-r1598-photographer-mobile-invoice-dock.js';
const css=fs.readFileSync('scripts/r1659-single-dock-settings-active.css','utf8');
const boot=fs.readFileSync('scripts/r1659-photographer-dock-prepaint.js','utf8');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
execFileSync(process.execPath,['--check','scripts/r1659-photographer-dock-prepaint.js'],{stdio:'inherit'});
let dock=fs.readFileSync('dist/web/'+dockName,'utf8');
const before='const primary=current[0]||navs.find(visible)||navs[0];';
const after="const primary=[...current].reverse().find(nav=>nav.getAttribute('aria-label')==='ناوبری اصلی عکاس')||current.at(-1)||[...navs].reverse().find(visible)||navs.at(-1);";
if(dock.split(before).length!==2)throw Error('R1659 expected a single original mobile dock picker');
dock=dock.replace(before,after);
fs.writeFileSync('dist/web/'+dockName,dock);
execFileSync(process.execPath,['--check','dist/web/'+dockName],{stdio:'inherit'});
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const native=root.endsWith('lab-desktop-ui'),path=root+'/index.html';
 fs.writeFileSync(root+'/'+cssName,css);
 let html=fs.readFileSync(path,'utf8');
 if(!html.includes('<head>')||!html.includes('</head>')||html.includes('pb1659DockPrepaint'))throw Error('R1659 HTML head '+root);
 if(!native){
  const prepaint='<style id="pb1659DockPrepaintStyle">@media(max-width:820px){html.pb1659PhotographerDock body nav.photographerBottomAppNav:not([data-pb1659-primary="1"]),html.pb1659PhotographerDock body #photographerStoreBottomNav,html.pb1659PhotographerDock body nav.labMobileUtilityRail{display:none!important;visibility:hidden!important;pointer-events:none!important}}</style><script id="pb1659DockPrepaint">'+boot+'</script>';
  html=html.replace('<head>','<head>\n'+prepaint+'\n');
  let count=0;
  html=html.replace(/photobridge-r1598-photographer-mobile-invoice-dock\.js\?[^"']*/g,u=>{count++;return u+'&singleDock=r1659'});
  if(count!==1)throw Error('R1659 dock asset count '+count);
 }
 html=html.replace('</head>','<link rel="stylesheet" href="/'+cssName+'?v=r1659">\n</head>');
 fs.writeFileSync(path,html);
 if(native){
  const mp=root+'/manifest.json',m=JSON.parse(fs.readFileSync(mp,'utf8'));
  if(m.protocol!==1||m.channel!=='lab'||!Array.isArray(m.files))throw Error('R1659 native manifest');
  for(const name of ['index.html',cssName]){
   let entry=m.files.find(e=>e.name===name);
   if(!entry){entry={name,url:'/lab-desktop-ui/'+name};m.files.push(entry);}
   entry.sha256=hash(fs.readFileSync(root+'/'+name));
  }
  m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();
  fs.writeFileSync(mp,JSON.stringify(m));
 }
}
console.log('[R1659] Prevent transient double mobile dock and clear old active desktop tab during settings.');
