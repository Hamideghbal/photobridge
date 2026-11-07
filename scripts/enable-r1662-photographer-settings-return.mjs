/* R1662: on Windows/desktop Photographer, cleanup the inline settings iframe
 * before navigating via the main header. R1126 intercepts window capture clicks
 * before R1635's document-capture handler sees them. Do not remap tabs.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const navFile=root+'/photobridge-r1126-desktop-navigation.js';
 const settingsFile=root+'/photobridge-r1635-photographer-inline-settings.js';
 let nav=fs.readFileSync(navFile,'utf8');
 let settings=fs.readFileSync(settingsFile,'utf8');
 const navAnchor='function navigate(key){';
 const settingsAnchor=' function open(key){';
 if(nav.split(navAnchor).length!==2||settings.split(settingsAnchor).length!==2
   ||!nav.includes("if(key==='print'){open(key);return;}")
   ||!settings.includes("panel?.remove();panel=null;selected='';")
   ||!settings.includes("document.documentElement.classList.remove('pb1635SettingsOpen')")
   ||!nav.includes("window.addEventListener('click',e=>{const b=e.target?.closest?.('[data-pb1126-kind]')"))
   throw Error('R1662 photographer navigation anchors: '+root);
 nav=nav.replace(navAnchor,navAnchor+"\n  // PB1662: close settings before showing this tab.\n  window.pb1635CloseInlineSettings?.();");
 settings=settings.replace(settingsAnchor," // PB1662: expose the existing full settings cleanup.\n window.pb1635CloseInlineSettings=close;\n"+settingsAnchor);
 fs.writeFileSync(navFile,nav);
 fs.writeFileSync(settingsFile,settings);
 execFileSync(process.execPath,['--check',navFile],{stdio:'inherit'});
 execFileSync(process.execPath,['--check',settingsFile],{stdio:'inherit'});
 const htmlFile=root+'/index.html';
 let html=fs.readFileSync(htmlFile,'utf8');
 let navCount=0,settingsCount=0;
 html=html.replace(/photobridge-r1126-desktop-navigation\.js\?[^"']*/g,u=>{navCount++;return u+'&closeSettings=r1662'});
 html=html.replace(/photobridge-r1635-photographer-inline-settings\.js\?[^"']*/g,u=>{settingsCount++;return u+'&closeSettings=r1662'});
 if(navCount!==1||settingsCount!==1)throw Error('R1662 cache refs '+root+' '+navCount+'/'+settingsCount);
 fs.writeFileSync(htmlFile,html);
 if(root.endsWith('lab-desktop-ui')){
  const mp=root+'/manifest.json';
  const m=JSON.parse(fs.readFileSync(mp,'utf8'));
  if(m.channel!=='lab'||m.protocol!==1||!Array.isArray(m.files))throw Error('R1662 native manifest invalid');
  for(const name of ['index.html','photobridge-r1126-desktop-navigation.js','photobridge-r1635-photographer-inline-settings.js']){
   let entry=m.files.find(e=>e.name===name);
   if(!entry){entry={name,url:'/lab-desktop-ui/'+name};m.files.push(entry);}
   entry.sha256=digest(fs.readFileSync(root+'/'+name));
  }
  m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  m.build=digest(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();
  fs.writeFileSync(mp,JSON.stringify(m));
 }
}
console.log('[R1662] Desktop Photographer closes Settings before printing or changing main tabs.');