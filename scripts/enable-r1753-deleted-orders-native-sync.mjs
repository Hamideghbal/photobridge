// R1753: reconcile cancelled orders after a live refresh, keeping downloaded files.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const bundle='assets/index-UIRefine-v655-r84.js';
// R1631 wraps the active live queue with a transition-preserving state setter.\n// Match that actual post-build code rather than the removed pre-R1631 setter.\nconst old="f(previous=>window.pb1631PreserveExits?.((data.orders||[]).filter(row=>String(row.mode||'print')===o),previous)||(data.orders||[]).filter(row=>String(row.mode||'print')===o));";\nconst fresh="f(previous=>window.pb1631PreserveExits?.(pb1753VisibleLabOrders(data.orders||[],o),previous)||pb1753VisibleLabOrders(data.orders||[],o));";
const helper="function pb1753VisibleLabOrders(rows,mode){return (Array.isArray(rows)?rows:[]).filter(row=>row&&String(row.mode||'print')===mode&&!['cancelled','canceled','deleted'].includes(String(row.status||'').toLowerCase())&&!row.deleted_at);}";
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const uiFile=root+'/'+bundle,indexFile=root+'/index.html';
 if(!fs.existsSync(uiFile)||!fs.existsSync(indexFile))throw Error('[R1753] lab UI missing: '+root);
 let ui=fs.readFileSync(uiFile,'utf8');
 if(!ui.includes('/* PB1753 deleted order reconciliation */')){
  if(ui.split(old).length!==2)throw Error('[R1753] R1631 live queue reconciliation anchor changed in '+root);
  if(!ui.includes('setInterval(refresh,3000)'))throw Error('[R1753] live Lab queue polling missing in '+root);
  ui=ui.replace(old,fresh)+'\n'+helper+'\n/* PB1753 deleted order reconciliation */\n';
  fs.writeFileSync(uiFile,ui);
 }
 execFileSync(process.execPath,['--check',uiFile],{stdio:'inherit'});
 let html=fs.readFileSync(indexFile,'utf8');
 const pattern=/assets\/index-UIRefine-v655-r84\.js\?[^"'<>\s]*/g;
 const links=[...html.matchAll(pattern)];
 if(links.length!==1)throw Error('[R1753] expected one Lab bundle URL in '+root);
 html=html.replace(pattern,value=>value.includes('&deletedOrders=r1756')?value:value+'&deletedOrders=r1756');
 fs.writeFileSync(indexFile,html);
 const manifestFile=root+'/manifest.json';
 if(fs.existsSync(manifestFile)){
  const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
  if(!Array.isArray(manifest.files)||manifest.channel!=='lab')throw Error('[R1753] Lab UI manifest incompatible');
  for(const item of [bundle,'index.html']){
   const entry=manifest.files.find(row=>row.name===item);
   if(!entry)throw Error('[R1753] Lab manifest record missing: '+item);
   entry.sha256=sha(fs.readFileSync(root+'/'+item));
  }
  manifest.build=sha(Buffer.from(JSON.stringify(manifest.files)));
  manifest.generatedAt=new Date().toISOString();
  fs.writeFileSync(manifestFile,JSON.stringify(manifest));
 }
}
console.log('[R1756] Site and Windows Lab queues reconcile cancelled/deleted orders while preserving R1631 transitions and downloaded files.');
