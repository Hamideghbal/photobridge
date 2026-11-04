'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');

const browserFile='dist/web/photobridge-r1592-order-fly.js';
const cssFile='dist/web/photobridge-r1592-order-fly.css';
const html='dist/web/index.html';
const ui='dist/web/assets/index-UIRefine-v655-r84.js';

function setup({reduced=false,hidden=false}={}){
  const cssCalls=[],classes=new Set(),events={};
  const style=()=>({setProperty(){},removeProperty(){}});
  const target={isConnected:true,offsetWidth:102,classList:{add:s=>classes.add(s),remove:s=>classes.delete(s)},
    getBoundingClientRect:()=>({left:420,top:35,width:112,height:32})};
  const buttons=Array.from({length:4},()=>target);
  const original={isConnected:true,dataset:{orderId:'an-order-1'},style:style(),
    animate(){return{}},
    getBoundingClientRect:()=>({left:30,top:310,width:600,height:110,bottom:420}),
    cloneNode(){
      return {isConnected:false,style:style(),classList:{add:s=>cssCalls.push(s)},
        setAttribute(){},removeAttribute(){},querySelectorAll(){return[]},
        remove(){this.isConnected=false},
        animate(frames,options){
          assert(frames.length===4);
          assert.equal(options.duration,670);
          return {addEventListener:(k,cb)=>{events[k]=cb}};
        }
      };
    }
  };
  const root={querySelectorAll:()=>[original]};
  const document={
    documentElement:{matches:()=>true},
    visibilityState:hidden?'hidden':'visible',
    querySelectorAll(selector){if(selector.includes('Statuses'))return buttons;return[]},
    querySelector(selector){if(selector==='#root .liveCustomerOrders')return root;return null},
    body:{appendChild(ghost){ghost.isConnected=true;this.ghost=ghost}}
  };
  const window={innerHeight:900,setTimeout(fn){fn()},console:{debug(){}},
    matchMedia(q){return {matches:q.includes('prefers-reduced-motion')?reduced:true}}};
  vm.runInNewContext(fs.readFileSync(browserFile,'utf8'),{window,document,console});
  return {window,document,events,classes,original,cssCalls};
}

test('real print order flies into READY status while current tab stays untouched',()=>{
  const t=setup();
  assert.equal(t.window.PB1592FlyOrder({orderId:'an-order-1',mode:'print',target:'ready'}),true);
  assert(t.document.body.ghost?.isConnected);
  assert(t.events.finish);
  t.events.finish();
  assert(!t.document.body.ghost.isConnected);
  assert(t.classes.has('pb1592TabReceivedOrder')===false); // timeout clears class
});

test('album order flies into COMPLETED destination; invalid cards do not animate',()=>{
  const t=setup();
  assert.equal(t.window.PB1592FlyOrder({orderId:'an-order-1',mode:'album',target:'completed'}),true);
  t.events.finish();
  assert.equal(t.window.PB1592FlyOrder({orderId:'wrong',mode:'album',target:'completed'}),false);
});

test('reduced motion or hidden tab disables flight without hiding live card',()=>{
  for(const option of [{reduced:true},{hidden:true}]){
    const t=setup(option);
    assert.equal(t.window.PB1592FlyOrder({orderId:'an-order-1',mode:'print',target:'ready'}),false);
    assert(!t.document.body.ghost);
  }
});

test('React data refresh drives animation; no automatic switch on READY',()=>{
  execFileSync(process.execPath,['--check',ui],{stdio:'pipe'});
  execFileSync(process.execPath,['--check',browserFile],{stdio:'pipe'});
  const s=fs.readFileSync(ui,'utf8');
  const start=s.indexOf('function Zg('),end=s.indexOf('function wv(',start);
  assert(start>=0&&end>start);
  const chunk=s.slice(start,end);
  assert(chunk.includes('PB1592Active.current=a'));
  assert(chunk.includes('PB1592Bucket'));
  assert(chunk.includes('PB1592FlyOrder?.({orderId:String(H.id),mode:l,target:PB1592Bucket(newStatus)})'));
  assert(!chunk.includes('s("ready"),E('),'ready event must not change filter');
  assert(chunk.includes('تب فعلی بدون تغییر باقی می‌ماند'));
});

test('motion assets delivered once AFTER prior R1591 CSS; responsive safety',()=>{
  const page=fs.readFileSync(html,'utf8');
  for(const marker of ['/photobridge-r1592-order-fly.js?v=r1592','/photobridge-r1592-order-fly.css?v=r1592'])
    assert.equal(page.split(marker).length-1,1);
  assert(page.indexOf('/photobridge-r1592-order-fly.css')>page.indexOf('/photobridge-r1591-desktop-print-four-section.css'));
  const css=fs.readFileSync(cssFile,'utf8');
  assert(css.includes('prefers-reduced-motion:reduce'));
  assert(css.includes('pb1592TabReceived'));
  const before=fs.readFileSync(html,'utf8');
  execFileSync(process.execPath,['scripts/enable-r1592-photographer-order-fly.mjs'],{stdio:'pipe'});
  assert.equal(before,fs.readFileSync(html,'utf8'),'no duplicate assets on repeated builds');
});
