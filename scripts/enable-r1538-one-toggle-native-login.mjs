import fs from 'node:fs';
import crypto from 'node:crypto';
// R1538: one reveal/hide affordance, and a targeted native-login hot update.
// No full Windows UI rebuild: preserve every other file in the frozen package.
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const ownCss='photobridge-r1536-password-eye-brand.css';
const ownJs='photobridge-r1536-password-eye-brand.js';
const shared='photobridge-r1393-shared-account.js';
for(const htmlPath of [
 'dist/web/index.html','dist/web/account-recovery.html','dist/web/lab-login-security.html',
 'dist/api/equipment-rental-register.html','dist/api/equipment-rental-portal.html',
 'dist/api/equipment-rental-book.html','dist/api/admin-equipment-rental.html'
]){
 if(!fs.existsSync(htmlPath))continue;
 let html=read(htmlPath);
 for(const name of [ownCss,ownJs,shared]){
  html=html.replaceAll(name+'?v=r1537',name+'?v=r1538');
 }
 write(htmlPath,html);
}
// Windows: distribute the R1537 browser-only password-unification client to the
// existing native UI package. All old panels, CSS and installer versions stay fixed.
const native='dist/web/lab-desktop-ui',manifestPath=native+'/manifest.json';
if(!fs.existsSync(manifestPath))throw Error('R1538 laboratory native UI snapshot absent');
const manifest=JSON.parse(read(manifestPath));
if(manifest.channel!=='lab'||!Array.isArray(manifest.files))throw Error('R1538 invalid native manifest');
const nativeShared=native+'/'+shared,nativeIndex=native+'/index.html';
if(!fs.existsSync(nativeShared)||!fs.existsSync(nativeIndex))throw Error('R1538 lab native recovery or HTML file absent');
const webShared=read('dist/web/'+shared);
if(!webShared.includes('PB1537 conditional unification')||webShared.includes('let scheduled=false;')||webShared.includes('holder.className='))throw Error('R1538 browser conditional login not ready');
write(nativeShared,webShared);
let index=read(nativeIndex);
if(!index.includes('/'+shared))throw Error('R1538 Windows entry missing shared account client');
index=index.replaceAll(shared+'?v=r1393',shared+'?v=r1538').replaceAll(shared+'?v=r1537',shared+'?v=r1538');
write(nativeIndex,index);
for(const name of [shared,'index.html']){
 const entry=manifest.files.find(f=>f.name===name);
 if(!entry||entry.url!=='/lab-desktop-ui/'+name)throw Error('R1538 Windows manifest missing '+name);
 entry.sha256=sha(fs.readFileSync(native+'/'+name));
}
manifest.generatedAt=new Date().toISOString();
manifest.build=sha(Buffer.from(JSON.stringify(manifest.files)));
write(manifestPath,JSON.stringify(manifest));
console.log('[PhotoBridge R1538] native lab login refreshed without touching other Windows UI assets',manifest.build.slice(0,12));
