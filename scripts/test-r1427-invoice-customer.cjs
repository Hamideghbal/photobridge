const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const file='dist/web/assets/index-UIRefine-v655-r84.js',ui=fs.readFileSync(file,'utf8');
test('invoice customer filter uses ids, combines dates, includes all by default and preserves customer role',()=>{
 const a=ui.indexOf('const Ve=r.filter('),b=ui.indexOf(',he=',a);assert(a>0&&b>a);
 const rows=[{id:1,customer_id:'a',customer_name:'هم‌نام',issued_at:'2026-01-02',total:10},{id:2,customer_id:'b',customer_name:'هم‌نام',issued_at:'2026-01-03',total:20},{id:3,customer_id:'a',issued_at:'2025-12-01',total:5},{id:4,customer_id:null,issued_at:'2026-01-04',total:1}];
 const run=(customer,role='lab',from='',to='')=>JSON.parse(JSON.stringify(vm.runInNewContext(ui.slice(a,b).replace('const Ve=',''),{r:rows,t:role,pb1427InvoiceCustomer:customer,l:'',_pbInvAppliedFrom:from,_pbInvAppliedTo:to,$s:v=>v}))).map(r=>r.id);
 assert.deepEqual(run(''),[1,2,3,4]);assert.deepEqual(run('a'),[1,3]);assert.deepEqual(run('b'),[2]);assert.deepEqual(run('a','lab','2026-01-01','2026-01-31'),[1]);assert.deepEqual(run('missing'),[]);assert.deepEqual(run('a','customer'),[1,2,3,4]);
});
test('invoice picker offers all first and resets pagination without changing other customer selectors',()=>{
 const a=ui.indexOf('t==="lab"?(pb1487PhonePicker()?e.jsx(wn,{className:"pb1489UnifiedPicker pb1487CustomerPicker"'),b=ui.indexOf(',t==="lab"&&e.jsx("button",{type:"button",className:"pb1176ManualOpen"',a);assert(a>0&&b>a);
 const calls=[],jsx=(type,props)=>({type,...props}),ctx={e:{jsx,jsxs:jsx},wn:'Picker',pb1487PhonePicker:()=>false,t:'lab',pb1427InvoiceCustomer:'',E:[{id:1,name:'عکاسی اول'},{id:2,name:'عکاسی دوم'}],pb1427SetInvoiceCustomer:v=>calls.push(['customer',v]),Ie:v=>calls.push(['page',v]),l:'',c(){}};
 const picker=vm.runInNewContext(ui.slice(a,b),ctx);assert.equal(picker.type,'select');assert.equal(picker.children[0].value,'');assert.equal(picker.children[0].children,'همهٔ عکاسی‌ها');assert.equal(picker.children[1][1].value,'2');picker.onChange({target:{value:'2'}});assert.deepEqual(calls,[['customer','2'],['page',1]]);
 assert.equal(vm.runInNewContext(ui.slice(a,b),{...ctx,t:'customer'}).children.type,'input');
});
test('build transform is repeatable, valid and refreshes both delivered assets',()=>{
 const files=[file,'dist/web/index.html','dist/web/photobridge-r1423-finance-bars.css'],before=files.map(p=>fs.readFileSync(p,'utf8'));
 execFileSync(process.execPath,['scripts/enable-r1427-invoice-customer.mjs']);
 files.forEach((p,i)=>assert.equal(fs.readFileSync(p,'utf8'),before[i]));execFileSync(process.execPath,['--check',file]);
 const html=before[1];assert(html.includes('invoiceCustomer=r1427'));assert(html.includes('photobridge-r1423-finance-bars.css?v=r1427'));
});
