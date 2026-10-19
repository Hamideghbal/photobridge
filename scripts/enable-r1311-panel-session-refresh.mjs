import fs from 'node:fs';
import path from 'node:path';
const file='dist/web/photobridge-r1126-desktop-navigation.js';
let source=fs.readFileSync(file,'utf8');
if(!source.includes('/* PB1311 panel document lifecycle */')){
 const replace=(from,to)=>{if(source.split(from).length!==2)throw Error('R1311 anchor missing: '+from.slice(0,90));source=source.replace(from,to);};
 replace(' let warmQueued=false,warmEpoch=0;',` /* PB1311 panel document lifecycle */
 let panelSessionReady=document.body?.classList.contains('pbAuthenticatedPhotographerPortal')===true;
 let pendingPanel=null;
 let warmQueued=false,warmEpoch=0;
 function clearPanelDocuments(){
  warmEpoch++;warmQueued=false;closePanels();
  for(const p of panels.values())p.remove();panels.clear();
  if(utilityPanel){utilityPanel.hidden=true;document.body.style.overflow=utilityPreviousOverflow;}
  for(const f of utilityFrames.values())f.remove();utilityFrames.clear();
 }
 function resumePanelDocuments(){
  if(!panelSessionReady){const requested=pendingPanel||selected||new URLSearchParams(location.search).get('pbDesktopPanel');clearPanelDocuments();panelSessionReady=true;pendingPanel=null;if(['print','store'].includes(requested))open(requested,false);}
  queueWarmPanels();
 }`);
 replace('if(warmQueued||!authenticated||document.hidden', 'if(warmQueued||!panelSessionReady||!authenticated||document.hidden');
 replace(' function open(key,push=true){\n  if(selected===key)return;', ' function open(key,push=true){\n  if(!panelSessionReady){pendingPanel=key;return;}\n  if(selected===key)return;');
 replace("if(e.detail?.labRole==='customer'){authenticated=true;void refreshWallet();return;}if(!authenticated)return;authenticated=false;warmEpoch++;warmQueued=false;walletBalance=null;", "if(e.detail?.labRole==='customer'){authenticated=true;resumePanelDocuments();void refreshWallet();return;}panelSessionReady=false;pendingPanel=null;authenticated=false;clearPanelDocuments();walletBalance=null;");
 fs.writeFileSync(file,source);
}
function refresh(dir){if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())refresh(f);else if(e.name.endsWith('.html')){const s=fs.readFileSync(f,'utf8');const n=s.replace(/(photobridge-r1126-desktop-navigation\.js)([^"'<>\s]*)/g,(_,name,q)=>{const clean=q.replace(/([?&])panelSession=[^&]*/g,'$1').replace(/[?&]$/,'');return name+clean+(clean.includes('?')?'&':'?')+'panelSession=r1311';});if(n!==s)fs.writeFileSync(f,n);}}}
refresh('dist/web');refresh('dist/api');
console.log('[PhotoBridge R1311] refresh embedded panel documents after login; no pre-login cached frames.');
