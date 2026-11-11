'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const helper=fs.readFileSync('scripts/r1608-chassis-state.js.txt','utf8');
const mobile=fs.readFileSync('dist/web/photobridge-r1764-chassis-order-mobile.js','utf8');
const thermal=fs.readFileSync('scripts/r1698-approved-site-thermal.js.txt','utf8');
const main=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
test('R1773 null stock stays unlimited, bulk checked against sum of physical copies',()=>{
 const fn=vm.runInNewContext(helper+';pb1773ChassisGroupShortage',{pbPrintCopies:f=>f.printCopies||1,Wr:()=>false});
 const group={files:[{printCopies:3},{printCopies:2}]};
 assert.equal(fn(group,{chassis_stock:null}),false);
 assert.equal(fn(group,{chassis_stock:5}),false);
 assert.equal(fn(group,{chassis_stock:4}),true);
 assert.equal(fn(group,{chassis_stock:0}),true);
 assert.equal(fn(group,{chassis_stock:'unknown'}),true);
 assert(main.includes('"data-pb1764-stock":oe==null?"unknown":oe.chassis_stock==null?"unlimited":oe.chassis_stock'));
 assert(main.includes('disabled:W||pb1773ChassisGroupShortage(ue,oe)'));
});
function photoScenario({stock,checked,copies}){
 const callbacks=[],hidden=checked.map(()=>false);
 const cls=(i)=>({contains:key=>key==='pb1764ChassisUnavailable'&&hidden[i],
  toggle:(key,flag)=>{if(key==='pb1764ChassisUnavailable')hidden[i]=flag}});
 let capture;
 const inputs=checked.map(start=>({checked:start,disabled:false}));
 const labels=inputs.map((input,i)=>({textContent:'شاسی',classList:cls(i),
  getAttribute:key=>key==='data-pb1765-copies'?String(copies[i]):null,
  querySelector:()=>input,closest:()=>card}));
 for(const input of inputs)input.click=()=>{let prevented=false;capture?.({
  target:input,preventDefault:()=>{prevented=true},stopImmediatePropagation(){}});
  if(!prevented)input.checked=!input.checked;
 };
 const master={disabled:false},group={querySelector:()=>master,getAttribute:()=>stock};
 const card={querySelector:key=>key==='.simplePrintCardAddonCheck.pb1608ChassisGroup'?group:null,
  querySelectorAll:key=>key==='.simplePrintPhotoAddonCheck'?labels:[master,{disabled:false}]};
 const document={readyState:'complete',getElementById:()=>({}),
  querySelectorAll:()=>[card],
  addEventListener:(name,fn)=>{if(name==='click')capture=fn}};
 vm.runInNewContext(mobile,{document,window:{},MutationObserver:class{observe(){}},requestAnimationFrame:fn=>callbacks.push(fn)});
 while(callbacks.length)callbacks.shift()();
 return {checked:inputs.map(x=>x.checked),hidden};
}
test('R1773 per-photo choices stay available with unlimited or partially stocked quantities',()=>{
 const all=photoScenario({stock:'unlimited',checked:[true,false],copies:[4,12]});
 assert.deepEqual(all,{checked:[true,false],hidden:[false,false]});
 const partial=photoScenario({stock:3,checked:[true,false],copies:[3,2]});
 assert.deepEqual(partial,{checked:[true,false],hidden:[false,true]});
 const zero=photoScenario({stock:0,checked:[true,true],copies:[1,1]});
 assert.deepEqual(zero,{checked:[false,false],hidden:[true,true]});
});
test('R1773 thermal printer labels ONLY chassis-selected items, with their copy count and price',()=>{
 const ctx={vh:t=>t.items||[],ph:i=>i.description||i.sizeLabel||'چاپ'};
 vm.createContext(ctx);vm.runInContext(thermal,ctx);
 const inv={number:123,lab_name:'نمونه',total:400000,subtotal:400000,items:[
  {description:'عکس ۱۰×۱۵',chassis:true,quantity:3,unitPrice:100000,lineTotal:300000},
  {description:'عکس ۲۰×۳۰',chassis:false,quantity:1,unitPrice:100000,lineTotal:100000}
 ]};
 for(const customer of [true,false]){
  const html=ctx.pbR1698ApprovedThermal(inv,customer);
  const desc=[...html.matchAll(/<tr><td class="desc">([^<]+)<\/td>/g)].map(x=>x[1]);
  assert.deepEqual(desc,['عکس ۱۰×۱۵ · شاسی','عکس ۲۰×۳۰']);
  assert(html.includes('<td class="qty">۳</td>'));
  assert(html.includes('<td class="qty">۱</td>'));
 }
});
test('R1773 site and Windows actual thermal assets include chassis-specific row label',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const ui=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  assert(ui.includes('pbR1698ApprovedThermal(t,pb1674DirectCustomer(t))'),root);
  assert(ui.includes('if(x.chassis===true&&!/(شاسی|chassis)/i.test(baseLabel))'),root);
 }
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert(html.includes('photobridge-r1764-chassis-order-mobile.js?v=r1773'));
});
