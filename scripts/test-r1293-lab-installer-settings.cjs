const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Lab Windows installer link is settings-only, never a global page banner',()=>{
 const html=fs.readFileSync('dist/web/index.html','utf8');
 const link=fs.readFileSync('dist/web/photobridge-r1293-lab-installer-in-settings.js','utf8');
 assert.match(html,/photobridge-r1293-lab-installer-in-settings\.js\?v=r1293/);
 assert.doesNotMatch(html,/photobridge-r1292-lab-windows-download-shortcut\.(?:js|css)/);
 assert(!fs.existsSync('dist/web/photobridge-r1292-lab-windows-download-shortcut.js'));
 assert(!fs.existsSync('dist/web/photobridge-r1292-lab-windows-download-shortcut.css'));
 assert.match(link,/location\.pathname!==['"]\/lab\/settings\/windowsAlert['"]/);
 assert.match(link,/\.windowsAlertSimplePanel/);
 assert.match(link,/\.windowsAlertSimpleInstall/);
 assert.match(link,/برنامهٔ آفلاین لابراتوار/);
 assert.match(link,/دریافت پکیج نصب ویندوز/);
 assert.match(link,/href='\/lab-windows-download.html'/);
 assert.match(link,/link\.hidden=!nativeButton\.disabled/);
 new Function(link);
});
test('Existing native installer is not bypassed; status page does not fake download',()=>{
 const page=fs.readFileSync('dist/web/lab-windows-download.html','utf8');
 const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 assert(bundle.includes('"/api/lab/desktop-installer/status"'));
 assert(bundle.includes('disabled:!(v!=null&&v.available)'));
 assert(bundle.includes('onClick:()=>location.assign("/api/lab/desktop-installer")'));
 assert(page.includes('/api/lab/desktop-installer/status'));
 assert(page.includes('if(info.available===true)'));
 const s=page.match(/<script>([\s\S]*?)<\/script>/);
 assert(s,'missing status page browser script');
 new Function(s[1]);
});
