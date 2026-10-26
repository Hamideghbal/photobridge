const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const root='dist/web/',ui=fs.readFileSync(root+'assets/index-UIRefine-v655-r84.js','utf8'),css=fs.readFileSync(root+'photobridge-r1487-mobile-pickers.css','utf8');
test('all three custom phone pickers preserve options, empty selection and original state-reset callbacks',()=>{
 for(const cls of ['pb1427InvoiceCustomerSelect','pb1487ReceiptPicker','pb1421CustomerSelect']){
  const start=ui.indexOf('e.jsx(wn,{className:"'+cls+' pb1487CustomerPicker"');assert(start>0);const end=ui.indexOf(']})',start)+3,changes=[];
  const ctx={e:{jsx:(tag,props)=>props},wn:()=>{},E:[{id:'long',name:'عکاسی با نام طولانی'},{id:'mobile',mobile:'09120000000'}],pb1427InvoiceCustomer:'',pb1420PaymentCustomer:'',z:'',pb1427SetInvoiceCustomer:v=>changes.push(['invoice',v]),Ie:v=>changes.push(['page',v]),pb1420SetPaymentCustomer:v=>changes.push(['receipt',v]),q:v=>changes.push(['customer',v]),A:v=>changes.push(['reset',v]),Re:v=>changes.push(['page',v])};
  const props=vm.runInNewContext(ui.slice(start,end),ctx);assert.equal(props.menuClassName,'pb1487CustomerMenu');assert.equal(props.options.length,3);assert.equal(props.options[0].value,'');assert.equal(props.options[1].label,'عکاسی با نام طولانی');
  props.onChange('long');assert(changes.some(row=>row[1]==='long'));if(cls==='pb1421CustomerSelect')assert(changes.some(row=>row[0]==='reset'&&row[1]===null));props.onChange('');assert(changes.some(row=>row[1]===''));
 }
 assert.equal((ui.match(/\(pb1487PhonePicker\(\)\?e.jsx\(wn,\{className:"(?:pb1427InvoiceCustomerSelect|pb1487ReceiptPicker|pb1421CustomerSelect)/g)||[]).length,3);
 new vm.Script(ui);
});
test('phone download/unavailable-stage taps use titled project dialogs and never dispatch an action',async()=>{
 const start=ui.indexOf('onClick:event=>{if(pb1483Phone()){event.stopPropagation();if(Jt.key==='),end=ui.indexOf(',children:[e.jsx("span",{className:"timelineDot"',start);assert(start>0&&end>start);
 for(const [key,allowed] of [['download',true],['download_print',true],['ready',false]]){
  const notices=[],ctx={pb1483Phone:()=>true,Jt:{key},Bt:allowed,le:{},pb1452ArchiveNotice:(message,options)=>notices.push({message,options}),aa:()=>assert.fail('must not dispatch transition')};
  await vm.runInNewContext('('+ui.slice(start+8,end)+')',ctx)({stopPropagation(){}});assert.equal(notices.length,1);assert.equal(notices[0].options.brandLabel,'فوتوبریج · لابراتوار');assert(notices[0].options.title);assert(notices[0].message);
 }
});
test('failed phone stage verification also uses the styled dialog and remains blocked',async()=>{
 const start=ui.indexOf('async function pb1483AllowRemoteStage('),end=ui.indexOf('async function pb1450AllowStage(',start);assert(start>0&&end>start);const notices=[];
 const ctx={Me:async()=>({order:{id:'one',lab_id:'lab',status:'sent'}}),pb1483Phone:()=>true,pb1452ArchiveNotice:async(message,options)=>notices.push({message,options})};vm.createContext(ctx);vm.runInContext(ui.slice(start,end),ctx);assert.equal(await ctx.pb1483AllowRemoteStage({id:'one',lab_id:'lab'}),false);assert.equal(notices[0].options.title,'امکان تغییر مرحله نیست');
});
test('body-portalled menu and dialog receive project RTL styles; statement gives more space to photographer',()=>{
 assert(css.includes('body>.pbSelectMenuPortal.pb1487CustomerMenu'));assert(css.includes('font-family:Vazirmatn,Tahoma,sans-serif'));assert(css.includes('text-align:right'));assert(css.includes('minmax(0,1.8fr) minmax(0,.8fr) minmax(0,.8fr)'));assert(css.includes('body>dialog.pb1452ArchiveDialog'));
 assert(ui.includes("brandLabel='فوتوبریج · آرشیو'"));assert(ui.includes('brand.textContent=brandLabel;'));
});
test('all frozen Windows assets retain their verified hashes; patch follows snapshot',()=>{
 const dir=root+'lab-desktop-ui/',manifest=JSON.parse(fs.readFileSync(dir+'manifest.json','utf8'));for(const f of manifest.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(dir+f.name)).digest('hex'),f.sha256,f.name);
 assert(!fs.readFileSync(dir+'assets/index-UIRefine-v655-r84.js','utf8').includes('PB1487 phone photographer pickers'));
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');assert(build.indexOf('enable-r1487-mobile-pickers.mjs')>build.indexOf('enable-r1486-mobile-calendar.mjs'));
});

test('phone picker selection is available on the first React render before workspace classes mount',()=>{
 const start=ui.indexOf('function pb1487PhonePicker(){'),end=ui.indexOf('/* PB1487 phone photographer pickers */',start);assert(start>0);const code=ui.slice(start,end);
 for(const [ua,native,width,expected]of [['Android Mobile',false,true,true],['Windows NT 10 Android',false,true,false],['Android Mobile',true,true,false],['Android Mobile',false,false,false]]){
  const ctx={window:{pbNativeStorage:native?{}:null,matchMedia:()=>({matches:width})},navigator:{userAgent:ua}};vm.createContext(ctx);vm.runInContext(code,ctx);assert.equal(ctx.pb1487PhonePicker(),expected);
 }
});
