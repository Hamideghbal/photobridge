'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const script=path.resolve(__dirname,'enable-r1502-web-intake-card-layout.mjs');
test('browser-only manual intake cards keep image, paper, action badge and quantity controls in separate readable rows',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-r1502-'));
 try{
  const web=path.join(root,'dist/web');fs.mkdirSync(web,{recursive:true});
  fs.writeFileSync(path.join(web,'photobridge-r1137-lab-local-intake.css'),'.pb1137Intake .pb1139GroupPhotos{overflow-y:hidden}\n');
  fs.writeFileSync(path.join(web,'photobridge-r1137-lab-local-intake.js'),'/* test fixture */');
  fs.writeFileSync(path.join(web,'index.html'),'<link rel="stylesheet" href="/photobridge-r1137-lab-local-intake.css?v=r1501"><script src="/photobridge-r1137-lab-local-intake.js?v=r1501"></script>');
  cp.execFileSync(process.execPath,[script],{cwd:root});
  const css=fs.readFileSync(path.join(web,'photobridge-r1137-lab-local-intake.css'),'utf8');
  const html=fs.readFileSync(path.join(web,'index.html'),'utf8');
  for(const token of ['PB1502 browser-only manual intake card layout','grid-template-columns:repeat(auto-fill,minmax(168px,1fr))','height:118px!important','-webkit-line-clamp:2!important','grid-template-columns:minmax(0,1fr) 30px 44px 30px!important','overflow-x:hidden!important;overflow-y:auto!important'])assert.ok(css.includes(token),`missing CSS rule: ${token}`);
  assert.match(html,/photobridge-r1137-lab-local-intake\.css\?v=r1502-browser-card-layout/);
  assert.match(html,/photobridge-r1137-lab-local-intake\.js\?v=r1502-browser-card-layout/);
  cp.execFileSync(process.execPath,[script],{cwd:root});
  assert.equal(fs.readFileSync(path.join(web,'photobridge-r1137-lab-local-intake.css'),'utf8').split('PB1502 browser-only manual intake card layout').length-1,1);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('the browser layout patch runs after the immutable Windows UI snapshot',()=>{
 const pipeline=fs.readFileSync(path.resolve(__dirname,'liara-fast-build.mjs'),'utf8');
 const snapshot=pipeline.indexOf('await deployStep("./prepare-lab-desktop-ui.mjs?final-after-r1344")');
 const verify=pipeline.indexOf('await deployStep("./verify-lab-desktop-ui-freshness.mjs")',snapshot);
 const webOnly=pipeline.indexOf('await deployStep("./enable-r1502-web-intake-card-layout.mjs")',verify);
 assert.ok(snapshot>=0&&verify>snapshot&&webOnly>verify);
 const script=fs.readFileSync(path.resolve(__dirname,'enable-r1502-web-intake-card-layout.mjs'),'utf8');
 assert.ok(script.includes("const cssFile = 'dist/web/photobridge-r1137-lab-local-intake.css'"));
 assert.ok(script.includes("const indexFile = 'dist/web/index.html'"));
 assert.ok(!script.includes('desktop-ui')&&!script.includes('lab-desktop-ui'));
});
