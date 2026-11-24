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
test('R1995/R1997: Gallery is a separate real iframe, never old Orders content in disguise',()=>{
 assert.doesNotThrow(()=>new vm.Script(chrome));
 const code=extractNavigate();
 const to=[],opened=[],other=[],pages=[];
 const tabs=[['gallery','گالری','/photographer/gallery'],['ai','هوش مصنوعی','/photographer/ai/retouch'],['album','طراحی آلبوم','/photographer/album-design'],['instagram','اینستاگرام','/photographer/album-design?pb_mode=instagram']];
 const session={setItem:(k,v)=>other.push([k,v])};
 const run=new Function('tabs','sessionStorage','window','closePanels','open','selected','panels','openPrintChooser','schedule','location','return ('+code+')');
 const nav=run(tabs,session,{location:{assign:href=>to.push(href)}},()=>pages.push('close'),key=>opened.push(key),null,new Map(),()=>true,()=>{},{pathname:'/photographer/orders'});
 nav('gallery');nav('store');nav('gallery');
 assert.deepEqual(opened,['gallery','store','gallery'],'each tab uses its own cached panel');
 assert.deepEqual(to,[],'Gallery and Store never trigger root document loads or fake SPA routes');
 assert.match(chrome,/frame\.src='\/photographer\/gallery\?pbDesktopContent=1&pbDesktopPanel=gallery'/,'Gallery iframe loads the actual Gallery page');
 assert.match(chrome,/frame\.src=(?:restoredPrint\|\|)?\(key==='store'\?'\/equipment-rental\/book':'\/photographer\/orders\/flow'\)\+'\?'\+q/,'Store remains an actual equipment page');
 nav('ai');nav('album');nav('instagram');
 assert.deepEqual(to,['/photographer/ai/retouch','/photographer/album-design','/photographer/album-design?pb_mode=instagram']);
 assert.equal(pages.length,3,'non-cached app features still use real document navigation');
 assert(!code.includes("history.pushState(null,'',tab[2])"),'no URL-only fake navigation');
});

test('R1995: connected photographer visiting Orders marks initial landing complete for future Gallery clicks',()=>{
 assert.doesNotThrow(()=>new vm.Script(landing));
 assert.match(landing,/R1995: once the connected photographer has visited native Orders/);
 assert.match(landing,/^ *if\(next.connectedLab===true&&\/\^\\\/photographer\\\/\(\?:orders\|upload\|archive\|finance\)/m);
 assert.match(landing,/sessionStorage\.setItem\('pb1976PrintLanding','1'\)/);
 assert.match(landing,/if\(!seen\)\{location.replace\('\/photographer\/orders\?workspace=print'\);return;\}/,'canonical first-login Orders route retains Print workspace and prevents a second lab selection');
});

test('R1995: Store and Print retain separate iframe sources, selecting one hides the other',()=>{
 // R1461 rebuild can add a print-only restored URL before the same store/print
 // destination selector. Test both production-bundled and prebuild shapes.
 assert.match(chrome,/frame\.src=(?:restoredPrint\|\|)?\(key==='store'\?'\/equipment-rental\/book':'\/photographer\/orders\/flow'\)\+'\?'\+q/,
  'Store should display its own storefront document, Print its own Orders/Lab document');
 if(chrome.includes('frame.src=restoredPrint||')){
  assert.match(chrome,/const savedPrint=key==='print'\?/,'only Print can restore a previous Print route');
  assert.match(chrome,/let restoredPrint=null/,'Store must not reuse a Print history URL');
 }
 assert.match(chrome,/function closePanels\(\)\{for\(const p of panels\.values\(\)\)p\.hidden=true;selected=null/,
  'switching tabs hides any previously visible iframe panel');
 assert.match(chrome,/closePanels\(\);panel\.hidden=false;selected=key;/,
  'opening a Store or Print panel displays only the newly selected one');
 assert.match(chrome,/if\(push\)\{const u=new URL\(location\.href\);u\.searchParams\.set\('pbDesktopPanel',key\);history\.pushState/,
  'parent URL has the selected overlay type so the chooser knows when to disappear');
});
