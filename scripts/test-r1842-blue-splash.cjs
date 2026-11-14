const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('dist/web/index.html','utf8');
const css=fs.readFileSync('scripts/r1842-blue-splash.css','utf8');
const js=fs.readFileSync('scripts/r1842-blue-splash.js','utf8');
const manifest=JSON.parse(fs.readFileSync('dist/web/photobridge.webmanifest','utf8'));

test('R1842: one supplied animated blue splash replaces all previous web launch overlays',()=>{
 assert.equal((html.match(/id="pb-splash"/g)||[]).length,1);
 assert(html.includes('id="pb1842SplashPrepaint"'));
 assert(html.includes('id="pb1842BlueSplashStyle"'));
 assert(html.includes('id="pb1842SplashRuntime"'));
 assert(html.includes('id="pbIrisMask"')&&html.includes('pb1842-wordmark'));
 assert(html.includes('id="pb-status"')&&html.includes('id="pb1842-fill"'));
 assert(!html.includes('id="pbR1361MobileSplash"'));
 assert(!html.includes('id="pb1479LaunchBoot"'));
 assert(!html.includes('id="pb1479ApprovedLaunch"'));
 assert(!html.includes('id="pbR1361MobileSplashStyle"'));
 assert(html.includes('id="root"'));
 assert.equal((html.match(/id="root"/g)||[]).length,1);
 assert(html.includes('photobridge-r100f5-entry-routing.js'),'keep original routing');
 assert(html.includes('photobridge-r1776-login-password-clearance.css'),'keep mobile password fix');
 assert(html.includes('photobridge-r1841-login-blue.css'),'keep login color theme');
 assert(!html.includes('/src/main.jsx'),'do not use demo React bootstrap');
 assert(html.includes('photobridge.webmanifest?v=r1842'));
});

test('R1842: animation implements supplied iris/flash/progress with safe mobile-only gating',()=>{
 for(const x of ['#071f47','#0a2f6b','#1553b0','#2f7fe0','pb1842_pbIris','pb1842_pbFlash','pb1842_pbShimmer'])
  assert(css.includes(x),x);
 assert(css.includes('html.pb1842SplashActive #pb-splash'));
 assert(!css.includes('html.pb-lock'),'never lock browser globally');
 assert(js.includes('window.PhotoBridgeSplash'));
 assert(js.includes('photobridge:ready'));
 assert(js.includes('__PB1836RoleHandoff'));
 assert(js.includes('pb1493SessionResumePending'));
 assert(js.includes('pb1721MobileEntryPending'));
 assert(!js.includes('document.querySelectorAll(sel)'),'do not delete live app loading states');
 assert(!js.includes('pb-demo'),'no independent demo screen');
 new vm.Script(js);
});

test('R1842: PWA splash background is blue without changing icon identity',()=>{
 assert.equal(manifest.name,'PhotoBridge');
 assert.equal(manifest.id,'/photobridge-pwa');
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.background_color,'#071f47');
 assert.equal(manifest.theme_color,'#071f47');
 assert.deepEqual(manifest.icons.map(x=>x.purpose),['any','maskable','any','maskable']);
 for(const icon of manifest.icons)assert(icon.src.includes('r1838.png'),'installed app icon should be preserved');
});

test('R1842: ordinary desktop/browser entry runs no splash controller',()=>{
 const state={init:false};
 const window={};
 Object.defineProperty(window,'__pbSplashInit',{set(){state.init=true},get(){return state.init}});
 vm.runInNewContext(js,{window,document:{documentElement:{classList:{contains:()=>false}}}});
 assert.equal(state.init,false);
});

test('R1842: explicit ready signal ends the standalone splash without changing root',()=>{
 const classes=new Set(['pb1842SplashActive']),callbacks=[],timers=[];
 let now=0;
 const mkClassList=()=>({add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x)});
 const splash={hidden:false,style:{},offsetWidth:100,classList:mkClassList(),setAttribute(){},removeAttribute(){}};
 const fill={style:{}},track={setAttribute(){}},pct={textContent:''},status={textContent:''};
 const root={childElementCount:0,offsetHeight:100,firstElementChild:null};
 const refs={'pb-splash':splash,'pb1842-fill':fill,'pb1842-track':track,'pb-pct':pct,'pb-status':status,'root':root};
 const theme={value:'#dff2f6',getAttribute(){return this.value},setAttribute(k,v){this.value=v}};
 const doc={documentElement:{classList:mkClassList()},getElementById:k=>refs[k],querySelector:()=>theme};
 const win={matchMedia:()=>({matches:true}),addEventListener:(name,fn)=>callbacks.push([name,fn])};
 let observer;
 class MutationObserver{constructor(fn){this.fn=fn;observer=this}observe(){}disconnect(){this.closed=true}}
 const context={window:win,document:doc,MutationObserver,performance:{now:()=>now},
   setTimeout:(fn,ms)=>{const obj={fn,at:now+ms};timers.push(obj);return obj},
   clearTimeout:obj=>{const i=timers.indexOf(obj);if(i>=0)timers.splice(i,1)},
   requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}};
 vm.runInNewContext(js,context);
 assert(win.PhotoBridgeSplash);
 assert.equal(classes.has('pb1842SplashActive'),true);
 win.PhotoBridgeSplash.done();
 while(true){
   timers.sort((a,b)=>a.at-b.at);
   if(!timers.length||timers[0].at>6000)break;
   const item=timers.shift();now=item.at;item.fn();
 }
 assert.equal(splash.hidden,true);
 assert.equal(classes.has('pb1842SplashActive'),false);
 assert.equal(root.offsetHeight,100);
 assert.equal(theme.value,'#dff2f6');
 assert(observer.closed);
});
