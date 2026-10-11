const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const shopper=fs.readFileSync('dist/web/photobridge-r1096-photographer-store.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1096-photographer-store.css','utf8');
const stock=fs.readFileSync('dist/web/photobridge-r1095-customer-stock.js','utf8');
const html=fs.readFileSync('dist/api/equipment-rental-book.html','utf8');

test('production storefront loads channel controls and typography exactly once',()=>{
 for(const url of ['/photobridge-r1096-photographer-store.js?v=1096','/photobridge-r1096-photographer-store.css?v=1096']){
  assert.equal(html.split(url).length-1,1,url);
 }
 assert.match(css,/#storeSectionNavV673 > button\[data-store-panel\]/);
 assert.match(css,/#equipmentPanel \.pbR68SubmitBtn/);
 assert.match(css,/#equipmentPanel \.pbR68FilterBtn b/);
 assert.match(css,/#equipmentPanel \.itemInfo b/);
 assert.match(css,/\.pbR63OfficeBtn/);
});
test('disabled rental/sales disappear per selected shop; all tabs restore for other shops',async()=>{
 let active='equipmentPanel';const navigated=[];
 const shopMap={
  saleOnly:{rental_enabled:false,sale_enabled:true},
  rentalOnly:{rental_enabled:true,sale_enabled:false},
  nothing:{rental_enabled:false,sale_enabled:false},
  both:{rental_enabled:true,sale_enabled:true}
 };
 function el(id){return {id,hidden:false,disabled:false,dataset:{storePanel:id},active:false,
   attributes:{},style:{properties:{},setProperty(k,v){this.properties[k]=v},removeProperty(k){delete this.properties[k]}},
   setAttribute(k,v){this.attributes[k]=v},removeAttribute(k){delete this.attributes[k]}}}
 const nav=['equipmentPanel','salesPanel','bookingsPanel','financePanel'].map(el);
 const home=['equipmentPanel','salesPanel'].map(el);
 const panels=new Map(['equipmentPanel','salesPanel'].map(id=>[id,el(id)]));
 const navRoot=el('nav');
 const getAll=selector=>{
  if(selector==='#storeSectionNavV673 > button[data-store-panel]')return nav;
  const match=selector.match(/^\[data-store-panel="(equipmentPanel|salesPanel)"\]$/);
  return match?[...nav,...home].filter(b=>b.dataset.storePanel===match[1]):[];
 };
 const document={readyState:'complete',addEventListener(){},
  querySelector(selector){
   if(selector==='#storeSectionNavV673')return navRoot;
   if(selector==='#equipmentPanel'||selector==='#salesPanel')return panels.get(selector.slice(1));
   if(selector==='#storeSectionNavV673 [data-store-panel].active')return nav.find(b=>b.active)||null;
   return null;
  },querySelectorAll:getAll};
 const context=vm.createContext({window:{},document,shopId:'',
  selectedShopRecord(){return shopMap[context.shopId]||null},
  renderShops(){return 42},
  openStoreSection(id){navigated.push(id);active=id;nav.forEach(b=>b.active=b.dataset.storePanel===id);return id},
  async selectShop(id){context.shopId=id;context.renderShops();context.openStoreSection('equipmentPanel');return id}
 });
 vm.runInContext(shopper,context);
 assert(nav.every(b=>!b.hidden),'all channels available in chooser');
 assert.equal(await context.selectShop('saleOnly'),'saleOnly');
 assert(nav[0].hidden&&!nav[1].hidden&&!nav[2].hidden&&!nav[3].hidden);
 assert(home[0].hidden&&!home[1].hidden);
 assert(panels.get('equipmentPanel').hidden);
 assert.equal(navigated.at(-1),'salesPanel');
 assert.match(navRoot.style.properties['grid-template-columns'],/repeat\(3,/);
 context.openStoreSection('equipmentPanel');assert.equal(navigated.at(-1),'salesPanel');
 await context.selectShop('rentalOnly');
 assert(!nav[0].hidden&&nav[1].hidden&&!home[0].hidden&&home[1].hidden);
 assert(!panels.get('equipmentPanel').hidden&&panels.get('salesPanel').hidden);
 context.openStoreSection('salesPanel');assert.equal(navigated.at(-1),'equipmentPanel');
 await context.selectShop('nothing');
 assert(nav[0].hidden&&nav[1].hidden&&!nav[2].hidden&&!nav[3].hidden);
 assert.equal(navigated.at(-1),'bookingsPanel');
 assert.match(navRoot.style.properties['grid-template-columns'],/repeat\(2,/);
 await context.selectShop('both');
 assert(!nav[0].hidden&&!nav[1].hidden&&!home[0].hidden&&!home[1].hidden);
 assert(!panels.get('equipmentPanel').hidden&&!panels.get('salesPanel').hidden);
 assert.match(navRoot.style.properties['grid-template-columns'],/repeat\(4,/);
});

test('strict stock refresh uses previous availability during periodic background validation',async()=>{
 const notes=[];let note=null,itemStock=null,clock=100000,requests=0,updates=0;
 const cb={value:'camera-1',checked:true,disabled:false};
 const qty={value:'1',disabled:false,max:'99'};
 const info={append(el){itemStock=el}};
 const card={classList:{toggle(){}},querySelector(selector){
  return selector==='input.pick'?cb:selector==='input.qty'?qty:selector==='.itemInfo'?info:selector==='.pbR1095ItemStock'?itemStock:null;
 }};
 const list={dataset:{},firstElementChild:card,parentElement:{insertBefore(el){note=el}}};
 const interval=[];
 const document={hidden:false,readyState:'complete',
  querySelector(s){return s==='#items'?list:s==='#pbR1095CustomerNote'?note:null},
  querySelectorAll(s){return s==='#items label.item'?[card]:[]},
  createElement(tag){return {classList:{toggle(){}},hidden:false,set textContent(v){if(tag==='div')notes.push(v);this._text=v},get textContent(){return this._text||''}}},
  addEventListener(){}
 };
 class FakeDate extends Date{static now(){return clock}}
 const context=vm.createContext({window:{},document,MutationObserver:class{observe(){}},
  setInterval(fn){interval.push(fn)},setTimeout(){},Date:FakeDate,console,
  items:[{id:'camera-1'}],
  selectedShopRecord(){return {customer_rental_stock_mode:'strict'}},
  requestBody(){return {shopId:'shop-a',startDate:'2026-10-13',endDate:'2026-10-14',items:[{itemId:'camera-1',quantity:1}]}},
  async api(){requests++;return {available:true,items:[{itemId:'camera-1',available:2,valid:true}]}},
  updateRentalCartCountV810(){updates++}
 });
 vm.runInContext(stock,context);
 const flush=async()=>{await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r))};
 await flush();
 assert.equal(requests,1);assert.equal(qty.max,'2');assert(!cb.disabled);
 const initialNotes=notes.length;
 for(let i=0;i<6;i++){interval[0]();await flush()}
 assert.equal(requests,1);assert.equal(notes.length,initialNotes,'idle ticks do not repaint note');
 clock+=16000;interval[0]();await flush();
 assert.equal(requests,2);assert.equal(notes.length,initialNotes,'background fetch does not blank or repaint stock');
 assert.equal(qty.max,'2');assert(cb.checked&&!cb.disabled);
 assert(updates<=3,'no periodic cart repaint');
});
