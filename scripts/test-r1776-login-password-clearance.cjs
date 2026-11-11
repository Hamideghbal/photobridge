'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
test('R1776 fixes the actual R1726 mobile password padding regression',()=>{
 const css=read('dist/web/photobridge-r1776-login-password-clearance.css');
 assert(read('dist/web/photobridge-r1726-mobile-login.css').includes('padding:5px 10px!important'));
 for(const sel of ['.unifiedLoginPage input[data-pb1776-password-clearance]','form.rentalUnifiedLogin input[data-pb1776-password-clearance]','form.labLogin input[data-pb1776-password-clearance]'])assert(css.includes(sel));
 assert(css.includes('padding-left:112px!important'));
 assert(css.includes('padding-left:94px!important'));
 assert(css.includes('padding-right:12px!important'));
 assert(!css.includes('.pb1536PasswordEye{'));
});
test('R1776 keeps the clearance after password is revealed without touching other fields',()=>{
 const source=read('dist/web/photobridge-r1776-login-password-clearance.js');
 assert.doesNotThrow(()=>new vm.Script(source));
 const attrs=new Set();
 const password={tagName:'INPUT',type:'password',hasAttribute:k=>attrs.has(k),setAttribute:k=>attrs.add(k),closest:()=>({})};
 const phone={tagName:'INPUT',type:'text',hasAttribute:()=>false,closest:()=>({})};
 let rerun;
 class MutationObserver{constructor(cb){rerun=cb}observe(){}}
 const document={documentElement:{},readyState:'complete',querySelectorAll:()=>[password,phone].filter(x=>x.type==='password'||x.hasAttribute('data-pb1776-password-clearance'))};
 vm.runInNewContext(source,{window:{},document,MutationObserver},{timeout:1500});
 assert(attrs.has('data-pb1776-password-clearance'));
 password.type='text';rerun();
 assert(attrs.has('data-pb1776-password-clearance'));
 assert.equal(phone.hasAttribute('data-pb1776-password-clearance'),false);
 assert(!source.includes('.value='));
 assert(!source.includes("addEventListener('click'"));
 assert(!source.includes('addEventListener("click"'));
});
test('R1776 assets are unique and load after old login styles',()=>{
 const css='/photobridge-r1776-login-password-clearance.css?v=r1776',js='/photobridge-r1776-login-password-clearance.js?v=r1776';
 for(const path of ['dist/web/index.html','dist/web/account-recovery.html','dist/web/lab-login-security.html','dist/api/equipment-rental-register.html','dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html','dist/api/admin-equipment-rental.html']){
  if(!fs.existsSync(path)||!read(path).trim())continue;
  const html=read(path);
  assert.equal(html.split(css).length,2,path+' css');
  assert.equal(html.split(js).length,2,path+' js');
  if(path==='dist/web/index.html')assert(html.indexOf(css)>html.indexOf('/photobridge-r1726-mobile-login.css'));
 }
});
