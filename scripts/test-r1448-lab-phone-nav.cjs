const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('dist/web/photobridge-r1448-lab-phone-nav.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1448-lab-phone-nav.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
function boot(ua,phone=true,path='/lab/album'){
  const events={},called={print:0,finance:0,archive:0};
  const buttons=['print','finance','archive'].map(key=>({
    key,attrs:{'data-pb1448-mode':key},classList:{toggle(name,enabled){if(name==='active')this.active=enabled}},
    getAttribute(name){return this.attrs[name]},setAttribute(name,value){this.attrs[name]=value},removeAttribute(name){delete this.attrs[name]}
  }));
  let nav=null,navHtml='',enabled=false,appendCount=0,removedCount=0;
  const document={
    readyState:'complete',
    body:{appendChild(node){appendCount++;nav=node}},
    documentElement:{classList:{toggle(name,value){if(name==='pb1448LabPhoneMode')enabled=value}}},
    createElement(tag){assert.equal(tag,'nav');return {
      className:'',setAttribute(){},
      set innerHTML(value){navHtml=value},get innerHTML(){return navHtml},
      listeners:{},addEventListener(name,fn){this.listeners[name]=fn},
      contains(button){return buttons.includes(button)},querySelectorAll(){return buttons},
      remove(){removedCount++}
    }},
    querySelector(selector){
      if(selector==='.labRoleWorkspace main.appWorkspacePage .labSingleHeader')return {};
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
  vm.runInNewContext(script,{navigator:{userAgent:ua},window,document,MutationObserver:class{observe(){} }});
  return {window,buttons,called,events,get nav(){return nav},get navHtml(){return navHtml},get enabled(){return enabled},get appendCount(){return appendCount},get removedCount(){return removedCount}};
}
const winUA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129 Electron/31';
const androidUA='Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit Chrome/129';
test('Windows app and narrow Windows browser never mount or style new navigation',()=>{
  for(const ua of [winUA,'Mozilla/5.0 (Windows NT 10.0; Touch; Win64; x64) Chrome/129']){
    const result=boot(ua,true);
    assert.equal(result.appendCount,0);
    assert.equal(result.enabled,false);
    assert.equal(Object.keys(result.events).length,0);
  }
  assert(css.includes('@media (max-width:820px) and (pointer:coarse)'));
  for(const rule of css.split('\n').filter(line=>line.trim().startsWith('html.')))
    assert(rule.includes('html.pb1448LabPhoneMode'),rule);
});
test('phone navigation is 3 buttons, grouped print/album activates print, and finance/archive forward to original React handlers',()=>{
  const screen=boot(androidUA,true,'/lab/album');
  assert.equal(screen.appendCount,1);
  assert.equal(screen.enabled,true);
  for(const label of ['چاپ','امور مالی','آرشیو'])assert(screen.navHtml.includes('>'+label+'</em>'));
  assert.equal((screen.navHtml.match(/<button\b/g)||[]).length,3);
  assert(screen.buttons[0].classList.active);
  assert.equal(screen.buttons[0].attrs['aria-current'],'page');
  screen.nav.listeners.click({target:{closest(){return screen.buttons[1]}}});
  assert.equal(screen.called.finance,1);
  screen.window.location.pathname='/lab/finance/statement';
  screen.events.popstate();
  assert.equal(screen.buttons[1].classList.active,true);
  assert.equal(screen.buttons[0].classList.active,false);
  screen.nav.listeners.click({target:{closest(){return screen.buttons[2]}}});
  assert.equal(screen.called.archive,1);
  screen.nav.listeners.click({target:{closest(){return screen.buttons[0]}}});
  assert.equal(screen.called.print,1);
});
test('phone-width and coarse pointer both required; wide mobile view does not replace existing nav',()=>{
  const screen=boot(androidUA,false,'/lab/orders');
  assert.equal(screen.appendCount,0);
  assert.equal(screen.enabled,false);
});
test('two real top tabs still reachable when print group is active; no changes to React UI or Windows snapshots',()=>{
  assert(css.includes('main.labPrimaryConnectorMode .labSingleHeader .labHeaderNav.roleHeaderPrimary>.labDesktopPrimaryNav'));
  assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'));
  assert(css.includes('main.labPrimaryConnectorMode .labSingleHeader .labHeaderNav.roleHeaderPrimary>.labMobileTopUtility'));
  assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))!important'));
  assert(script.includes('.labPrintTopNav'));
  assert(script.includes('.labFinanceHeaderBtn'));
  assert(script.includes('.labArchiveHeaderBtn'));
  const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
  const desktop=build.indexOf('verify-lab-desktop-ui-freshness.mjs');
  const wire=build.indexOf('test-r1351-lab-ui-exact-byte-serving.cjs');
  const phone=build.indexOf('enable-r1448-lab-phone-nav.mjs');
  assert(desktop>0&&wire>desktop&&phone>wire,'mobile patch must run after frozen Windows manifest verification');
});
test('mobile assets registered with fixed-name cache version and valid browser syntax',()=>{
  new vm.Script(script);
  assert(html.includes('/photobridge-r1448-lab-phone-nav.css?v=r1448'));
  assert(html.includes('/photobridge-r1448-lab-phone-nav.js?v=r1448'));
});