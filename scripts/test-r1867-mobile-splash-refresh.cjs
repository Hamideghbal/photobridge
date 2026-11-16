'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const hash=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

test('R1867: existing installed PWA keeps identity/standalone while receiving a refreshed cream splash',()=>{
 const manifest=JSON.parse(fs.readFileSync('dist/web/photobridge.webmanifest','utf8'));
 assert.equal(manifest.id,'/photobridge-pwa');
 assert.equal(manifest.name,'PhotoBridge');
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.start_url,'/');
 assert.equal(manifest.background_color,'#F7F1E6');
 assert.equal(manifest.theme_color,'#F7F1E6');
 assert.deepEqual(manifest.icons.map(i=>i.purpose),['any','maskable','any','maskable']);
 assert(manifest.icons.every(i=>/^\/photobridge-app-(192|512)-r1867\.png$/.test(i.src)));
 for(const size of [192,512])
  assert.equal(hash('dist/web/photobridge-app-'+size+'-r1867.png'),
    hash('dist/web/photobridge-app-'+size+'-r1838.png'),
    'do not replace approved emblem or introduce an unrelated logo');
 assert(manifest.related_applications.some(a=>a.platform==='webapp'&&a.url.includes('photobridge.webmanifest?v=r1867')));
});
test('R1867: preserve one animated cream web splash and no duplicate blue overlay',()=>{
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert.equal((html.match(/id="pbR1361MobileSplash"/g)||[]).length,1);
 assert(html.includes('data-launch="r1838-user"'));
 assert(html.includes('id="pb1838Userring"'));
 assert(html.includes('id="pb1838Userblade5"'));
 assert(!html.includes('id="pb-splash"'));
 assert(!html.includes('id="pb1842SplashRuntime"'));
 assert(!html.includes('id="pb1842SplashPrepaint"'));
 assert(html.includes('photobridge.webmanifest?v=r1867'));
 assert(!html.includes('photobridge.webmanifest?v=r1838'));
 assert(html.includes('photobridge-r1841-login-blue.css'),'login palette must remain intact');
 assert(html.includes('id="root"'),'React app still mounts');
});
test('R1867: avoid touching upload/order/login code and preserve launch source',()=>{
 const script=fs.readFileSync('scripts/enable-r1867-mobile-splash-refresh.mjs','utf8');
 assert(script.includes("refreshedCream='#F7F1E6'"));
 assert(!script.includes('display=\"browser\"'));
 const style=fs.readFileSync('scripts/r1838-unified-launch.css','utf8');
 assert(style.includes('#F7F1E7'));
 assert(style.includes('pb1838Loading'));
 const pipeline=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(pipeline.indexOf("enable-r1838-unified-launch.mjs") <
        pipeline.indexOf("enable-r1867-mobile-splash-refresh.mjs"));
 assert(pipeline.indexOf("test-r1844-restore-animated-launch.cjs") <
        pipeline.indexOf("enable-r1867-mobile-splash-refresh.mjs"));
});
