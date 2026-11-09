'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const css=fs.readFileSync('dist/web/photobridge-r1726-mobile-login.css','utf8');
const js=fs.readFileSync('dist/web/photobridge-r1726-login-install.js','utf8');

function browser({path='/photographer',mobile=true,installed=false,iOS=false,dismissed=false,login=true}={}){
 const events={},session=new Map(dismissed?[['pbR1726InstallDismissed','1']]:[]),children=[];
 let prompt=null;
 const makeNode=()=>({
   hidden:false,id:'',innerHTML:'',textContent:'',className:'',
   listeners:{},classList:{add(name){this.values??=new Set();this.values.add(name)}},
   addEventListener(name,fn){this.listeners[name]=fn},
   setAttribute(){},
   querySelector(q){
    if(q==='.pbR1726Help')return this.help||null;
    if(q==='.pbR1726InstallClose'||q==='.pbR1726InstallAction'){
      this.buttons??={};
      this.buttons[q]??=makeNode();return this.buttons[q];
    }
    return null;
   },
   appendChild(child){this.help=child}
 });
 const body={appendChild(node){children.push(node)}};
 const root=makeNode();
 const document={
  readyState:'complete',body,
  getElementById(id){return id==='root'?root:children.find(x=>x.id===id)},
  querySelector(q){return login?root:null},
  createElement:()=>makeNode(),
  addEventListener(name,fn){events['document:'+name]=fn}
 };
 const window={
  matchMedia(q){return {matches:q.includes('max-width')?mobile:q.includes('display-mode')?installed:false}},
  addEventListener(name,fn){events[name]=fn}
 };
 const navigator={standalone:installed,userAgent:iOS?'iPhone Safari':'Android Chrome',maxTouchPoints:0};
 const sessionStorage={getItem:k=>session.get(k)||null,setItem:(k,v)=>session.set(k,v)};
 const MutationObserver=function(){this.observe=()=>{}};
 const requestAnimationFrame=fn=>{fn();return 1};
 vm.runInNewContext(js,{window,document,navigator,sessionStorage,location:{pathname:path},MutationObserver,requestAnimationFrame},{timeout:2000});
 return {window,document,session,children,events,get banner(){return children[0]},setNative(event){events.beforeinstallprompt?.(event)},installed};
}

test('mobile browser login shows a bottom install invitation and can dismiss it',()=>{
 const b=browser();
 assert(b.banner,'installation card must be added on photographer login');
 assert.equal(b.banner.hidden,false);
 assert(b.banner.innerHTML.includes('نصب برنامه'));
 b.banner.querySelector('.pbR1726InstallClose').listeners.click();
 assert.equal(b.banner.hidden,true);
 assert.equal(b.session.get('pbR1726InstallDismissed'),'1');
});
test('standalone PWA, desktop browser, authenticated pages and closed sessions do not show it',()=>{
 for(const opts of [{installed:true},{mobile:false},{login:false},{path:'/lab/orders/flow'},{path:'/photographer/gallery'},{dismissed:true}]){
  const b=browser(opts);
  assert(!b.banner||b.banner.hidden,'must not cover other UI: '+JSON.stringify(opts));
 }
});
test('native beforeinstallprompt is called only after clicking install',async()=>{
 const b=browser();
 let offered=0,prevented=0;
 const event={
  preventDefault(){prevented++},
  async prompt(){offered++},
  userChoice:Promise.resolve({outcome:'accepted'})
 };
 b.setNative(event);
 assert.equal(offered,0);
 assert.equal(prevented,1);
 await b.banner.querySelector('.pbR1726InstallAction').listeners.click();
 assert.equal(offered,1);
 assert.equal(b.banner.hidden,true);
});
test('unsupported install prompt opens browser-specific guidance rather than claiming success',async()=>{
 for(const iOS of [true,false]){
  const b=browser({iOS});
  await b.banner.querySelector('.pbR1726InstallAction').listeners.click();
  assert(b.banner.help);
  assert(b.banner.help.textContent.includes(iOS?'Safari':'مرورگر'));
  assert.equal(b.banner.hidden,false);
 }
});
test('mobile login is top-anchored and compact, with logo retained and keyboard-safe install prompt',()=>{
 assert.match(css,/@media screen and \(max-width:767px\)/);
 assert(css.includes('top:0!important'));
 assert(css.includes('justify-content:flex-start!important'));
 assert(css.includes('.unifiedLoginShell'));
 assert(css.includes('margin:0 auto!important'));
 assert(css.includes('height:var(--pb-login-height,100dvh)!important'));
 assert(css.includes('width:30px!important;height:30px!important'));
 assert(css.includes('min-height:40px!important;height:40px!important'));
 assert(css.includes('html.pbR1302LoginFocus #pbR1726InstallBanner{display:none!important}'));
 assert(css.includes('html.pbR1302LoginFocus body #root .unifiedLoginPage form .unifiedLoginBrand'));
 assert(css.includes('#pbR1726InstallBanner[hidden]{display:none!important}'));
});
test('single site asset links, desktop and native Lab UI untouched',()=>{
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert.equal(html.split('/photobridge-r1726-mobile-login.css?v=r1726').length-1,1);
 assert.equal(html.split('/photobridge-r1726-login-install.js?v=r1726').length-1,1);
 assert(!css.includes('@media screen and (min-width:768px){html body #root'));
});
test('R1451 deployment regression now asserts the current safe missing-marker guard',()=>{
 const check=fs.readFileSync('scripts/test-r1451-retention-storage-archive.cjs','utf8');
 const enable=fs.readFileSync('scripts/enable-r1451-retention-storage-archive.mjs','utf8');
 const anchor="pb1395FolderId(current).catch(err=>{if(pb1395MissingMarker(err))return null;throw err})!==target.folderId";
 assert(check.includes(anchor));
 assert(enable.includes(anchor));
 assert(check.includes("qs().catch(err=>{if(pb1395MissingMarker(err))return null;throw err})"));
});
