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
 const nav=fs.readFileSync(navPath,'utf8');
 if(nav.includes('/* PB1648 stable print header */')||
    nav.includes('/* PB1653 stable desktop photographer */')||
    nav.includes('live[index]?.click()'))
  throw Error('R1655 unsafe photographer navigation still present: '+root);
 if(!nav.includes('copy.onclick=()=>{press(copy);original.click()')||
    !nav.includes("if(utilities){const separator="))
  throw Error('R1655 expected R1632 direct routing missing: '+root);
 execFileSync(process.execPath,['--check',navPath],{stdio:'inherit'});
 const index=root+'/index.html';
 let html=fs.readFileSync(index,'utf8');
 let navCount=0,settingsCount=0;
 html=html.replace(/photobridge-r1126-desktop-navigation\.js\?[^"']*/g,url=>{
  navCount++;
  return url.includes('routing=r1655')?url:url+'&routing=r1655';
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
