'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const chooser=read('dist/web/photobridge-v904r99-lab-chooser.js');
const chrome=read('dist/web/photobridge-r1126-desktop-navigation.js');
const landing=read('dist/web/photobridge-r1099-photographer-tabs.js');

function extractChooserPredicate(){
 const start=chooser.indexOf('const isPrintRoute=()=>');
 const end=chooser.indexOf(';\n  async function api(',start);
 assert(start>=0&&end>start,'exact Print/Lab route predicate exists');
 return chooser.slice(start+'const isPrintRoute='.length,end);
}
function extractNavigate(){
 const start=chrome.indexOf('function navigate(key){');
 const end=chrome.indexOf('\n }\n // Register before legacy',start);
 assert(start>=0&&end>start,'desktop main-tab handler exists');
 return chrome.slice(start,end+3);
}
test('R1995: root Lab chooser never covers Store, CRM, Calendar or Gallery',()=>{
 assert.doesNotThrow(()=>new vm.Script(chooser));
 const fn=extractChooserPredicate();
 const mk=(url)=>{
  const parsed=new URL('https://photobridge.ir'+url);
  return new Function('location','URLSearchParams','isPhotographerRoute','return ('+fn+')()')(
    {pathname:parsed.pathname,search:parsed.search},URLSearchParams,
    ()=>parsed.pathname.startsWith('/photographer/')
  );
 };
 assert.equal(mk('/photographer/orders'),true,'native Orders is still a print route');
 assert.equal(mk('/photographer/orders?pbDesktopPanel=print'),true,'selected Print still allows the chooser');
 assert.equal(mk('/photographer/orders?workspace=print&pbDesktopPanel=store'),false,'Store does not inherit Print chooser even when the underlying URL is Orders');
 assert.equal(mk('/photographer/orders?pbDesktopPanel=crm'),false,'CRM does not inherit Print chooser');
 assert.equal(mk('/photographer/orders?pbDesktopPanel=calendar'),false,'Calendar does not inherit Print chooser');
 assert.equal(mk('/photographer/orders?pbDesktopPanel=gallery'),false,'Gallery does not inherit Print chooser');
 assert.equal(mk('/photographer/gallery'),false,'Gallery is never a Print route');
 assert.equal(mk('/photographer/orders/flow?workspace=print&pbLabChooser=1&pbDesktopContent=1'),true,'actual Print iframe still has its own chooser');
 assert.match(chooser,/for\(const k of \['pushState','replaceState'\]\)/,'old chooser is cleaned up whenever desktop panel changes through history');
 assert.match(chooser,/function onRoute\(\)\{\s*if\(!isPrintRoute\(\)\)\{cleanup\(\);return\}/,'leaving print synchronously removes obsolete Lab overlay');
});
test('R1995: clicking Gallery navigates to a real gallery document and never fake-changes a URL',()=>{
 assert.doesNotThrow(()=>new vm.Script(chrome));
 const code=extractNavigate();
 const to=[],opened=[],other=[],pages=[];
 const frame={addEventListener(){}};
 const tabs=[['gallery','گالری','/photographer/gallery'],['ai','هوش مصنوعی','/photographer/ai/retouch'],['album','طراحی آلبوم','/photographer/album-design'],['instagram','اینستاگرام','/photographer/album-design?pb_mode=instagram']];
 const session={setItem:(k,v)=>{other.push([k,v])}};
 const run=new Function('tabs','sessionStorage','window','closePanels','open','selected','openStoreChooser','currentDocument','panels','location','return ('+code+')');
 const nav=run(tabs,session,{location:{assign:href=>to.push(href)}},()=>pages.push('close'),key=>opened.push(key),null,()=>false,()=>null,new Map([['store',{querySelector:()=>frame}]]),{pathname:'/photographer/orders'});
 nav('gallery');
 assert.deepEqual(to,['/photographer/gallery']);
 assert.deepEqual(pages,['close']);
 assert(other.some(([key,val])=>key==='pb1976PrintLanding'&&val==='1'),'intentional navigation is remembered');
 nav('ai');nav('album');nav('instagram');
 assert.deepEqual(to.slice(1),['/photographer/ai/retouch','/photographer/album-design','/photographer/album-design?pb_mode=instagram']);
 nav('store');
 assert.deepEqual(opened,['store'],'Store remains an isolated iframe, not the Print iframe');
 assert(to.length===4,'Store does not navigate to Lab/Gallery');
 assert(!code.includes("history.pushState(null,'',tab[2])"),'broken URL-only navigation is removed');
});
test('R1995: connected photographer visiting Orders marks initial landing complete for future Gallery clicks',()=>{
 assert.doesNotThrow(()=>new vm.Script(landing));
 assert.match(landing,/R1995: once the connected photographer has visited native Orders/);
 assert.match(landing,/^ *if\(next.connectedLab===true&&\/\^\\\/photographer\\\/\(\?:orders\|upload\|archive\|finance\)/m);
 assert.match(landing,/sessionStorage\.setItem\('pb1976PrintLanding','1'\)/);
 assert.match(landing,/if\(!seen\)\{location.replace\('\/photographer\/orders'\);return;\}/,'original first-login redirect remains in place');
});

test('R1995: Store and Print retain separate iframe sources, selecting one hides the other',()=>{
 assert.match(chrome,/frame\.src=\(key==='store'\?'\/equipment-rental\/book':'\/photographer\/orders\/flow'\)\+'\?'\+q/,
  'Store should display its own storefront document, Print its own Orders/Lab document');
 assert.match(chrome,/function closePanels\(\)\{for\(const p of panels\.values\(\)\)p\.hidden=true;selected=null/,
  'switching tabs hides any previously visible iframe panel');
 assert.match(chrome,/closePanels\(\);panel\.hidden=false;selected=key;/,
  'opening a Store or Print panel displays only the newly selected one');
 assert.match(chrome,/if\(push\)\{const u=new URL\(location\.href\);u\.searchParams\.set\('pbDesktopPanel',key\);history\.pushState/,
  'parent URL has the selected overlay type so the chooser knows when to disappear');
});
