const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const html=fs.readFileSync('dist/web/customer-crm.html','utf8');
const js=fs.readFileSync('dist/web/customer-crm-service-menus-r1868.js','utf8');
const css=fs.readFileSync('dist/web/customer-crm-service-menus-r1868.css','utf8');
const revision=fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim();
test('CRM terminology and new service type access',()=>{
  assert.match(html, /for="session-type">نوع خدمات/);
  assert.match(html, /for="template-type">نوع خدمات/);
  assert.doesNotMatch(html, /مدل عکاسی|نوع عکاسی/);
  assert.match(js, /request\('types','POST',\{name\}\)/);
  assert.match(js, /افزودن نوع خدمات/);
  assert.match(js, /session-type.*template-type/);
});
test('R1868 is linked with a cache-busting deployment version',()=>{
  for(const ext of ['js','css']){
    assert.ok(html.includes('customer-crm-service-menus-r1868.'+ext+'?rev='+encodeURIComponent(revision)+'"'));
  }
});
test('Desktop and mobile use RTL readable project-font menus',()=>{
  assert.match(css,/PB CRM Vazirmatn/);
  assert.match(css,/\.pb1868Popup/);
  assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css,/position:sticky/);
  assert.match(js,/MutationObserver/);
  assert.match(js,/cal-customer/);
  assert.match(js,/cal-duration/);
  assert.match(js,/cal-status/);
});

const nativeRoot='dist/web/lab-desktop-ui/';
const nativeManifest=nativeRoot+'manifest.json';
test('the pinned Windows lab UI ships the CRM service menus', {skip:!fs.existsSync(nativeManifest)},()=>{
  const {files}=JSON.parse(fs.readFileSync(nativeManifest,'utf8'));
  for(const name of ['customer-crm.html','customer-crm-service-menus-r1868.js','customer-crm-service-menus-r1868.css']){
    const bytes=fs.readFileSync(nativeRoot+name);
    const hash=createHash('sha256').update(bytes).digest('hex');
    assert.equal(files.find(file=>file.name===name)?.sha256,hash,name);
    if(name==='customer-crm.html'){
      const page=bytes.toString('utf8');
      assert.match(page,/for="session-type">نوع خدمات/);
      assert.match(page,/for="template-type">نوع خدمات/);
      for(const ext of ['js','css'])assert.ok(page.includes('customer-crm-service-menus-r1868.'+ext+'?rev='+encodeURIComponent(revision)+'"'));
    }else assert.deepEqual(bytes,fs.readFileSync('dist/web/'+name),name);
  }
});
