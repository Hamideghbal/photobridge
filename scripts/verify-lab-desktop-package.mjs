import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const required=[
 'apps/lab-desktop/desktop-overlay.js','dist/web/lab-desktop-ui/manifest.json','dist/web/photobridge-admin-lab-desktop-release-v72.js'
];
for(const f of required)if(!fs.existsSync(f))throw new Error('Missing new Lab Desktop file: '+f);
for(const old of ['dist/private-downloads/lab-desktop.json','dist/private-downloads/Install.vbs','dist/private-downloads/Install.cmd','dist/private-downloads/Install.ps1','dist/api/labDesktopDownload.js'])if(fs.existsSync(old))throw new Error('Old Lab Desktop artifact still present: '+old);
// Installer sources live outside the slim deployment repository. Validate them
// when present; the server/uploader and generated UI payload are always required.
if(fs.existsSync('apps/lab-desktop/package.json')){
 const pkg=JSON.parse(fs.readFileSync('apps/lab-desktop/package.json','utf8'));
 if(pkg.name!=='photobridge-lab-desktop'||pkg.build?.appId!=='ir.photobridge.lab')throw new Error('Invalid Lab Desktop package identity');
 for(const name of ['package-lock.json','main.cjs','host.cjs','store.cjs','sync.cjs','ui-update.cjs'])if(!fs.existsSync('apps/lab-desktop/'+name))throw new Error('Incomplete Lab Desktop source package: '+name);
}
const server=fs.readFileSync('dist/api/server.js','utf8');
for(const marker of ['/api/admin/lab-desktop-release','/api/admin/lab-desktop-release/upload','/api/lab/desktop-installer','/api/lab/desktop-ui-manifest','LAB_DESKTOP_RELEASE_SETTING_KEY'])if(!server.includes(marker))throw new Error('Lab Desktop server marker missing: '+marker);
const index=fs.readFileSync('dist/web/index.html','utf8');if(!index.includes('/photobridge-admin-lab-desktop-release-v72.js'))throw new Error('Admin Lab Desktop uploader not mounted');
const manifest=JSON.parse(fs.readFileSync('dist/web/lab-desktop-ui/manifest.json','utf8'));if(manifest.protocol!==1||!Array.isArray(manifest.files)||!manifest.files.some(x=>x.name==='index.html'))throw new Error('Invalid Lab Desktop UI manifest');
if(manifest.channel!=='lab'||!manifest.files.some(x=>x.name==='desktop-overlay.js'))throw new Error('Lab Desktop channel/overlay missing');
const root=path.resolve('dist/web/lab-desktop-ui');
const names=new Set();
for(const entry of manifest.files){
 const file=path.resolve(root,entry.name);
 if(!file.startsWith(root+path.sep)||names.has(entry.name))throw new Error('Invalid/duplicate Lab Desktop UI path: '+entry.name);
 names.add(entry.name);
 if(entry.url!=='/lab-desktop-ui/'+entry.name)throw new Error('Invalid Lab Desktop UI URL: '+entry.name);
 const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 if(hash!==entry.sha256)throw new Error('Lab Desktop UI checksum mismatch: '+entry.name);
}
const build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
if(build!==manifest.build)throw new Error('Lab Desktop UI build checksum mismatch');
console.log(`[PhotoBridge] Lab Desktop deployment verified: ${manifest.files.length} checksummed UI files, managed uploader and legacy installer removal.`);
