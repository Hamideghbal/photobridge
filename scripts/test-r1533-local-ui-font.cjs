const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
test('main and delivered Windows snapshot load the same bundled variable font without external import',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const css=fs.readFileSync(root+'/assets/index-UIRefine-v586.css','utf8');
  assert(css.includes('/* PB1533 bundled UI font */'));
  assert.match(css,/@font-face\{font-family:Vazirmatn;src:url\("\/assets\/photobridge-handover-vazirmatn\.woff2"\)/);
  assert(css.includes('font-weight:100 900'));assert(!/@import[^;]*fonts\.googleapis\.com[^;]*Vazirmatn/i.test(css));
 }
 const m=JSON.parse(fs.readFileSync('dist/web/lab-desktop-ui/manifest.json'));
 for(const name of ['assets/index-UIRefine-v586.css','assets/photobridge-handover-vazirmatn.woff2']){
  const item=m.files.find(f=>f.name===name);assert(item);
  assert.equal(item.sha256,crypto.createHash('sha256').update(fs.readFileSync('dist/web/lab-desktop-ui/'+name)).digest('hex'));
 }
 assert.equal(m.build,crypto.createHash('sha256').update(JSON.stringify(m.files)).digest('hex'));
});
test('font transform is idempotent and runs before the native snapshot',async()=>{
 const file='dist/web/assets/index-UIRefine-v586.css',before=fs.readFileSync(file,'utf8');
 await import('../scripts/enable-r1533-local-ui-font.mjs?test');assert.equal(fs.readFileSync(file,'utf8'),before);
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');assert(build.indexOf('enable-r1533-')<build.indexOf('prepare-lab-desktop-ui.mjs?final-after-r1344'));
});
