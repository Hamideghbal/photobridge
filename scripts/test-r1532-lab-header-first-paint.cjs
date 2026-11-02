const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('website header initializes before React and transforms the first header before paint',()=>{
 const html=fs.readFileSync('dist/web/index.html','utf8'),js=fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.js','utf8');
 const tags=[...html.matchAll(/<script\b[^>]*src="\/photobridge-r1147-lab-admin-header\.js[^>]*>/g)];
 assert.equal(tags.length,1);assert(!/\b(?:defer|async|type=)/.test(tags[0][0]));
 assert(tags[0].index<html.indexOf('type="module"'));
 assert(js.includes('/* PB1532 early header observer */start();'));
 assert(js.includes('observe(document.documentElement,'));
 assert(js.includes("if(media.matches&&initial?.querySelector('.settingsIconBtn,.mobileHeaderSettings')){render();return;}"));
 assert(!js.includes("document.addEventListener('DOMContentLoaded',start"));
});
test('startup transform runs after immutable native snapshots and is idempotent',async()=>{
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.lastIndexOf('enable-r1532-')>build.lastIndexOf('prepare-lab-desktop-ui.mjs'));
 assert(!fs.readFileSync('dist/web/lab-desktop-ui/index.html','utf8').includes('r1532-first-paint'));
 for(const snapshot of ['lab-desktop-ui','desktop-ui']){
  assert(!fs.readFileSync('dist/web/'+snapshot+'/photobridge-r1147-lab-admin-header.js','utf8').includes('PB1532 early header observer'));
 }
 const before=[fs.readFileSync('dist/web/index.html','utf8'),fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.js','utf8')];
 await import('../scripts/enable-r1532-lab-header-first-paint.mjs?test');
 assert.deepEqual([fs.readFileSync('dist/web/index.html','utf8'),fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.js','utf8')],before);
});
