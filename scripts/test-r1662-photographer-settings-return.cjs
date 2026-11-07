'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
test('R1662 main tabs close settings first, without changing source tab handlers',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const nav=fs.readFileSync(root+'/photobridge-r1126-desktop-navigation.js','utf8');
  const settings=fs.readFileSync(root+'/photobridge-r1635-photographer-inline-settings.js','utf8');
  const injected=nav.indexOf('/* PB1668 close settings before desktop header click */');
  const closure=nav.indexOf('window.pb1635CloseInlineSettings?.();',injected);
  const originalNav=nav.indexOf("window.addEventListener('click',e=>{const b=e.target?.closest?.('[data-pb1126-kind]')");
  assert(injected>=0&&closure>injected,root+' must register early settings cleanup');
  if(originalNav>=0)assert(closure<originalNav,root+' settings cleanup must capture before nav');
  // R1655 already validates the direct source-click contract. Earlier
  // transformers may change the proxy's visual press animation or spacing.
  // Verify behavior instead of requiring that old literal implementation.
  assert.match(nav,/copy\\.onclick\\s*=\\s*\\(\\)\\s*=>\\s*\\{[^}]{0,600}original\\.click\\(\\)/,
   root+' copied tabs must click their own original buttons');
  assert.doesNotMatch(nav,/live\\[index\\]\\?\\.click\\(\\)/,
   root+' must not route tab proxies by array index');
  assert(settings.includes('window.pb1635CloseInlineSettings=close;'));
  assert(settings.includes("panel?.remove();panel=null;selected='';"));
  assert(settings.includes("classList.remove('pb1635SettingsOpen')"));
  assert.equal(fs.readFileSync(root+'/index.html','utf8').split('closeSettings=r1662').length-1,2);
 }
});
test('R1662 native integrity and R1661 SW version patch install order',()=>{
 const root='dist/web/lab-desktop-ui';
 const m=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 for(const name of ['index.html','photobridge-r1126-desktop-navigation.js','photobridge-r1635-photographer-inline-settings.js']){
  const entry=m.files.find(e=>e.name===name);assert(entry);
  assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.indexOf("await deployStep('./enable-r1662-photographer-settings-return.mjs');")>build.indexOf("await deployStep('./enable-r1661-photographer-invoice-overlay.mjs');"));
 const script=fs.readFileSync('scripts/enable-r1661-photographer-invoice-overlay.mjs','utf8');
 assert(script.includes('const versions=[...worker.matchAll(swVersion)]'));
});

test('R1668 accepts changed print-tab handlers without changing their code',async()=>{
 const {withSettingsCapture,withSettingsCloser}=await import('./r1662-settings-capture.mjs');
 // A real R1668 Docker build had TWO desktop class markers; neither is
 // a reliable insertion anchor. The original desktop click is unique.
 const nav="(()=>{document.documentElement.classList.add('pb1126Desktop');\n"+
  "document.documentElement.classList.add('pb1126Desktop');\n"+
  "function navigate(key){if(key==='print'){return 'modified handler';}}\n"+
  "window.addEventListener('click',e=>{const b=e.target?.closest?.('[data-pb1126-kind]');if(!b)return;},true);})();";
 const patched=withSettingsCapture(nav);
 assert(patched.includes("if(key==='print'){return 'modified handler';}"));
 assert(patched.indexOf('window.pb1635CloseInlineSettings?.();')<
  patched.indexOf("window.addEventListener('click',e=>"));
 assert.equal(withSettingsCapture(patched),patched);
 assert.throws(()=>withSettingsCapture('function navigate(key){}'),/R1662 header click anchor count 0/);
 const originalSettings=fs.readFileSync('scripts/r1635-photographer-inline-settings.js','utf8');
 const updated=withSettingsCloser(originalSettings);
 assert(updated.includes('window.pb1635CloseInlineSettings=close;'));
 assert.equal(withSettingsCloser(updated),updated);
 assert(updated.includes("panel?.remove();panel=null;selected='';"));
});

test('R1669: duplicate desktop markers still install capture once before original header navigation',async()=>{
 const {withSettingsCapture}=await import('./r1662-settings-capture.mjs');
 const click="window.addEventListener('click',e=>{const b=e.target?.closest?.('[data-pb1126-kind]')";
 const twice="document.documentElement.classList.add('pb1126Desktop');\n"+
             "document.documentElement.classList.add('pb1126Desktop');\n"+
             click+";if(!b)return;";
 const patched=withSettingsCapture(twice);
 assert.equal(patched.split('/* PB1668 close settings before desktop header click */').length-1,1);
 assert(patched.indexOf('window.pb1635CloseInlineSettings?.();')<patched.indexOf(click));
 assert(patched.includes(click+";if(!b)return;"));
 assert.equal(withSettingsCapture(patched),patched);
 assert.throws(()=>withSettingsCapture(twice+click),/R1662 header click anchor count 2/);
});

test('R1670: navigation proxy contract accepts R1631+ transformations',()=>{
 const direct=/copy\\.onclick\\s*=\\s*\\(\\)\\s*=>\\s*\\{[^}]{0,600}original\\.click\\(\\)/;
 assert(direct.test('copy.onclick=()=>{press(copy);original.click();}'));
 assert(direct.test("copy.onclick=()=>{original.click();schedule();}"));
 assert(!direct.test('copy.onclick=()=>{live[index]?.click();}'));
 assert(!direct.test('copy.onclick=()=>{other.click();}'));
});
