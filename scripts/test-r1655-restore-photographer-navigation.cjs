'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const roots=['dist/web','dist/web/lab-desktop-ui'];

test('R1655: do not reroute original print/album/finance/archive buttons by array indices',()=>{
 const installer=fs.readFileSync('scripts/enable-r1648-photographer-invoice-preview.mjs','utf8');
 assert.match(installer,/if\(false && !nav\.includes\('\/\* PB1648 stable print header \*\/'\)\)/);
 for(const root of roots){
  const js=fs.readFileSync(root+'/photobridge-r1126-desktop-navigation.js','utf8');
  assert.doesNotMatch(js,/\/\* PB1648 stable print header \*\//,root);
  assert.doesNotMatch(js,/\/\* PB1653 stable desktop photographer \*\//,root);
  assert.doesNotMatch(js,/live\[index\]\?\.click\(\)/,root);
  assert.match(js,/copy\.onclick=\(\)=>\{press\(copy\);original\.click\(\)/,root);
  assert.match(js,/if\(utilities\)\{const separator=/,root+' R1632 utility grouping must remain');
  assert.match(js,/modes\.append\(b\)/,root+' finance/archive stay in R1632 original order');
  assert.doesNotThrow(()=>new Function(js),root);
 }
});

test('R1655: restore the original R1635 settings controller and prevent R1653 double panel',()=>{
 const legacy=fs.readFileSync('scripts/r1635-photographer-inline-settings.js','utf8');
 for(const root of roots){
  const html=fs.readFileSync(root+'/index.html','utf8');
  const actual=fs.readFileSync(root+'/photobridge-r1635-photographer-inline-settings.js','utf8');
  assert.equal(actual,legacy,root+' must serve the original settings controller');
  assert(!html.includes('speed=r1653'),'bad R1653 cached settings script loaded: '+root);
  assert(!html.includes('stable=r1653'),'bad R1653 tab/nav patch loaded: '+root);
  assert(!html.includes('pb1653FirstPaint'),'bad early header injected: '+root);
  assert(!html.includes('photobridge-r1653-photographer-desktop-stability.css'),'bad R1653 styles loaded: '+root);
  assert.match(html,/photobridge-r1635-photographer-inline-settings\.js\?v=r1637/,root);
 }
});

test('R1655: retain the standalone invoice fallback without conflicting compiled React portal',()=>{
 const installer=fs.readFileSync('scripts/enable-r1648-photographer-invoice-preview.mjs','utf8');
 assert.match(installer,/if\(false && !source\.includes\('\/\* PB1648 photographer invoice portal \*\/'\)\)/);
 for(const root of roots){
  const html=fs.readFileSync(root+'/index.html','utf8');
  const js=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  assert(!js.includes('function pb1648InvoicePortal('),root+' must not inject a competing React portal');
  assert.match(html,/photobridge-r1651-invoice-host\.js\?v=r1651/,root);
  assert.match(html,/photobridge-r1651-invoice-host\.css\?v=r1651/,root);
  assert(fs.readFileSync(root+'/photobridge-r1651-invoice-host.js','utf8').includes('pb1651InvoiceOpen'));
  assert.match(html,/photobridge-r1652-photographer-settings-archive\.css\?v=r1652/,root);
 }
});

test('R1655: release build must not invoke broken R1653 transformer or its obsolete tests',()=>{
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(!build.includes("await deployStep('./enable-r1653-photographer-header-settings-speed.mjs')"));
 assert(!build.includes("['--test','scripts/test-r1653-photographer-desktop-stability.cjs']"));
 assert.match(build,/scripts\/test-r1655-restore-photographer-navigation\.cjs/);
 const root='dist/web/lab-desktop-ui';
 const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 assert.equal(manifest.channel,'lab');
 assert.equal(manifest.protocol,1);
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 for(const name of ['index.html','photobridge-r1126-desktop-navigation.js',
                    'photobridge-r1635-photographer-inline-settings.js',
                    'photobridge-r1651-invoice-host.js']){
  const row=manifest.files.find(x=>x.name===name);
  assert(row,'missing native asset '+name);
  assert.equal(row.sha256,hash(fs.readFileSync(root+'/'+name)),name+' hash mismatch');
 }
});
