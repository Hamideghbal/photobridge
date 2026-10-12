const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.css','utf8');
const header=fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.js','utf8');
const intake=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
const index=fs.readFileSync('dist/web/index.html','utf8');
const build=fs.readFileSync('scripts/enable-r1147-lab-admin-header.mjs','utf8');
const delta=css.slice(css.indexOf('/* R1175 —'));

test('only the native launch button is mounted directly in Windows header',()=>{
 assert(delta.includes('.pb1148SecondaryHeader.pb1174QueueNav > #pb1137LocalIntakeButton.pb1137Launch'));
 assert(header.includes("const intake=document.getElementById('pb1137LocalIntakeButton')"));
 assert(header.includes("if(isQueue&&intake&&intake.parentElement!==row)row.prepend(intake)"));
 assert(!header.includes("intake.textContent='ثبت سفارش عکس حضوری'"));
 assert(!header.includes("intake.addEventListener('click'"));
 assert(!header.includes("document.getElementById('pb1137LocalIntakeButton')?.click()"));
 assert(intake.includes('const target=header||host.querySelector'));
 assert(delta.includes('> .pb1174QueueLaunch {\n  display:none!important;'));
});
test('mount preserves exactly one native button and native onclick across desktop and mobile',()=>{
 const at=intake.indexOf('function mount(){'),end=intake.indexOf('let primaryState=null',at);
 assert(at>=0&&end>at);
 const fn=intake.slice(at,end);
 const elements=[];
 const filter={name:'filters',append(el){if(el.parentElement)el.parentElement.remove(el);el.parentElement=this;elements.push(el)}};
 const headerNode={name:'header',append(el){if(el.parentElement)el.parentElement.remove(el);el.parentElement=this;elements.push(el)}};
 filter.remove=headerNode.remove=el=>{const i=elements.indexOf(el);if(i>=0)elements.splice(i,1);el.parentElement=null};
 const host={querySelector(q){if(q==='.pb1148SecondaryHeader.pb1174QueueNav')return headerNode;if(q==='.mainQueueFilters')return filter;return null}};
 const doc={querySelector:q=>q==='.labRoleWorkspace main'?host:null,
   getElementById:()=>elements.find(el=>el.id==='pb1137LocalIntakeButton')||null};
 let desktop=true;
 const win={matchMedia:()=>({matches:desktop})};
 const provider={deviceId:()=> 'device-1'};
 const location={pathname:'/lab/orders'};
 const open=()=>{};
 const node=(tag,label,cls)=>({tag,label,className:cls,parentElement:null,remove(){this.parentElement?.remove(this)}});
 const mount=new Function('storage','document','window','location','primaryState','node','checkPrimary','open',fn+';return mount')(
   ()=>provider,doc,win,location,true, node,()=>{},open);
 mount();mount();
 assert.equal(elements.length,1);
 assert.equal(elements[0].parentElement,headerNode);
 assert.equal(elements[0].onclick,open);
 location.pathname='/lab/albums';mount();
 assert.equal(elements.length,1);
 assert.equal(elements[0].parentElement,headerNode);
 desktop=false;mount();
 assert.equal(elements.length,1);
 assert.equal(elements[0].parentElement,filter);
});
test('blue fade is a separate sibling and is not clipped by header overflow',()=>{
 assert(header.includes("fade.className='pb1175HeaderFade'"));
 assert(header.includes('row.after(fade)'));
 assert(header.includes("querySelector(':scope>.pb1175HeaderFade')?.remove()"));
 assert(delta.includes('position:fixed!important;'));
 assert(delta.includes('top:120px!important;'));
 assert(delta.includes('linear-gradient(to bottom,'));
 assert(delta.includes('rgba(49,94,251,.12) 0%'));
 assert(delta.includes('transparent 100%'));
 assert(delta.includes('pointer-events:none!important'));
});
test('queue page scroll remains usable with no empty right scrollbar track or reserved gutter',()=>{
 assert(delta.includes('.labRoleWorkspace:has(.pb1174QueueNav) .labRolePageScrollArea'));
 assert(delta.includes('scrollbar-gutter:auto!important;'));
 assert(delta.includes('scrollbar-width:none!important;'));
 assert(delta.includes('overflow-y:auto!important;overflow-x:hidden!important;'));
 assert(delta.includes('padding-inline-end:0!important;'));
 assert(delta.includes('.labRolePageScrollArea::-webkit-scrollbar,'));
 assert(delta.includes('display:none!important;width:0!important;height:0!important;'));
});
test('the mobile layout and cached native script are safe',()=>{
 assert(delta.includes('@media (min-width:821px) and (hover:hover) and (pointer:fine)'));
 assert(delta.includes('@media(max-width:820px)'));
 for(const ext of ['css','js']){
  assert(index.includes('photobridge-r1147-lab-admin-header.'+ext+'?v=r1175'));
  assert(build.includes('photobridge-r1147-lab-admin-header.'+ext+'?v=r1175'));
 }
 assert(index.includes('photobridge-r1137-lab-local-intake.js?v=r1175'));
 assert(build.includes('photobridge-r1137-lab-local-intake'));
 assert(build.includes('test-r1175-lab-unique-intake-fade-scroll.cjs'));
 new Function(header);new Function(intake);
});
