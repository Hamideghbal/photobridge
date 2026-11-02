'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
test('one password control: prefer existing native reveal button; otherwise use one fallback',()=>{
 const js=read('dist/web/photobridge-r1536-password-eye-brand.js');
 assert.doesNotThrow(()=>new vm.Script(js));
 assert(js.includes('function nativeToggle(input)'));
 assert(js.includes('if(nativeToggle(input)){'));
 assert(js.includes('existing?.remove();tracked.delete(input);return;'));
 assert(js.includes('if(nativeToggle(input)){button.remove();tracked.delete(input)}'));
 assert(js.includes("button.querySelector('span').textContent=visible?'مخفی‌کردن':'نمایش'"));
 assert(js.includes("button.type='button'"));
 assert(!js.includes('document.createElement(\'style\')'));
});
test('desktop uses a bordered Persian text button, mobile an icon',()=>{
 const css=read('dist/web/photobridge-r1536-password-eye-brand.css');
 assert(css.includes('/* R1538: one bordered left-side text control'));
 assert(css.includes('width:75px!important'));
 assert(css.includes('height:34px!important'));
 assert(css.includes('.pb1536PasswordEye span{display:inline!important'));
 assert(css.includes('.pb1536PasswordEye svg{display:none!important'));
 assert(css.includes('@media (max-width:640px)'));
 assert(css.includes('width:32px!important'));
 assert(css.includes('.pb1536PasswordEye span{display:none!important'));
});
test('all browser authentication pages have the new cache version',()=>{
 for(const name of ['dist/web/index.html','dist/web/lab-login-security.html','dist/web/account-recovery.html','dist/api/equipment-rental-register.html','dist/api/equipment-rental-portal.html']){
  const html=read(name);
  assert(html.includes('photobridge-r1536-password-eye-brand.js?v=r1538'),name);
  assert(html.includes('photobridge-r1536-password-eye-brand.css?v=r1538'),name);
 }
});
test('Windows lab login receives only new conditional recovery client, with integrity-verified manifest',()=>{
 const base='dist/web/lab-desktop-ui/';
 const manifest=JSON.parse(read(base+'manifest.json'));
 assert.equal(manifest.channel,'lab');
 const src=read(base+'photobridge-r1393-shared-account.js');
 assert(src.includes('PB1537 conditional unification'));
 assert(src.includes("response.status!==409"));
 assert(src.includes("data?.error==='account_password_unification_required'"));
 assert(!src.includes('let scheduled=false;'));
 assert(!src.includes('holder.className='));
 assert(read(base+'index.html').includes('photobridge-r1393-shared-account.js?v=r1538'));
 const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
 assert.equal(manifest.build,hash(Buffer.from(JSON.stringify(manifest.files))));
 for(const name of ['index.html','photobridge-r1393-shared-account.js']){
  const item=manifest.files.find(f=>f.name===name);
  assert(item);
  assert.equal(item.sha256,hash(fs.readFileSync(base+name)));
 }
 assert(!read(base+'index.html').includes('photobridge-r1536-password-eye-brand.js'));
});
