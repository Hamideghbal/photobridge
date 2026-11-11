const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
test('final UI references address the exact built CSS and JS bytes',()=>{
 const html=fs.readFileSync('dist/web/index.html','utf8');let count=0;
 for(const m of html.matchAll(/\b(?:src|href)=(['"])(\/[^'"<>\s]+\.(?:css|js))([^'"<>\s]*)\1/g)){
  const file=path.join('dist/web',m[2]);if(!fs.existsSync(file))continue;
  const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,16);
  assert(m[3].includes('uiHash='+hash),m[2]+' must use the final bytes');count++;
 }
 assert(count>30,'cover the full web UI, not only the new files');
});
test('compatibility installer is idempotent and leaves native manifests intact',()=>{
 const files=['dist/web/index.html','dist/web/lab-desktop-ui/manifest.json','dist/web/desktop-ui/manifest.json'];const before=files.map(f=>fs.readFileSync(f));
 execFileSync(process.execPath,['scripts/enable-r1777-mobile-browser.mjs']);files.forEach((f,i)=>assert.deepEqual(fs.readFileSync(f),before[i],f));
});
test('fallback geometry works without dynamic viewport or observer APIs and follows a short dock',()=>{
 const js=fs.readFileSync('scripts/r1777-mobile-browser.js','utf8'),begin=js.indexOf(' function fallbackGeometry('),end=js.indexOf(' function passwords()',begin);
 assert(begin>=0&&end>begin);const box=(top,bottom)=>({top,bottom});
 function run(height,viewport){const win={visualViewport:viewport},document={querySelectorAll:s=>s.includes('PhotographerHeader')?[box(0,90),box(90,181)]:[box(height-67,height)]};return new Function('window','document','innerHeight','bounds',js.slice(begin,end)+';return fallbackGeometry({},null)')(win,document,height,x=>x)}
 assert.deepEqual(run(568),{top:181,bottom:67});assert.deepEqual(run(667),{top:181,bottom:67});
 assert.deepEqual(run(667,{offsetTop:0,height:400}),{top:181,bottom:267});
});
test('early fallback can parse without optional chaining or unsupported selector dependencies',()=>{
 const js=fs.readFileSync('dist/web/photobridge-r1777-mobile-browser.js','utf8');new (require('node:vm').Script)(js);
 assert(!/\?\.|\?\?|\|\|=|&&=|\.at\(/.test(js));
 const css=fs.readFileSync('dist/web/photobridge-r1777-mobile-browser.css','utf8').replace(/\/\*[\s\S]*?\*\//g,'');assert(!/:has\(|:is\(|\d+dvh/.test(css));
});
