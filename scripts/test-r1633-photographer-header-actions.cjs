'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{test}=require('node:test');
const css=fs.readFileSync('scripts/r1633-photographer-header-actions.css','utf8');
test('desktop photographer headers match Lab R1174 type and keep selected blue',()=>{
 const lab=fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.css','utf8');
 assert.match(lab,/font:800 11px\/1\.4 Vazirmatn,Tahoma,sans-serif!important/);
 assert.match(lab,/font:800 11px\/1\.35 Vazirmatn,Tahoma,sans-serif!important/);
 assert.match(css,/\.pb1126MainNav>button/);
 assert.match(css,/\.pb1127PrintModes>button/);
 assert.match(css,/font:800 11px\/1\.4 Vazirmatn,Tahoma,sans-serif!important/);
 assert.match(css,/color:#475467!important/);
 assert.match(css,/color:#315efb!important/);
 assert.match(css,/@media\s*\(min-width:821px\) and \(hover:hover\) and \(pointer:fine\)/);
 assert.doesNotMatch(css,/\.labRoleWorkspace\b/,'do not restyle Lab manager view');
});
test('new print and album order actions stay attached to RTL right toolbar',()=>{
 assert.match(css,/\.photographerLabContextRail \.photographerLabContextActions/);
 assert.match(css,/position:static!important/);
 assert.match(css,/left:auto!important/);
 assert.match(css,/right:auto!important/);
 assert.match(css,/transform:none!important/);
 assert.match(css,/justify-content:flex-start!important/);
 assert.match(css,/#photographer-album-new-order-slot/);
 const declarations=css.replace(/\/\*[\s\S]*?\*\//g,''); // CSS comments are not active declarations.
 assert.doesNotMatch(declarations,/(?:^|[{;])\s*left\s*:\s*50%\s*(?:!important)?\s*;/m,'no new centering rule');
});
test('both deployed entry points include the stylesheet and Windows UI manifest tracks it',()=>{
 const name='photobridge-r1633-photographer-header-actions.css';
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.equal(html.split(name).length,2,'exactly one link on '+root);
  assert.equal(fs.readFileSync(path.join(root,name),'utf8'),css,'identical UI in '+root);
 }
 const dir='dist/web/lab-desktop-ui',manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
 const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
 for(const name of ['index.html','photobridge-r1633-photographer-header-actions.css']){
  const item=manifest.files.find(f=>f.name===name);
  assert(item,'missing manifest entry '+name);
  assert.equal(item.sha256,hash(fs.readFileSync(path.join(dir,name))),'hash mismatch '+name);
 }
 assert.equal(manifest.build,hash(JSON.stringify(manifest.files)),'build ID mismatch');
});
