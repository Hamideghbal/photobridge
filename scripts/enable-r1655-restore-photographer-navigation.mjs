/* R1655: force a fresh version of the restored native photographer navigation.
 * R1648+R1653 broke clone-to-source tab click mapping. Earlier patch stages
 * now keep original direct onclick handlers, and R1653 is skipped entirely.
 * Native updater and browser must not reuse cached broken script URLs.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const navPath=root+'/photobridge-r1126-desktop-navigation.js';
 let nav=fs.readFileSync(navPath,'utf8');
 if(nav.includes('/* PB1648 stable print header */')||
    nav.includes('/* PB1653 stable desktop photographer */')||
    nav.includes('live[index]?.click()'))
  throw Error('R1655 unsafe photographer navigation still present: '+root);
 // R1632's desktop utility grouping may have been overwritten by a later
 // generated header. Restore that known pre-R1632 shape only, not arbitrary JS.
 const oldUtilities="if(utilities){for(const cls of ['finance','archive']){const b=utilities.querySelector('.'+cls);if(b)utilities.append(b);}}";
 const restoredUtilities="if(utilities){const separator=document.createElement('span');separator.className='pb1632ModeDivider';separator.setAttribute('aria-hidden','true');modes.append(separator);for(const cls of ['finance','archive']){const b=utilities.querySelector('.'+cls);if(b)modes.append(b)}utilities.remove();}";
 const hasDivider=()=>nav.includes('pb1632ModeDivider')&&nav.includes('modes.append(separator)')&&nav.includes('modes.append(b)')&&nav.includes('utilities.remove()');
 if(!hasDivider()&&nav.includes(oldUtilities)){
  nav=nav.replace(oldUtilities,restoredUtilities);
  fs.writeFileSync(navPath,nav);
 }
 // Guard behavior and structure, not exact formatting of a generated
 // onclick expression. The proxy must click its own source element.
 const directProxy=/copy\.onclick\s*=\s*\(\)\s*=>\s*\{[^}]{0,600}original\.click\(\)/.test(nav);
 // A finance deep-link may be navigated inside the existing print iframe
 // without retaining pbDesktopContent=1. Never create a second desktop chrome
 // inside the parent desktop chrome. This is a route-level, not visual, guard.
 const inlineStart="const query=new URLSearchParams(location.search);"+String.fromCharCode(10)+" if(query.get('pbDesktopContent')==='1')";
 const inlineNext=`const query=new URLSearchParams(location.search);
 /* PB1656 embedded invoice link guard */
 let embeddedHost=false;
 try{
  embeddedHost=window.parent!==window&&
   Boolean(window.frameElement?.closest('.pb1126ContentPanel[data-panel="print"],.pb1126ContentPanel[data-panel="store"]'))&&
   window.parent.document.documentElement.classList.contains('pb1126Desktop');
 }catch{}
 if(query.get('pbDesktopContent')==='1'||embeddedHost)`;
 if(!nav.includes('/* PB1656 embedded invoice link guard */')){
  if(!nav.includes(inlineStart))throw Error('R1656 expected photographer embedded bootstrap missing: '+root);
  nav=nav.replace(inlineStart,inlineNext);
  fs.writeFileSync(navPath,nav);
 }
 const thirdHeader=nav.includes('pb1632FinanceTabs')&&nav.includes('financeThird');
 if(!directProxy||!hasDivider()||!thirdHeader)
  throw Error('R1655 navigation contract '+root+' directProxy='+directProxy+' divider='+hasDivider()+' financeThird='+thirdHeader);
 execFileSync(process.execPath,['--check',navPath],{stdio:'inherit'});
 const index=root+'/index.html';
 let html=fs.readFileSync(index,'utf8');
 let navCount=0,settingsCount=0;
 html=html.replace(/photobridge-r1126-desktop-navigation\.js\?[^"']*/g,url=>{
  navCount++;
  const stable=url.includes('routing=r1655')?url:url+'&routing=r1655';
  return stable.includes('embeddedChrome=r1656')?stable:stable+'&embeddedChrome=r1656';
 });
 html=html.replace(/photobridge-r1635-photographer-inline-settings\.js\?[^"']*/g,url=>{
  settingsCount++;
  return url.includes('settingsRollback=r1655')?url:url+'&settingsRollback=r1655';
 });
 if(navCount!==1||settingsCount!==1)throw Error('R1655 cache-bust script count '+root+' '+navCount+'/'+settingsCount);
 if(html.includes('speed=r1653')||html.includes('stable=r1653')||html.includes('pb1653FirstPaint'))
  throw Error('R1655 R1653 assets still served: '+root);
 fs.writeFileSync(index,html);
 if(root.endsWith('/lab-desktop-ui')){
  const manifestPath=root+'/manifest.json';
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  if(manifest.protocol!==1||manifest.channel!=='lab'||!Array.isArray(manifest.files))
   throw Error('R1655 unsupported native manifest');
  for(const name of ['index.html','photobridge-r1126-desktop-navigation.js','photobridge-r1635-photographer-inline-settings.js']){
   let row=manifest.files.find(file=>file.name===name);
   if(!row){row={name,url:'/lab-desktop-ui/'+name};manifest.files.push(row);}
   row.sha256=digest(fs.readFileSync(root+'/'+name));
  }
  manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  manifest.build=digest(JSON.stringify(manifest.files));
  manifest.generatedAt=new Date().toISOString();
  fs.writeFileSync(manifestPath,JSON.stringify(manifest));
 }
}
console.log('[R1655] Restored direct photographer tab click mapping; forced new cache revision on web and native.');
