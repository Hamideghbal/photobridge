const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const react=read('dist/web/assets/index-UIRefine-v655-r84.js');
const store=read('dist/api/equipment-rental-portal.html'),book=read('dist/api/equipment-rental-book.html');
const index=read('dist/web/index.html'),css=read('dist/web/photobridge-r1192-mobile-pwa-tab-stability.css');
const motion=read('dist/web/photobridge-v904r100f27-header-calendar-motion.js');
test('lab mobile, desktop and PWA all switch status without the legacy 900ms timer',async()=>{
 const a=react.indexOf('const ee=(le,nt,xt)=>'),b=react.indexOf(',Q=async(le,nt=!1)=>',a);
 assert(a>=0&&b>a);
 const part=react.slice(a,b);
 assert(!part.includes('setTimeout'), 'no animation timers in queue selection on either device');
 const run=Function('ue','window','R','return ('+part.slice('const ee='.length)+')');
 for(const mobile of [false,true]){
  const phases=[],pending=[],win={matchMedia:()=>({matches:!mobile}),clearTimeout:()=>{},setTimeout:(cb,ms)=>{pending.push(ms);return 1}};
  const select=run({current:null},win,x=>phases.push(x.phase));
  let count=0;
  await select('flow','ready',()=>count++);
  assert.equal(count,1);
  assert.equal(pending.length,0);
  assert.equal(phases.at(-1),'idle');
 }
});
test('lab order cards render immediately in batches instead of one per 105ms',()=>{
 assert(react.includes('let le=Math.min(Be.length,24);Ge(le)'));
 assert(react.includes('le=Math.min(Be.length,le+24)'));
 assert(!react.includes('const nt=window.setTimeout(()=>Ge(1),35)'));
});
test('mobile queue animations are canceled in all phases',()=>{
 for(const s of ['.labOrderScrollArea.queuePageTurn','.labOrderScrollArea.queuePageTurn.forward','.labOrderScrollArea.queuePageTurn.backward','.labOrderScrollArea.queuePageTurn.idle'])
  assert(css.includes(s),s);
 assert(css.includes('animation:none!important;')&&css.includes('transform:none!important;'));
 assert(css.includes('.labOrderCard.orderEnterFade'));
 assert(!css.includes('pointer:fine'));
});
test('Store mobile panel avoids forced layout and double-frame animation restart',()=>{
 assert(motion.includes('R1192 mobile tab reflow removed'));
 assert(!motion.includes('void panel.offsetWidth'));
 assert(!motion.includes('restartPanelAnimation'));
 assert(!motion.includes('requestAnimationFrame(()=>requestAnimationFrame(()=>restartPanelAnimation'));
 for(const s of ['html body.rentalAppReady #app>.panel.active','html body #storePhotographerWorkspace .rentalPanel.mobileActive'])
  assert(css.includes(s),s);
 assert(css.includes('translate:none!important'));
 assert(!css.includes('pbR100F96MovingIndicator'));
});
test('mobile website and Store assets use new URL to avoid stale PWA caches',()=>{
 for(const p of [index,store,book])assert(p.includes('/photobridge-r1192-mobile-pwa-tab-stability.css?v=r1192'));
 assert.match(index,/index-UIRefine-v655-r84\.js\?v=[^"]+&touch=r1192"/);
 assert.match(book,/photobridge-v904r100f27-header-calendar-motion\.js\?v=[^"]+&touch=r1192"/);
});
