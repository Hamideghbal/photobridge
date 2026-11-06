'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const css=fs.readFileSync('scripts/r1638-photographer-inner-settings-finance.css','utf8');

test('compiled legacy settings tabs are hidden with a higher-specificity embedded selector',()=>{
 const original=fs.readFileSync('dist/web/assets/index-UIRefine-v586.css','utf8');
 assert.match(original,/\.rolePageScrollArea>\.settingsWorkspace\.photographerSettings>\.photographerSettingsTabs\{display:grid!important/);
 assert.match(css,/html\.pb1126Embedded body #root \.rolePageScrollArea > \.settingsWorkspace\.photographerSettings > \.photographerSettingsTabs/);
 const rule=css.match(/\.photographerSettingsTabs,\s*html\.pb1126Embedded[^{]+\{([^}]+)\}/);
 assert.ok(rule,'required legacy tabs hide rule missing');
 assert.match(rule[1],/display:none!important/);
 assert.match(rule[1],/visibility:hidden!important/);
 assert.match(css,/\.settingsWorkspace\.photographerSettings > \.settingsBody/);
 assert.match(css,/grid-column:1\/-1!important/);
});

test('photographer invoice records keep eight columns and never hide balance on desktop',()=>{
 assert.match(css,/@media \(min-width:821px\) and \(hover:hover\) and \(pointer:fine\)/);
 assert.match(css,/html\.pb1126Embedded body #root \.photographerRolePageScrollArea \.financeWorkspace \.accountingInvoiceRows/);
 assert.match(css,/overflow-x:auto!important/);
 const rule=css.match(/\.accountingInvoiceRows > \.invoiceRow \{([^}]+)\}/);
 assert.ok(rule,'customer invoice row grid rule missing');
 assert.match(rule[1],/display:grid!important/);
 const cols=rule[1].match(/grid-template-columns:([^;]+)!important/);
 assert.ok(cols,'missing enforced invoice columns');
 assert.equal(cols[1].trim().split(/\s+/).length,8,'invoice has exactly eight cells');
 assert.match(rule[1],/min-width:1120px!important/);
 assert.match(css,/div:nth-child\(n\+3\):nth-child\(-n\+7\)/);
 const cell=css.match(/div:nth-child\(n\+3\):nth-child\(-n\+7\) \{([^}]+)\}/);
 assert.ok(cell&&cell[1].includes('display:flex!important'),'responsive hide must be undone');
 assert.ok(!css.includes('.labRoleWorkspace'),'never change lab finance presentation');
});

test('R1638 stylesheet is the same in web and Windows UI updater',()=>{
 const name='photobridge-r1638-photographer-inner-settings-finance.css';
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.equal(html.split(name).length,2,'exactly one stylesheet link in '+root);
  assert.ok(html.includes('/'+name+'?v=r1638'),'cache token '+root);
  assert.equal(fs.readFileSync(path.join(root,name),'utf8'),css,'CSS differs in '+root);
 }
 const root='dist/web/lab-desktop-ui';
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
 for(const name of ['index.html','photobridge-r1638-photographer-inner-settings-finance.css']){
  const item=manifest.files.find(x=>x.name===name);
  assert.ok(item,'missing '+name+' in Windows manifest');
  assert.equal(item.sha256,sha(fs.readFileSync(path.join(root,name))),'wrong hash '+name);
 }
 assert.equal(manifest.build,sha(JSON.stringify(manifest.files)),'wrong native build hash');
});
