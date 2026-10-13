const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const lab=read('dist/web/assets/index-UIRefine-v655-r84.js');
const store=read('dist/api/equipment-rental-portal.html');
const book=read('dist/api/equipment-rental-book.html');
const css=read('dist/web/photobridge-r1190-desktop-tab-stability.css');
const index=read('dist/web/index.html');

test('lab order tabs have no 340ms exit plus 560ms entry timer',async()=>{
 const begin=lab.indexOf('const ee=(le,nt,xt)=>'),end=lab.indexOf(',Q=async(le,nt=!1)=>',begin);
 assert(begin>=0&&end>begin);
 const src=lab.slice(begin,end);
 if(!src.includes('R1191 preserve mobile'))assert(!src.includes('setTimeout'),'desktop tab must not wait for an obsolete animation');else assert(src.includes('window.matchMedia("(min-width:821px) and (hover:hover) and (pointer:fine)").matches'));
 assert(src.includes('phase:"idle"'));
 assert(src.includes('xt();'));
 const ee=Function('ue','window','R','return ('+src.slice('const ee='.length)+')')({current:null},{clearTimeout:()=>{},matchMedia:()=>({matches:true})},()=>{});
 let called=0;
 await ee('flow','completed',()=>called++);
 assert.equal(called,1,'switching to another status occurs immediately');
 await ee('completed','flow',()=>called++);
 assert.equal(called,2,'returning occurs immediately');
});
test('order card list starts with a batch rather than one card every 105ms',()=>{
 assert(!lab.includes('const nt=window.setTimeout(()=>Ge(1),35)'));
 assert(!lab.includes('Ge(Math.min(Be.length,le+1))'));
 assert(lab.includes('let le=Math.min(Be.length,24);Ge(le)'));
 assert(lab.includes('le=Math.min(Be.length,le+24)'));
 assert(lab.includes('cancelAnimationFrame(nt)'));
});
test('store owner content no longer receives separate translated Web Animations on tab clicks',()=>{
 const at=store.indexOf('<script id="pb918SharedTabMotion">');
 assert(at>0);
 const code=store.slice(at,store.indexOf('</script>',at));
 assert(code.includes('function reveal(root){return /* PB1190 no whole-content motion */;}'));
 assert(code.includes('animate(button,'),'interactive button feedback is retained');
 assert(!code.includes("translate:'0 -4px'"));
 assert(store.includes('html body.rentalAppReady .panel.active{animation:pbR100F96PanelIn'), 'original animation exists but is overridden by appended CSS');
});
test('desktop-only Store CSS cancels entire pane transitions and preserves mobile/header motion',()=>{
 assert.match(css,/@media \(min-width:851px\) and \(hover:hover\) and \(pointer:fine\)/);
 for(const selector of ['#app>.panel.active','#storePhotographerWorkspace .rentalPanel.mobileActive']){
  assert(css.includes(selector));
 }
 assert(css.includes('animation:none!important'));
 assert(css.includes('translate:none!important'));
 assert(!css.includes('pbR100F96MovingIndicator'));
 assert(!css.includes('#rentalDesktopPrimaryNav'));
 const url='/photobridge-r1190-desktop-tab-stability.css?v=r1190';
 assert(store.includes(url));
 assert(book.includes(url));
});
test('new site React JS query prevents stale tab delays from browser cache',()=>{
 assert.match(index,/index-UIRefine-v655-r84\.js\?v=[^"]+&speed=r1190"/);
});
