'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const script=path.resolve(__dirname,'enable-r1503-admin-preview-layout.mjs');
test('admin lab preview stays compact in document flow and suppresses full-screen order alarms',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-r1503-'));
 try{
  fs.mkdirSync(path.join(root,'dist/web'),{recursive:true});
  fs.writeFileSync(path.join(root,'dist/web/index.html'),'<html><head><link rel="stylesheet" href="/base.css"></head><body></body></html>');
  cp.execFileSync(process.execPath,[script],{cwd:root});
  const css=fs.readFileSync(path.join(root,'dist/web/photobridge-r1503-admin-preview-layout.css'),'utf8');
  const html=fs.readFileSync(path.join(root,'dist/web/index.html'),'utf8');
  for(const token of ['position:relative!important','inset:auto!important','min-height:42px!important','justify-content:flex-start!important','.labOrderAlarmLayer','.persistentPrintAlarm','display:none!important'])assert.ok(css.includes(token),`missing preview layout rule: ${token}`);
  assert.match(html,/photobridge-r1503-admin-preview-layout\.css\?v=r1503-admin-preview-layout/);
  assert.ok(html.indexOf('photobridge-r1503-admin-preview-layout.css')<html.indexOf('</head>'));
  cp.execFileSync(process.execPath,[script],{cwd:root});
  assert.equal((fs.readFileSync(path.join(root,'dist/web/index.html'),'utf8').match(/photobridge-r1503-admin-preview-layout\.css/g)||[]).length,1);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('admin-preview stylesheet runs after the frozen Windows snapshot and remains website-only',()=>{
 const pipeline=fs.readFileSync(path.resolve(__dirname,'liara-fast-build.mjs'),'utf8');
 const snapshot=pipeline.indexOf('await deployStep("./prepare-lab-desktop-ui.mjs?final-after-r1344")');
 const verify=pipeline.indexOf('await deployStep("./verify-lab-desktop-ui-freshness.mjs")',snapshot);
 const r1502=pipeline.indexOf('await deployStep("./enable-r1502-web-intake-card-layout.mjs")',verify);
 const webOnly=pipeline.indexOf('await deployStep("./enable-r1503-admin-preview-layout.mjs")',r1502);
 assert.ok(snapshot>=0&&verify>snapshot&&r1502>verify&&webOnly>r1502);
 const source=fs.readFileSync(path.resolve(__dirname,'enable-r1503-admin-preview-layout.mjs'),'utf8');
 assert.ok(source.includes("const cssPath = 'dist/web/photobridge-r1503-admin-preview-layout.css'"));
 assert.ok(source.includes("const htmlPath = 'dist/web/index.html'"));
 assert.ok(!source.includes('desktop-ui')&&!source.includes('lab-desktop-ui'));
});
