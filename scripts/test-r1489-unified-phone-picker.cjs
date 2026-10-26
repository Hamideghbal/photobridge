const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const root='dist/web/',ui=fs.readFileSync(root+'assets/index-UIRefine-v655-r84.js','utf8'),css=fs.readFileSync(root+'photobridge-r1489-unified-phone-picker.css','utf8');
test('all three phone picker instances have the same class, component and menu, while original desktop selects remain',()=>{
 const common='className:"pb1489UnifiedPicker pb1487CustomerPicker",menuClassName:"pb1487CustomerMenu"';assert.equal(ui.split(common).length-1,3);
 for(const value of ['pb1427InvoiceCustomer','pb1420PaymentCustomer','z'])assert(ui.includes('value:'+value+',onChange:value=>'));
 assert(ui.includes('e.jsxs("select",{className:"pb1427InvoiceCustomerSelect"'));assert(ui.includes('e.jsxs("select",{className:"pb1421CustomerSelect"'));assert(ui.includes('e.jsx("select",{value:pb1420PaymentCustomer'));
 assert(!ui.includes('className:"pb1427InvoiceCustomerSelect pb1487CustomerPicker"'));assert(!ui.includes('className:"pb1421CustomerSelect pb1487CustomerPicker"'));
});
test('payment and discount prompt use project picker on phones and only continue after a customer is chosen',()=>{
 const start=ui.indexOf('function PB1437CustomerPrompt('),end=ui.indexOf('/* PB1438 photographer controls */',start);assert(start>0&&end>start);
 for(const action of ['payment','discount'])for(const phone of [true,false]){
  let value='',selected=null;const customer={id:'42',name:'عکاسی بسیار طولانی'};
  const ctx={x:{useState:()=>[value,v=>{value=v}]},e:{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})},On:'MODAL',wn:'PROJECT_PICKER',pb1487PhonePicker:()=>phone};vm.createContext(ctx);vm.runInContext(ui.slice(start,end),ctx);
  const render=()=>ctx.PB1437CustomerPrompt({action,customers:[customer],onSelect:id=>selected=id,onClose(){}});
  let modal=render(),[description,picker,actions]=modal.props.children;assert(description.props.children.includes(action==='payment'?'پرداخت':'تخفیف'));assert.equal(picker.type,phone?'PROJECT_PICKER':'select');assert.equal(modal.props.dialogClassName,phone?'pb1489CustomerPrompt':'');assert.equal(actions.props.children.props.disabled,true);
  if(phone){assert.equal(picker.props.options[1].label,customer.name);picker.props.onChange('42')}else picker.props.onChange({target:{value:'42'}});
  modal=render();actions=modal.props.children[2];assert.equal(actions.props.children.props.disabled,false);assert.equal(selected,null);actions.props.children.props.onClick();assert.equal(selected,'42');
 }
});
test('shared phone selector overrides inherited native frames and uses receipt geometry; prompt and portal are RTL',()=>{
 assert(css.includes('--pb1489-picker-width:min(42vw,150px)'));assert.equal((css.match(/grid-template-columns:var\(--pb1489-picker-width\)/g)||[]).length,2);
 assert(css.includes('.pb1489UnifiedPicker.pb1487CustomerPicker{display:block'));assert(css.includes('border:0!important;background:transparent!important'));assert(css.includes('height:40px!important;min-height:40px!important;max-height:40px'));
 assert(css.includes('.modal.pb1489CustomerPrompt'));assert(css.includes('font-family:Vazirmatn,Tahoma,sans-serif'));assert(css.includes('direction:rtl!important'));assert(css.includes('text-align:right!important'));
 assert(fs.readFileSync(root+'photobridge-r1487-mobile-pickers.css','utf8').includes('body>.pbSelectMenuPortal.pb1487CustomerMenu'));
 for(const line of css.split('\n').filter(l=>l.startsWith('html.')))assert(line.startsWith('html.pb1482LabPhoneMode body '));
 new vm.Script(ui);
});
test('all frozen Windows assets keep their verified bytes and native prompt implementation',()=>{
 const dir=root+'lab-desktop-ui/',manifest=JSON.parse(fs.readFileSync(dir+'manifest.json','utf8'));for(const f of manifest.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(dir+f.name)).digest('hex'),f.sha256,f.name);
 const frozen=fs.readFileSync(dir+'assets/index-UIRefine-v655-r84.js','utf8');assert(!frozen.includes('PB1489 shared phone picker'));assert(frozen.includes("function PB1437CustomerPrompt("));
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');assert(build.indexOf('enable-r1489-unified-phone-picker.mjs')>build.indexOf('enable-r1488-phone-finance.mjs'));
});
