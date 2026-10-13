const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=x=>fs.readFileSync(x,'utf8');
const core=read('dist/web/assets/index-UIRefine-v655-r84.js');
const nav=read('dist/web/photobridge-r1126-desktop-navigation.js');
const gallery=read('dist/web/photobridge-r1163-desktop-gallery-header.js');
const lab=read('dist/web/photobridge-r1147-lab-admin-header.js');
const css=read('dist/web/photobridge-r1193-photographer-stable-tabs.css');
const site=read('dist/web/index.html');
test('photographer and laboratory React routes do not wait for document view transitions',()=>{
 const i=core.indexOf('function Dn(t,a=!1)');
 assert(i>0);
 const route=core.slice(i,core.indexOf('function vf()',i));
 assert(route.includes('!/^\\/(?:photographer|lab)(?:\\/|$)/.test(location.pathname)'));
 assert(route.includes('typeof r.startViewTransition=="function"'), 'unrelated routes can keep native transition');
 assert(route.includes('window.dispatchEvent(new PopStateEvent("popstate"))'));
 const match=route.match(/function Dn\([\s\S]*?\}function vf\(/);
 assert(!match || match[0].length>0);
});
test('all photographer desktop main tabs render content without 420ms fade, while underline remains',()=>{
 const start=nav.indexOf('function reveal(el){'),end=nav.indexOf('\n function schedule()',start);
 assert(start>0&&end>start);
 const block=nav.slice(start,end);
 assert(block.includes('window.__PB_ALLOW_WHOLE_PAGE_MOTION__!==true'));
 assert(block.includes("el.animate([{opacity:.85},{opacity:1}],{duration:420"), 'legacy dormant effect remains for regression compatibility');
 const source=nav.slice(nav.indexOf('function press(el){'),nav.indexOf(' function motionContent('));
 assert(!source.includes('void el.offsetWidth'), 'no synchronous layout flush');
 assert(source.includes('el.animate?.('), 'short button feedback remains');
 assert(nav.includes('function placeMainIndicator('));
});
test('gallery manager suppresses whole-photo fade but retains button feedback',()=>{
 const start=gallery.indexOf("const changed=role!=='back'"),end=gallery.indexOf('bar.append(b);',start);
 const block=gallery.slice(start,end);
 assert(block.includes('if(animate&&window.__PB_ALLOW_WHOLE_PAGE_MOTION__===true)'));
 assert(block.includes('b.animate?.('));
 assert(block.includes("content?.animate?.([{opacity:.85},{opacity:1}]"));
});
test('lab and Store previous fixes remain present',()=>{
 assert(lab.includes('PB1188 fixed scroll viewport'));
 assert(read('dist/web/photobridge-r1192-mobile-pwa-tab-stability.css').includes('.labOrderScrollArea.queuePageTurn'));
 assert(read('dist/api/equipment-rental-portal.html').includes('PB1190 no whole-content motion'));
});
test('mobile PWA and desktop site CSS only targets photographer page content',()=>{
 for(const s of ['.photographerMain>.photographerRolePageScrollArea','.clientGalleryWorkspace','.clientGalleryManager','.simplePrintPilot','.photographerAlbumStandalone'])assert(css.includes(s),s);
 assert(!css.includes('.pb1131MovingIndicator'));
 assert(!css.includes('.photographerBottomAppNav'));
 assert(site.includes('/photobridge-r1193-photographer-stable-tabs.css?v=r1193'));
 assert.match(site,/index-UIRefine-v655-r84\.js\?v=[^"]+&photographer=r1193&touch=r1192"/);
 for(const f of ['photobridge-r1126-desktop-navigation','photobridge-r1163-desktop-gallery-header']){
  assert.match(site,new RegExp(f+'\\.js\\?v=[^"]+&photographer=r1193&motion=r1187"'));
 }
});
