'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=file=>fs.readFileSync(file,'utf8');

test('R1963: public site dock is never created on photographer or laboratory login',()=>{
 const publicNav=read('dist/web/photobridge-public-nav-v625.js');
 assert.match(publicNav,/function isMobileDockRoute\(path\)\s*\{\s*path=normalize\(path\);\s*return isPublicRoute\(path\);/);
 assert(!publicNav.includes("return isPublicRoute(path)||path==='/photographer'||path==='/lab';"));
});

test('R1963: both SPA auth and standalone store login get the same prepaint and current assets',()=>{
 const index=read('dist/web/index.html'),rental=read('dist/api/equipment-rental-portal.html');
 for(const [file,html] of [['index',index],['rental',rental]]){
  assert(html.includes('id="pbR1963AuthPrepaint"'),file+' prepaint');
  assert(html.includes('photobridge-r1963-app-login.css?v=r1963'),file+' CSS');
  assert(html.includes('photobridge-r1963-app-login.js?v=r1963'),file+' JS');
 }
 assert(index.includes('photobridge-public-nav-v625.js?'));
 assert(index.includes('&authDock=r1963'),'cache bust public navigation');
 assert(rental.includes('id="loginView"'));
 const ui=read('dist/web/assets/index-UIRefine-v655-r84.js');
 assert(ui.includes('className:"center authBg unifiedLoginPage"'));
});

test('R1963: auth-only CSS suppresses both independent bottom navigation surfaces',()=>{
 const css=read('dist/web/photobridge-r1963-app-login.css');
 assert(css.includes('html.pbR1963AuthOnly'));
 assert(css.includes('.pbHomeMobileAccountBar'));
 assert(css.includes('nav.photographerBottomAppNav'));
 assert(css.includes('#photographerStoreBottomNav'));
 assert(css.includes('padding-bottom:0!important'));
 assert(css.includes('.authFooterLinks a[href="/"]'));
 assert(css.includes('[href="/photographer"]')&&css.includes('[href="/lab"]')&&css.includes('[href="/rental"]'));
});

test('R1963: login detection does not classify an authenticated dashboard as a login',()=>{
 const script=read('dist/web/photobridge-r1963-app-login.js');
 assert.doesNotThrow(()=>new vm.Script(script));
 function scenario({reactAuth=false,storeVisible=false,installed=true}={}){
  const classes=new Set(),removed=[];
  const cls={
   contains:x=>classes.has(x),
   add:x=>classes.add(x),
   remove:x=>classes.delete(x),
   toggle:(x,on)=>{if(on)classes.add(x);else classes.delete(x)}
  };
  const store={hidden:false,classList:{contains:x=>x==='hidden'?!storeVisible:false}};
  const body={classList:{contains:x=>false,remove:x=>removed.push(x)}};
  const document={
   documentElement:{classList:cls},
   body,readyState:'complete',
   querySelector:q=>q.includes('.unifiedLoginPage')&&reactAuth?{}:null,
   querySelectorAll:q=>q==='.pbHomeMobileAccountBar'&&reactAuth?[{remove:()=>removed.push('publicNav')}]:[],
   getElementById:id=>id==='root'?{childElementCount:1}:id==='loginView'&&storeVisible?store:null,
   addEventListener:()=>{}
  };
  const context={
   document,navigator:{standalone:installed},
   location:{pathname:'/photographer'},
   matchMedia:()=>({matches:installed}),MutationObserver:undefined,
   addEventListener:()=>{},requestAnimationFrame:fn=>fn(),Promise
  };
  vm.runInNewContext(script,context);
  return {classes,removed};
 }
 const login=scenario({reactAuth:true});
 assert(login.classes.has('pbR1963AuthOnly'));
 assert(login.classes.has('pbR1963Installed'));
 assert(login.removed.includes('publicNav'));
 const dashboard=scenario();
 assert(!dashboard.classes.has('pbR1963AuthOnly'));
 assert(!dashboard.removed.includes('publicNav'));
 const store=scenario({storeVisible:true});
 assert(store.classes.has('pbR1963AuthOnly'));
});
