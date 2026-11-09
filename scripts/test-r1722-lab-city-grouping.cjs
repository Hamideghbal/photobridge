'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('dist/web/photobridge-v904r99-lab-chooser.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');

function fixture({cityA='تهران',cityB='اصفهان',includeB=true,unknown=false}={}){
  const members=[
    {id:'a',name:'چاپ الف',city:cityA,province:'تهران',active:true,selected:true},
    {id:'b',name:'چاپ ب',city:cityA,province:'تهران',active:true}
  ];
  const labs=members.map(x=>({...x,connected:true}));
  if(includeB)labs.push({id:'c',name:'چاپ ج',city:cityB,province:'اصفهان',connected:false});
  if(unknown)labs.push({id:'d',name:'چاپ بدون شهر',city:'',connected:false});
  return {primaryLabId:'a',activeLabId:'a',canDiscoverLabs:true,memberships:members,labs};
}
function harness(data){
  let calls=0,root=null,style=null;
  const board={innerHTML:''},events={};
  const attrs={
    classList:{add(){},remove(){}},
    style:{}
  };
  const document={
    readyState:'loading',hidden:false,
    body:{...attrs,appendChild(node){if(node.id==='pbR99LabChooser')root=node}},
    head:{appendChild(node){if(node.id==='pbR99LabChooserStyle')style=node}},
    documentElement:{style:{},classList:{remove(){}}},
    createElement(){
      return {id:'',dataset:{},innerHTML:'',textContent:'',listeners:{},
        setAttribute(){},
        addEventListener(event,fn){this.listeners[event]=fn},
        querySelector(selector){return selector==='.pbR99LabBoard'?board:null},
        remove(){root=null}
      };
    },
    getElementById(id){
      return id==='pbR99LabChooser'?root:id==='pbR99LabChooserStyle'?style:null;
    },
    querySelector(){return null},
    addEventListener(event,fn){events['document:'+event]=fn}
  };
  const location={
    pathname:'/photographer/orders/flow',
    search:'?workspace=print&pbLabChooser=1',
    origin:'https://photobridge.ir',
    href:'https://photobridge.ir/photographer/orders/flow?workspace=print&pbLabChooser=1'
  };
  const window={__pbR100F5PrimaryLab:''};
  const sessionStorage={getItem(){return null},setItem(){}};
  const history={pushState(){},replaceState(){}};
  const fetch=async url=>{
    assert.equal(url,'/api/customer/labs');
    calls++;
    return {ok:true,json:async()=>data};
  };
  const addEventListener=(event,fn)=>events['window:'+event]=fn;
  const queueMicrotask=fn=>Promise.resolve().then(fn);
  vm.runInNewContext(script,{
    window,document,location,sessionStorage,history,fetch,addEventListener,queueMicrotask,
    setInterval(){},setTimeout(){},URLSearchParams,console:{warn(){}}
  },{timeout:2000});
  const flush=async()=>{for(let i=0;i<28;i++)await Promise.resolve()};
  return {
    async start(){events['document:DOMContentLoaded']();await flush()},
    async refresh(){events['window:focus']();await flush()},
    clickCity(key){
      assert(root&&root.listeners.click,'lab chooser must own click handler');
      root.listeners.click({target:{closest(selector){
        return selector==='[data-lab-city]'?{dataset:{labCity:key}}:null;
      }}});
    },
    html:()=>board.innerHTML,
    css:()=>style?.textContent||'',
    calls:()=>calls
  };
}

test('one lab, one registered city, and one city with unknown labels keep the original list',async()=>{
  for(const config of [
    {includeB:false},
    {includeB:false,unknown:true},
    {cityA:'تهران',cityB:' تهران ',includeB:true},
    {cityA:'كاشان',cityB:'کاشان',includeB:true}
  ]){
    const h=harness(fixture(config));await h.start();
    assert(!h.html().includes('pbR99CityChooser'),'no city selector for one real city');
    assert(h.html().includes('چاپ الف'));
    assert(h.html().includes('چاپ ب'));
    if(config.includeB)assert(h.html().includes('چاپ ج'));
  }
});
test('different cities expose city buttons; active lab city is selected by default',async()=>{
  const h=harness(fixture());
  await h.start();
  assert(h.html().includes('pbR99CityChooser'));
  assert(h.html().includes('data-lab-city="تهران" aria-pressed="true"'));
  assert(h.html().includes('data-lab-city="اصفهان" aria-pressed="false"'));
  assert(h.html().includes('چاپ الف'));
  assert(!h.html().includes('چاپ ج'));
  assert(h.html().includes('data-select="a"'),'connected lab action unchanged');
  h.clickCity('اصفهان');
  assert(h.html().includes('data-lab-city="اصفهان" aria-pressed="true"'));
  assert(h.html().includes('چاپ ج'));
  assert(!h.html().includes('چاپ الف'));
  assert(h.html().includes('data-request="c"'),'request lab action unchanged');
  assert.equal(h.calls(),1,'switching city never refetches the list');
  await h.refresh();
  assert(h.html().includes('چاپ ج'),'background refresh preserves selected city');
  assert.equal(h.calls(),2);
});
test('normalization prevents duplicate city tabs; unknown city remains selectable with 2 real cities',async()=>{
  const data=fixture({cityA:'تهران',cityB:'اصفهان',unknown:true});
  data.labs.push({id:'e',name:'چاپ ی',city:' اصفهان ',connected:false});
  const h=harness(data);await h.start();
  assert.equal(h.html().split('data-lab-city="اصفهان"').length-1,1);
  assert(h.html().includes('data-lab-city="__pb_city_unregistered__"'));
  h.clickCity('__pb_city_unregistered__');
  assert(h.html().includes('چاپ بدون شهر'));
  assert(!h.html().includes('چاپ الف'));
  h.clickCity('اصفهان');
  assert(h.html().includes('چاپ ج'));
  assert(h.html().includes('چاپ ی'));
});
test('HTML-unsafe city names are escaped in labels and attribute keys',async()=>{
  const data=fixture({cityB:'<img src=x onerror=alert(1)>'});
  const h=harness(data);await h.start();
  assert(h.html().includes('&lt;img'));
  assert(!h.html().includes('<img src=x onerror'));
});
test('responsive city filter works on web and keeps old chooser handlers',()=>{
  assert(script.includes('/* PB1722 city filters */'));
  assert(script.includes('PB1722 city selector shared by mobile and desktop'));
  assert(script.includes('@media(max-width:820px){.pbR99CityChooser'));
  assert(script.includes("const sel=e.target.closest('[data-select]')"));
  assert(script.includes("const req=e.target.closest('[data-request]')"));
  assert.equal(html.split('photobridge-v904r99-lab-chooser.js?v=r1722').length-1,1);
});
