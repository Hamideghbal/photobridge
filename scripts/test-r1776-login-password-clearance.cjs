'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');

test('R1776 protects login password padding against the historical mobile reset',()=>{
 const css=read('dist/web/photobridge-r1776-login-password-clearance.css');
 const prior=read('dist/web/photobridge-r1726-mobile-login.css');
 assert(prior.includes('padding:5px 10px!important'));
 for(const name of ['.unifiedLoginPage input[data-pb1776-password-clearance]',
  'form.rentalUnifiedLogin input[data-pb1776-password-clearance]',
  'form.labLogin input[data-pb1776-password-clearance]'])
  assert(css.includes(name));
 assert(css.includes('padding-left:94px!important'));
 assert(css.includes('padding-left:112px!important'));
 assert(css.includes('padding-right:12px!important'));
 assert(!css.includes('.pb1536PasswordEye{'), 'must not reposition the reveal control');
});

test('R1776 dynamically measures the real reveal button without reading the password',()=>{
 const script=read('dist/web/photobridge-r1776-login-password-clearance.js');
 assert.doesNotThrow(()=>new vm.Script(script));
 const styles=new Map(),priorities=new Map(),attrs=new Set();
 let repaint;
 const inputRect={left:50,right:350,top:100,bottom:144,width:300,height:44};
 const buttonRect={left:58,right:160,top:104,bottom:140,width:102,height:36};
 const eye={textContent:'نمایش',classList:{contains:()=>false},getAttribute:()=>null,
  getBoundingClientRect:()=>buttonRect};
 const host={querySelectorAll:()=>[eye],parentElement:null};
 const input={tagName:'INPUT',type:'password',parentElement:host,closest:()=>({}),
  getBoundingClientRect:()=>inputRect,hasAttribute:k=>attrs.has(k),setAttribute:k=>attrs.add(k),
  style:{getPropertyValue:k=>styles.get(k)||'',getPropertyPriority:k=>priorities.get(k)||'',
   setProperty:(k,v,priority)=>{styles.set(k,v);priorities.set(k,priority)}}};
 const username={tagName:'INPUT',type:'text',hasAttribute:()=>false,closest:()=>({})};
 const document={documentElement:{},readyState:'complete',addEventListener(){},
  querySelectorAll:()=>[input,username].filter(x=>x.type==='password'||x.hasAttribute('data-pb1776-password-clearance'))};
 const window={requestAnimationFrame:cb=>cb(),matchMedia:()=>({matches:true}),addEventListener(){}};
 class MutationObserver{constructor(cb){repaint=cb}observe(){}}
 vm.runInNewContext(script,{window,document,MutationObserver},{timeout:1000});
 assert(attrs.has('data-pb1776-password-clearance'));
 assert.equal(styles.get('padding-left'),'124px');
 assert.equal(priorities.get('padding-left'),'important');
 input.type='text';repaint();
 assert.equal(styles.get('padding-left'),'124px','revealing password must keep the text gutter');
 buttonRect.left=260;buttonRect.right=340;repaint();
 assert.equal(styles.get('padding-right'),'104px','also support right-side reveal placement');
 assert(!/\\.value\\s*=/.test(script),'never modify credentials');
 assert(!script.includes('addEventListener(\'click\''),'never intercept the reveal control');
});

test('R1776 assets are installed uniquely in auth entrypoints, after mobile rules',()=>{
 const css='/photobridge-r1776-login-password-clearance.css?v=r1776';
 const js='/photobridge-r1776-login-password-clearance.js?v=r1776';
 for(const path of ['dist/web/index.html','dist/web/account-recovery.html','dist/web/lab-login-security.html',
  'dist/api/equipment-rental-register.html','dist/api/equipment-rental-portal.html',
  'dist/api/equipment-rental-book.html','dist/api/admin-equipment-rental.html']){
  if(!fs.existsSync(path)||!read(path).trim())continue;
  const html=read(path);
  assert.equal(html.split(css).length,2,path+' CSS must be unique');
  assert.equal(html.split(js).length,2,path+' JS must be unique');
  if(path==='dist/web/index.html'&&html.includes('/photobridge-r1726-mobile-login.css'))
   assert(html.indexOf(css)>html.indexOf('/photobridge-r1726-mobile-login.css'));
 }
});

test('R1776 is last in the build, preserves Windows snapshots, and busts deploy cache',()=>{
 const build=read('scripts/liara-fast-build.mjs');
 const installer=read('scripts/enable-r1776-login-password-clearance.mjs');
 assert(build.includes("await deployStep('./enable-r1776-login-password-clearance.mjs');"));
 assert(build.indexOf("enable-r1776-login-password-clearance.mjs")>build.indexOf("enable-r1775-native-order-edit-customers-visibility.mjs"));
 assert(installer.includes("html=html.replaceAll(cssTag,'').replaceAll(jsTag,'')"));
 assert(installer.includes("html=html.replace('</head>'"));
 assert(!installer.includes("lab-desktop-ui"),'do not alter installed native Windows files');
 assert(read('DEPLOY_REVISION.txt').includes('r1776'));
});
