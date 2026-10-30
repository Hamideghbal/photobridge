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
  for(const token of ['PB1502 browser-only manual intake card layout','PB1505 shared web and Windows manual-order card layout','PB1510 orderly manual-order photo rows','grid-template-columns:repeat(auto-fill,minmax(250px,1fr))!important','grid-template-rows:auto auto auto auto!important','left:7px!important;right:auto!important','left:41px!important;right:auto!important','grid-template-columns:minmax(0,1fr) auto!important','grid-row:3!important','grid-row:4!important','grid-template-columns:46px 32px 46px 32px!important','grid-template-columns:repeat(2,minmax(0,1fr))!important','height:160px!important','overflow-wrap:anywhere!important','overflow-x:hidden!important;overflow-y:auto!important'])assert.ok(css.includes(token),`missing CSS rule: ${token}`);
  assert.match(html,/photobridge-r1137-lab-local-intake\.css\?v=r1512-stacked-photo-cards/);
  assert.match(html,/photobridge-r1137-lab-local-intake\.js\?v=r1512-stacked-photo-cards/);
  cp.execFileSync(process.execPath,[script],{cwd:root});
  const finalCss=fs.readFileSync(path.join(web,'photobridge-r1137-lab-local-intake.css'),'utf8');
  assert.equal(finalCss.split('PB1502 browser-only manual intake card layout').length-1,1);
  assert.equal(finalCss.split('PB1510 orderly manual-order photo rows').length-1,1);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('the shared manual-order layout is included before the immutable Windows UI snapshot',()=>{
 const pipeline=fs.readFileSync(path.resolve(__dirname,'liara-fast-build.mjs'),'utf8');
 const r1502=pipeline.indexOf('await deployStep("./enable-r1502-web-intake-card-layout.mjs")');
 const test=pipeline.indexOf('scripts/test-r1502-web-intake-card-layout.cjs',r1502);
 const snapshot=pipeline.indexOf('await deployStep("./prepare-lab-desktop-ui.mjs?final-after-r1344")',test);
 const verify=pipeline.indexOf('await deployStep("./verify-lab-desktop-ui-freshness.mjs")',snapshot);
 assert.ok(r1502>=0&&test>r1502&&snapshot>test&&verify>snapshot);
 const script=fs.readFileSync(path.resolve(__dirname,'enable-r1502-web-intake-card-layout.mjs'),'utf8');
 assert.ok(script.includes("const cssFile = 'dist/web/photobridge-r1137-lab-local-intake.css'"));
 assert.ok(script.includes("const indexFile = 'dist/web/index.html'"));
 assert.ok(script.includes('PB1505 shared web and Windows manual-order card layout'));
});
