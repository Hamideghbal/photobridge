'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {ThermalPrinter,documentHtml,ticketRows}=require('../thermal-printer.cjs');
const ORDER='11111111-1111-4111-8111-111111111111',INVOICE='22222222-2222-4222-8222-222222222222',LAB='33333333-3333-4333-8333-333333333333';
const order={id:ORDER,lab_id:LAB,number:1258,customer_name:'آتلیه تست',created_at:'2026-11-03T09:00:00Z'};
const invoice={id:INVOICE,number:567,order_id:ORDER,issued_at:'2026-11-03T10:00:00Z',pdf_ready:true,total:580000,subtotal:600000,discount_total:20000,account_balance_at_issue:1780000,items:[{description:'چاپ ۱۰×۱۵',quantity:8,unitPrice:20000,lineTotal:160000},{description:'چاپ ۲۰×۳۰',quantity:4,unitPrice:105000,lineTotal:420000}]};
test('58mm complete invoice has full items, sum, debt and escaped labels',()=>{
 const html=documentHtml({kind:'invoice',labName:'لابراتوار <script>',order,invoice,widthMm:58});
 assert.match(html,/size:58mm auto/);assert.match(html,/کل بدهی عکاسی/);
 assert.match(html,/۱٬۷۸۰٬۰۰۰/);assert.match(html,/۵۸۰٬۰۰۰/);
 assert.match(html,/فی واحد/);assert.match(html,/۸/);
 assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));
});
test('80mm missing-price ticket never fabricates a bill or total debt',()=>{
 const html=documentHtml({kind:'ticket',labName:'لابراتوار',order,files:[{size_label:'۲۰×۳۰',print_type:'luster'},{size_label:'۲۰×۳۰',print_type:'luster'}],requirements:[{resolved:false,sizeLabel:'۲۰×۳۰',printType:'luster'}],widthMm:80});
 assert.match(html,/تعداد فایل‌ها/);assert.match(html,/نیازمند قیمت‌گذاری دستی/);
 assert(!html.includes('کل بدهی عکاسی'));assert(!html.includes('شماره فاکتور'));
 assert.deepEqual(ticketRows([{size_label:'20×30',print_type:'silk'},{size_label:'20×30',print_type:'silk'}]),[{label:'20×30',type:'silk',count:2}]);
 assert.throws(()=>documentHtml({kind:'ticket',order,files:[{}],requirements:[],widthMm:80}),/ticket_only_when_prices_missing/);
});
function fixture(){
 const db=new Map([['auth',{user:{}}],['labId',LAB]]),store={get:k=>db.get(k),set:(k,v)=>db.set(k,v)};
 let spools=0;
 const BrowserWindow=class{constructor(){this.webContents={setWindowOpenHandler:()=>{},executeJavaScript:async()=>true,print:(_options,cb)=>{spools++;cb(true)}}}async loadURL(){}isDestroyed(){return false}destroy(){}};
 const printers=[{name:'THERMAL-80',displayName:'Receipt printer'}];
 const window={webContents:{getPrintersAsync:async()=>printers}};
 const responses={
  ['/api/lab/orders/'+ORDER]:{order,invoice,files:[]},
  ['/api/lab/automation']:{settings:{receiptWidthMm:80}},
  ['/api/auth/me']:{lab:{name:'لابراتوار نمونه'}}
 };
 const request=async url=>({ok:!!responses[url],status:responses[url]?200:404,json:async()=>responses[url]});
 return {printer:new ThermalPrinter({store,request,BrowserWindow,getWindow:()=>window}),store,db,getSpools:()=>spools};
}
test('printer selection is bound to installed Windows printer and lab account',async()=>{
 const f=fixture();
 await assert.rejects(f.printer.configure({deviceName:'other'}),/printer_not_installed/);
 await f.printer.configure({deviceName:'THERMAL-80'});
 assert.equal((await f.printer.status()).config.deviceName,'THERMAL-80');
 f.store.set('auth',null);
 await assert.rejects(f.printer.status(),/login_required/);
});
test('a successful invoice reaches spooler once and survives subsequent duplicate requests',async()=>{
 const f=fixture();await f.printer.configure({deviceName:'THERMAL-80'});
 const a=await f.printer.print({kind:'invoice',orderId:ORDER,invoiceId:INVOICE});
 assert.equal(a.spoolAccepted,true);
 const b=await f.printer.print({kind:'invoice',orderId:ORDER,invoiceId:INVOICE});
 assert.equal(b.alreadyHandled,true);assert.equal(f.getSpools(),1);
});
test('ticket is refused when the order already has an invoice',async()=>{
 const f=fixture();await f.printer.configure({deviceName:'THERMAL-80'});
 await assert.rejects(f.printer.print({kind:'ticket',orderId:ORDER}),/upstream_404/);
});
