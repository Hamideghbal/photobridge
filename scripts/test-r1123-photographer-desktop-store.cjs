const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('dist/api/equipment-rental-book.html','utf8');
test('desktop header replaces global photographer nav with Store sections and back',()=>{
 const start=html.indexOf('<div id="pbR1123StoreDesktopNav"');
 const header=html.slice(start,html.indexOf('</div>',start)+6);
 assert.ok(start>=0,'desktop header exists');
 for(const [name,id] of [['اجاره','equipmentPanel'],['فروش','salesPanel'],['آفیش','bookingsPanel'],['مالی','financePanel']]){
  assert.ok(header.includes('data-store-panel="'+id+'">'+name),id)
 }
 assert.ok(header.includes('id="pbR1123StoreBack" href="/photographer"'));
 assert.ok(html.includes('body.rentalPhotographerMode #storeSectionNavV673{display:none!important}'));
 assert.ok(html.includes('#app>.rentalPanel:not(.mobileActive){display:none!important}'));
 assert.ok(html.includes('@media(max-width:820px){#pbR1123StoreDesktopNav{display:none!important}}'));
});
function route(mobile,id){
 const source=html.slice(html.indexOf('function showMobilePanel(id){'),html.indexOf('async function boot(){'));
 assert.ok(source.startsWith('function showMobilePanel(id){'));
 const ids=['storePanel','equipmentPanel','salesPanel','bookingsPanel','financePanel'];
 const panels=ids.map(id=>({id,active:id==='storePanel',classList:{toggle(_c,on){this.owner.active=on}}}));
 for(const p of panels)p.classList.owner=p;
 function button(id){const b={dataset:{storePanel:id},attrs:{},active:false};b.classList={toggle(_c,on){b.active=on}};b.setAttribute=(k,v)=>b.attrs[k]=v;b.removeAttribute=k=>delete b.attrs[k];return b}
 const navButtons=ids.slice(1).map(button),headButtons=ids.slice(1).map(button),nav={dataset:{}};
 const context={
  window:{matchMedia:()=>({matches:mobile})},
  $:q=>q==='#storeSectionNavV673'?nav:q==='.storePhotographerWorkspace>.shell'?{scrollTo:()=>{}}:q==='#rentalHero'?{classList:{toggle:()=>{}}}:panels.find(p=>q==='#'+p.id),
  $$:q=>q==='.rentalPanel'?panels:q.includes('#pbR1123StoreDesktopNav')?[...navButtons,...headButtons]:[],
  selectedShopRecord:()=>({rental_enabled:true,sale_enabled:true}),updateMobilePanelTitle:()=>{},
  syncStoreHeaderActionsV809:()=>{},closeSaleCart:()=>{}
 };
 vm.runInNewContext(source,context);context.openStoreSection(id);
 return {active:panels.filter(p=>p.active).map(p=>p.id),header:headButtons.filter(b=>b.active).map(b=>b.dataset.storePanel),nav:nav.dataset.pb706Active};
}
test('Windows chooses exactly one panel and marks its header button',()=>{
 for(const id of ['equipmentPanel','salesPanel','bookingsPanel','financePanel']){
  assert.deepEqual(route(false,id).active,[id]);
  assert.deepEqual(route(false,id).header,[id]);
  assert.equal(route(false,id).nav,id);
 }
 assert.deepEqual(route(false,'storePanel').active,['equipmentPanel'])
});
test('mobile routing remains single-panel and without desktop marker',()=>{
 assert.deepEqual(route(true,'financePanel').active,['financePanel']);
 assert.equal(route(true,'financePanel').nav,undefined)
});
