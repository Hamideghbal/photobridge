'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const script=path.resolve(__dirname,'enable-r1500-lab-intake-quantity-web.mjs');
test('website manual-order photo preview and quantity controls are visible and cache-busted idempotently',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-r1500-'));
 try{
  fs.mkdirSync(path.join(root,'dist/web'),{recursive:true});
  fs.writeFileSync(path.join(root,'dist/web/photobridge-r1137-lab-local-intake.css'),'.pb1137Intake .pb1139GroupPhotos{overflow-y:hidden}\n');
  fs.writeFileSync(path.join(root,'dist/web/index.html'),'<link rel="stylesheet" href="/photobridge-r1137-lab-local-intake.css?v=r1142">');
  cp.execFileSync(process.execPath,[script],{cwd:root});
  const css=fs.readFileSync(path.join(root,'dist/web/photobridge-r1137-lab-local-intake.css'),'utf8');
  const html=fs.readFileSync(path.join(root,'dist/web/index.html'),'utf8');
  assert.match(css,/max-height:min\(240px,36dvh\)!important;overflow-x:auto!important;overflow-y:auto!important/);
  assert.match(css,/\.pb1137Intake \.pb1139GroupPhotos img\{height:82px!important/);
  assert.match(css,/\.pb1137Intake \.pb1139GroupPhotos \.pb1142Quantity\{display:flex!important;visibility:visible!important;opacity:1!important/);
  assert.match(css,/\.pb1137Intake \.pb1139GroupPhotos \.pb1142Quantity input\{width:42px!important/);
  assert.match(html,/photobridge-r1137-lab-local-intake\.css\?v=r1500-manual-order-quantity/);
  cp.execFileSync(process.execPath,[script],{cwd:root});
  assert.equal(fs.readFileSync(path.join(root,'dist/web/photobridge-r1137-lab-local-intake.css'),'utf8').split('PB1500 manual-order preview and quantity visibility').length-1,1);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
