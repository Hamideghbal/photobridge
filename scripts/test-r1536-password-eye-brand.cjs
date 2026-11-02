'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=x=>fs.readFileSync(x,'utf8');
const script=read('dist/web/photobridge-r1536-password-eye-brand.js');
test('password eye script parses and provides independent per-field controls',()=>{
 assert.doesNotThrow(()=>new vm.Script(script));
 assert.match(script,/querySelectorAll\('input\[type="password"\],input\[data-pb1536-password\]'\)/);
 assert.match(script,/input\.type=visible\?'text':'password'/);
 assert.match(script,/button\.setAttribute\('aria-pressed',String\(visible\)\)/);
 assert.match(script,/button\.type='button'/);
 assert.match(script,/insertAdjacentElement\('afterend',button\)/);
 assert.match(script,/MutationObserver\(schedule\)/);
 assert.doesNotMatch(script,/\.value\s*=/);
});
test('password eye CSS supports strict CSP without inline style injection',()=>{
 const css=read('dist/web/photobridge-r1536-password-eye-brand.css');
 assert.match(css,/\.pb1536PasswordEye\{/);
 assert.match(css,/padding-inline-end:66px/);
 assert.ok(!script.includes("document.createElement('style')"));
});
test('password eye runs on central login, signups and password reset with both password fields',()=>{
 const files=['dist/web/index.html','dist/web/account-recovery.html','dist/web/lab-login-security.html','dist/api/equipment-rental-register.html','dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html','dist/api/admin-equipment-rental.html'];
 for(const file of files){
  if(!fs.existsSync(file))continue;
  const s=read(file);
  assert.ok(s.includes('/photobridge-r1536-password-eye-brand.css?v=r1536'),file+' CSS');
  assert.ok(s.includes('/photobridge-r1536-password-eye-brand.js?v=r1536'),file+' JS');
 }
});
test('brand fallback uses authentic committed PhotoBridge image and not client uploads',()=>{
 assert.ok(fs.existsSync('dist/web/photobridge-brand-script-r1285.png'));
 assert.match(script,/isOwnBrand\(img\)/);
 assert.match(script,/photobridge-brand-script-r1285\.png/);
 assert.doesNotMatch(script,/img\.src\s*=\s*['"]https?:/);
});
