const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const script=fs.readFileSync('dist/web/photobridge-r1482-lab-mobile.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1482-lab-mobile.css','utf8');
function boot(ua,phone=true,path='/lab/album',initialRoot=true){
  const events={},called={print:0,finance:0,archive:0};
  const buttons=['print','finance','archive'].map(key=>({
    key,attrs:{'data-pb1482-mode':key},classList:{toggle(name,enabled){if(name==='active')this.active=enabled}},
    getAttribute(name){return this.attrs[name]},setAttribute(name,value){this.attrs[name]=value},removeAttribute(name){delete this.attrs[name]}
  }));
  let nav=null,navHtml='',enabled=false,appendCount=0,removedCount=0,hasRoot=initialRoot,mutation;
  const document={
    readyState:'complete',
    body:{appendChild(node){appendCount++;nav=node}},
    documentElement:{classList:{toggle(name,value){if(name==='pb1482LabPhoneMode')enabled=value}}},
    createElement(tag){assert.equal(tag,'nav');return {
      className:'',setAttribute(){},
      set innerHTML(value){navHtml=value},get innerHTML(){return navHtml},
      listeners:{},addEventListener(name,fn){this.listeners[name]=fn},
      contains(button){return buttons.includes(button)},querySelectorAll(){return buttons},
      remove(){removedCount++}
    }},
    querySelector(selector){
      if(selector==='.labRoleWorkspace main.appWorkspacePage .labSingleHeader')return hasRoot?{}:null;
      for(const [key,target] of [['print','.labPrintTopNav'],['finance','.labFinanceHeaderBtn'],['archive','.labArchiveHeaderBtn']])
        if(selector.includes(target))return {click(){called[key]++}};
      return null;
    }
  };
  const window={
    location:{pathname:path},
    matchMedia:()=>({matches:phone,addEventListener(name,fn){events['media:'+name]=fn}}),
    requestAnimationFrame(fn){fn()},
    addEventListener(name,fn){events[name]=fn}
  };
  vm.runInNewContext(script,{navigator:{userAgent:ua},window,document,MutationObserver:class{constructor(fn){mutation=fn}observe(){} }});
  return {setRoot(value){hasRoot=value;mutation()},window,buttons,called,events,get nav(){return nav},get navHtml(){return navHtml},get enabled(){return enabled},get appendCount(){return appendCount},get removedCount(){return removedCount}};
}

const android='Mozilla/5.0 (Linux; Android 14; Mobile) Chrome/129';
test('three self-contained icons route through original handlers and back/forward selects current mode',()=>{
 const app=boot(android,true,'/lab/album');
 assert.equal(app.appendCount,1);assert(app.enabled);assert.equal((app.navHtml.match(/<button\b/g)||[]).length,3);assert.equal((app.navHtml.match(/<svg\b/g)||[]).length,3);
 assert.equal(app.nav.className,'pb1482LabPhoneDock');assert(app.buttons[0].classList.active);
 const click=i=>app.nav.listeners.click({target:{closest(){return app.buttons[i]}}});
 click(0);assert.equal(app.called.print,0,'current album is preserved');click(1);assert.equal(app.called.finance,1);
 app.window.location.pathname='/lab/finance/statement';app.events.popstate();assert(app.buttons[1].classList.active);assert(!app.buttons[0].classList.active);
 click(2);assert.equal(app.called.archive,1);click(0);assert.equal(app.called.print,1);
 app.window.location.pathname='/lab/archive';app.events.popstate();assert.equal(app.buttons[2].attrs['aria-current'],'page');
 for(let i=0;i<5;i++)app.events.pageshow();assert.equal(app.appendCount,1);
 app.setRoot(false);assert(!app.enabled);assert.equal(app.removedCount,1);
 app.setRoot(true);assert(app.enabled);assert.equal(app.appendCount,2);
});
test('mobile layout never activates in Windows/Electron, desktop, login or photographer workspace',()=>{
 for(const ua of ['Windows NT 10.0; Touch','Electron/31 Android','Mozilla/5.0 (X11; Linux x86_64)'])assert.equal(boot(ua).appendCount,0);
 assert.equal(boot(android,false).appendCount,0);
 assert.equal(boot(android,true,'/photographer/orders',false).appendCount,0);
 assert.equal(boot(android,true,'/lab/login',false).appendCount,0);
 new vm.Script(script);
});
test('one top mode row, visible compact real timeline, safe-area dock and existing payment actions retained',()=>{
 assert(css.includes('main.pb1151PrintPage>.pb1151PrintModes'));assert(css.includes('main.pageMain>nav.labBottomAppNav.labMobileUtilityRail.labBottomAppNav'));assert(css.includes('main.appWorkspacePage.pb1151PrintPage{padding-top:calc'));assert(css.includes('.mobileOrderDisclosureToggle{display:none'));
 assert(css.includes('.mobileOrderDisclosureBody{display:grid'));assert(css.includes('grid-auto-columns:minmax(56px,1fr)'));
 assert(css.includes('env(safe-area-inset-bottom,0px)'));
 // Every selector is opt-in; neither photographer nor native snapshots inherit it.
 for(const line of css.split('\n').filter(l=>l.trim().startsWith('html.')))assert(line.trim().startsWith('html.pb1482LabPhoneMode'));
 const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 for(const label of ['labActionTimeline','aa(le,Jt.key)','disabled:!!E||(!pb1483Phone()&&!Bt)','labPrepayOrderNotice','downloadResumeInline','miniInvoiceBtn','miniDetailBtn'])assert(ui.includes(label),label);
});
test('new assets replace old loader once and ship after frozen desktop snapshot',()=>{
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert(!html.includes('src="/photobridge-r1448-lab-phone-nav.js'));
 assert.equal((html.match(/src="\/photobridge-r1482-lab-mobile.js/g)||[]).length,1);
 assert(html.includes('/photobridge-r1482-lab-mobile.css?v=r1482'));
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');assert(build.indexOf('enable-r1482-lab-mobile.mjs')>build.indexOf('test-r1448-lab-phone-nav.cjs'));
});
