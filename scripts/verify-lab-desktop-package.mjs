import fs from 'node:fs';
import path from 'node:path';
const required=[
 'apps/lab-desktop/package.json','apps/lab-desktop/package-lock.json','apps/lab-desktop/main.cjs','apps/lab-desktop/host.cjs','apps/lab-desktop/store.cjs','apps/lab-desktop/sync.cjs','apps/lab-desktop/ui-update.cjs','apps/lab-desktop/desktop-overlay.js','dist/web/lab-desktop-ui/manifest.json','dist/web/photobridge-admin-lab-desktop-release-v72.js'
];
for(const f of required)if(!fs.existsSync(f))throw new Error('Missing new Lab Desktop file: '+f);
for(const old of ['dist/private-downloads/lab-desktop.json','dist/private-downloads/Install.vbs','dist/private-downloads/Install.cmd','dist/private-downloads/Install.ps1','dist/api/labDesktopDownload.js'])if(fs.existsSync(old))throw new Error('Old Lab Desktop artifact still present: '+old);
const pkg=JSON.parse(fs.readFileSync('apps/lab-desktop/package.json','utf8'));
if(pkg.name!=='photobridge-lab-desktop'||pkg.build?.appId!=='ir.photobridge.lab')throw new Error('Invalid Lab Desktop package identity');
const server=fs.readFileSync('dist/api/server.js','utf8');
for(const marker of ['/api/admin/lab-desktop-release','/api/admin/lab-desktop-release/upload','/api/lab/desktop-installer','/api/lab/desktop-ui-manifest','LAB_DESKTOP_RELEASE_SETTING_KEY'])if(!server.includes(marker))throw new Error('Lab Desktop server marker missing: '+marker);
const index=fs.readFileSync('dist/web/index.html','utf8');if(!index.includes('/photobridge-admin-lab-desktop-release-v72.js'))throw new Error('Admin Lab Desktop uploader not mounted');
const manifest=JSON.parse(fs.readFileSync('dist/web/lab-desktop-ui/manifest.json','utf8'));if(manifest.protocol!==1||!Array.isArray(manifest.files)||!manifest.files.some(x=>x.name==='index.html'))throw new Error('Invalid Lab Desktop UI manifest');
console.log(`[PhotoBridge] New Lab Desktop ${pkg.version} verified; legacy installer removed, managed uploader and UI update enabled.`);
