const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('R1844: original R1838 bridge-and-shutter animated splash is the only active web launch',()=>{
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert.equal((html.match(/id="pbR1361MobileSplash"/g)||[]).length,1);
 assert(html.includes('data-launch="r1838-user"'),'original animation not mounted');
 assert(html.includes('id="pb1838Userring"')&&html.includes('id="pb1838Userdeck"'),'bridge and shutter animation lost');
 assert(html.includes('id="pb1838Userblade0"')&&html.includes('id="pb1838Userblade5"'),'shutter blades lost');
 assert(html.includes('id="pb1479ApprovedLaunch"'),'approved animation styles lost');
 assert(html.includes('pb1838LaunchLeaving'),'finish animation lost');
 assert(!html.includes('id="pb-splash"'),'R1842 blue splash must be absent');
 assert(!html.includes('id="pb1842SplashPrepaint"'),'blue prepaint must be absent');
 assert(!html.includes('id="pb1842SplashRuntime"'),'blue runtime must be absent');
 assert(!html.includes('id="pb1842BlueSplashStyle"'),'blue style must be absent');
 assert(html.includes('photobridge-r1841-login-blue.css'),'blue login palette must remain');
 assert(html.includes('photobridge-r1776-login-password-clearance.css'),'password clearance must remain');
 assert(html.includes('id="root"'),'React app root must remain');
});

test('R1844: install manifest and release pipeline do not bring back blue splash',()=>{
 const manifest=JSON.parse(fs.readFileSync('dist/web/photobridge.webmanifest','utf8'));
 assert.equal(manifest.background_color,'#F7F1E7');
 assert.equal(manifest.theme_color,'#F7F1E7');
 assert.equal(manifest.id,'/photobridge-pwa');
 assert(manifest.icons.every(icon=>icon.src.includes('r1838.png')),'original app icon restored');
 const pipeline=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(pipeline.includes('enable-r1838-unified-launch.mjs'));
 assert(pipeline.includes('test-r1838-user-launch.cjs'));
 assert(!pipeline.includes('enable-r1842-blue-splash.mjs'));
 assert(!pipeline.includes('test-r1842-blue-splash.cjs'));
 assert(!pipeline.includes('test-r1843-splash-gpu-audit.cjs'));
});
