const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const intake=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
const header=fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.js','utf8');
const style=fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');

test('site header uses the actual queue rather than stale settings tabs',()=>{
 assert(header.includes('PB1188 prefer active queue tabs in browser'));
 assert(header.includes("queueRoute?document.querySelector('.labRoleWorkspace .mainQueueFilters')"));
 assert(header.includes("row.classList.toggle('pb1174QueueNav',isQueue)"));
 assert(header.includes("const nativeIntake=row.querySelector(':scope>#pb1137LocalIntakeButton')"));
 assert(header.includes("if(isQueue&&intake&&intake.parentElement!==row)row.prepend(intake)"));
 assert.match(style,/> #pb1137LocalIntakeButton\.pb1137Launch \{\s*display:inline-flex!important/);
 assert.match(style,/>button\[data-pb1173-index\]/);
 assert.match(style,/order:-1!important;flex:0 0 auto!important/);
 assert.match(style,/margin-inline-end:auto!important/);
});
test('actual browser mount creates one right-side button even before device verification',()=>{
 const start=intake.indexOf('function mount(){');
 const end=intake.indexOf('let primaryState=null',start);
 assert(start>=0&&end>start);
 const mount=intake.slice(start,end);
 function scenario(path,deviceId,primaryState){
  const buttons=[];
  const header={children:[],append(el){el.parentElement=this;this.children.push(el)}};
  const filters={children:[],append(el){el.parentElement=this;this.children.push(el)}};
  const host={querySelector(selector){if(selector==='.labQueueQuickIntroV464 button')return null;if(selector==='.mainQueueFilters')return filters;return null;}};
  const doc={
   querySelector(selector){
    if(selector==='.labRoleWorkspace main')return host;
    if(selector==='.labRoleWorkspace .pb1148SecondaryHeader.pb1174QueueNav')return header;
    return null;
   },
   getElementById(){return buttons[0]||null}
  };
  let checks=0;
  const env={document:doc,location:{pathname:path},window:{matchMedia:()=>({matches:true})},
   storage:()=>({deviceId:()=>deviceId}),primaryState,checkPrimary:()=>{checks++;},
   open:()=>{},node:(tag,text,cls)=>{const el={tagName:tag,textContent:text,className:cls};buttons.push(el);return el;}};
  vm.runInNewContext(mount+';mount();mount();',env);
  return {header,filters,buttons,checks};
 }
 for(const [route,label] of [
  ['/lab/orders','ثبت سفارش عکس حضوری'],
  ['/lab/albums','ثبت سفارش آلبوم حضوری']
 ]){
  for(const [id,primary] of [['',null],['test-machine',false],['test-machine',true]]){
   const result=scenario(route,id,primary);
   assert.equal(result.buttons.length,1,route+' does not recreate a button on each observation');
   assert.equal(result.header.children.length,1,route+' button lives in the SECOND fixed header');
   assert.equal(result.filters.children.length,0,'no extra button in the old queue strip');
   assert.equal(result.buttons[0].textContent,label);
   assert.equal(typeof result.buttons[0].onclick,'function');
  }
 }
 assert(intake.includes("if(!primary.registered||!primary.isThisDevice)throw Error("),'server-authorized primary restriction must remain in open()');
 assert(intake.includes("storageMode!=='device-local'"),'device-local file protection unchanged');
});
test('laboratory scroll areas never animate, including opacity-only R1187 fallback',()=>{
 const click=header.slice(header.indexOf("button.addEventListener('click',()=>{"),header.indexOf('row.append(button);'));
 assert(!click.includes('panel?.animate?.('));
 assert(!click.includes("translateY(7px)"));
 assert(!header.includes("document.querySelector('.labRolePageScrollArea')?.animate"));
 assert(header.includes('PB1188 fixed scroll viewport'));
 assert(header.includes("indicator.style.transform='translateX('+offset+')"),'sliding underline remains');
 assert(header.includes('button.animate?.('),'button-only feedback remains');
});
test('production site HTML loads fresh lab entry and header code',()=>{
 assert.match(html,/photobridge-r1137-lab-local-intake\.js\?v=[^"]+&site=r1188"/);
 assert.match(html,/photobridge-r1147-lab-admin-header\.js\?v=[^"]+&site=r1188"/);
 assert(!html.includes('photobridge-r1147-lab-admin-header.js?v=r1175"'));
});
