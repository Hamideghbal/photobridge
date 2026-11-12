'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
const context={};vm.createContext(context);vm.runInContext(read('scripts/r1797-invoice-component-rows.js.txt'),context);
const split=context.pb1797InvoiceComponentRows;
const item={sizeLabel:'10x15',printType:'luster',printTypeLabel:'لاستر',chassis:true,frame:false,chassisModelName:'شاسی 4000',quantity:2,unitPrice:150,lineTotal:300,priceComponents:{paper:100,chassis:50,frame:0}};
test('R1797 print then selected chassis have separate fees and the same actual copy quantity',()=>{
 const rows=split([item]);assert.equal(rows.length,2);assert.deepEqual(Array.from(rows,r=>r.unitPrice),[100,50]);assert.deepEqual(Array.from(rows,r=>r.quantity),[2,2]);
 assert.equal(rows[0].description,'10x15 · لاستر');assert.match(rows[1].description,/شاسی 4000/);
 assert.equal(rows.reduce((n,r)=>n+r.lineTotal,0),300);assert(rows.every(r=>!r.chassis&&!r.frame));assert.equal(split(rows).length,2,'already split items cannot be expanded twice');
});
test('R1797 frame/color and no-photo products retain exact totals; historical/malformed breakdowns are preserved',()=>{
 const both={...item,frame:true,frameModelName:'قاب چوبی',frameColorName:'طلایی',unitPrice:220,lineTotal:440,priceComponents:{paper:100,chassis:50,frame:70}};
 const rows=split([both]);assert.equal(rows.length,3);assert.match(rows[2].description,/قاب چوبی · طلایی/);assert.equal(rows.reduce((n,r)=>n+r.lineTotal,0),440);
 const only={...both,printType:'none',unitPrice:120,lineTotal:240,priceComponents:{paper:0,chassis:50,frame:70}};assert.equal(split([only]).length,2);
 const legacy={...item};delete legacy.priceComponents;assert.equal(split([legacy])[0],legacy);
 assert.equal(split([{...item,priceComponents:{paper:50,chassis:20,frame:0}}])[0].unitPrice,150,'never guess mismatching historical prices');
});
async function create(files,existing){
 const source=read('dist/api/server.js'),start=source.indexOf('async function createOrGetInvoice('),next=/\n(?:async )?function /.exec(source.slice(start+18));assert(start>=0&&next);
 let saved;
 const order={mode:'print',customer_id:'customer',id:'order',lab_name:'Lab'};
 const c={async query(sql,args){if(sql.includes('FROM invoices i JOIN'))return {rowCount:existing?1:0,rows:existing?[existing]:[]};if(sql.includes('FROM orders o JOIN'))return {rowCount:1,rows:[order]};if(sql.includes('pg_advisory_xact_lock'))return {rows:[]};if(sql.includes('FROM order_files f'))return {rows:files};if(sql.startsWith('INSERT INTO invoices')){saved={id:'inv',items:JSON.parse(args[3]),subtotal:args[4],total:args[4],pdf_ready:true,account_balance_at_issue:0};return {rows:[saved]}}if(sql.startsWith('UPDATE invoices'))return {rows:[saved]};if(sql.startsWith('UPDATE orders'))return {rows:[order]};throw Error(sql)}};
 const env={pb1797InvoiceComponentRows:split,labFinanceCustomerNameSql:()=>"'Customer'",orderInvoicePriceRequirements:async()=>[],storageConfigured:false,invoicePrintTypeLabel:type=>({luster:'لاستر',silk:'سیلک',none:'بدون چاپ'}[type]||type),postInvoiceFinance:async()=>{},maybeApplyLabBirthdayDiscount:async()=>{},maybeApplyCustomerBatchDiscount:async()=>{},customerReceivableBalance:async()=>0};
 return vm.runInNewContext('('+source.slice(start,start+18+next.index)+')',env)(c,'lab','order');
}
test('R1797 composed invoice creation freezes actual component rates and conserves billed totals',async()=>{
 const f={print_size_id:'size',size_label:'10x15',print_type:'luster',print_copies:2,luster:100,chassis:true,frame:true,chassis_price:999,frame_price:999,addon_selection:{chassis:{id:'c',name:'شاسی 4000',unitPrice:50},frame:{id:'f',name:'قاب چوبی',colorName:'طلایی',unitPrice:70}}};
 const inv=await create([f]);assert.equal(inv.total,440);assert.equal(inv.items.length,3);assert.deepEqual(inv.items.map(r=>r.unitPrice),[100,50,70]);assert(inv.items.every(r=>r.quantity===2));
 const alternative={...f,addon_selection:{chassis:{...f.addon_selection.chassis,unitPrice:70},frame:{...f.addon_selection.frame,unitPrice:50}}};
 const mixed=await create([f,alternative]);assert.equal(mixed.total,880);assert.equal(mixed.items.length,6,'equal combined fees with different component fees cannot collapse together');
 const old={id:'old',total:123,items:[{description:'historic',unitPrice:123}],pdf_ready:true,account_balance_at_issue:0};assert.deepEqual((await create([],old)).items,old.items);
});
test('R1797 approved thermal has explicit fee then quantity columns and no inline-price dependency',()=>{
 const ui=read('dist/web/assets/index-UIRefine-v655-r84.js'),start=ui.indexOf('function pbR1698Words('),end=ui.indexOf('function Vy(',start);
 const ctx={vh:t=>t.items,ph:r=>r.description};vm.createContext(ctx);vm.runInContext((ui.includes('function pb1798NoPrintInvoice(')?read('scripts/r1798-no-print-ui.js.txt'):'')+ui.slice(start,end),ctx);
 const invoice={number:1,total:300,subtotal:300,items:split([item]),lab_name:'Lab',customer_name:'Customer'};
 const html=ctx.pbR1698ApprovedThermal(invoice,false);
 assert(html.includes('<th class="price">فی</th><th class="qty">تعداد</th>'));assert(!html.includes('<th class="unit">'));
 assert.equal((html.match(/<td class="price">/g)||[]).length,2);assert(html.includes('۱۰۰'));assert(html.includes('۵۰'));assert(html.includes('۳۰۰'));
 assert(ctx.pbR1698ApprovedThermal({...invoice,items:[]},true).includes('colspan="4"'));
});
test('R1797 opening debt groups ASCII/Persian/Arabic pasted values without losing digits or validation',()=>{
 const text=read('scripts/r1797-tariff-debt-ui.js.txt'),end=text.indexOf('function PB1797WalkinTable('),ctx={requestAnimationFrame:fn=>fn()};vm.createContext(ctx);vm.runInContext(text.slice(0,end),ctx);
 assert.equal(ctx.pb1797MoneyInput('۱۲۳۴۵۶۷'),'1,234,567');assert.equal(ctx.pb1797MoneyInput('١٢٣٬٤٥٦'),'123,456');assert.equal(ctx.pb1797MoneyInput('1000000000000'),'1,000,000,000,000');assert.equal(ctx.pb1797MoneyInput(''),'');assert.equal(ctx.pb1797MoneyInput('-100'),'-100','invalid negative debt must remain invalid');
 let value,selection;ctx.pb1797MoneyChange({target:{value:'12345',selectionStart:3,isConnected:true,setSelectionRange:(a,b)=>{selection=[a,b]}}},v=>{value=v});assert.equal(value,'12,345');assert.deepEqual(selection,[4,4]);
});
test('R1797 web/native use a semantic shared tariff table and preserve update integrity',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){const ui=read(root+'/assets/index-UIRefine-v655-r84.js');assert.doesNotThrow(()=>new vm.Script(ui));assert(ui.includes('e.jsx(PB1797WalkinTable,{rows:s,fields:pb1777Fields'));assert(ui.includes('className:\'pb1797TariffTable\''));assert(ui.includes('setAmount(pb1797MoneyInput(result.initialDebt||0))'));assert(read(root+'/index.html').includes('invoiceFee=r1797'))}
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(read(root+'/manifest.json'));
 for(const name of ['assets/index-UIRefine-v655-r84.js','index.html','photobridge-r1797-invoice-tariff-debt.css'])assert.equal(manifest.files.find(f=>f.name===name).sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 assert.equal(manifest.build,crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'));
});
