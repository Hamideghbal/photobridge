'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm');
const htmlPath=path.join(__dirname,'../backup-finance-viewer-template.html');
const source=()=>fs.readFile(htmlPath,'utf8');
test('Persian financial calendars are actually interactive date pickers, not placeholder fields',async()=>{
 const html=await source(),script=html.match(/<script>\s*([\s\S]*?)<\/script>/);
 assert(script);new vm.Script(script[1],{filename:'backup-finance-viewer.html'});
 for(const item of ['function findMonthFirst','function showCalendar','function installCalendars','monthNames=','datePickerButton','aria-label","باز کردن تقویم شمسی','datePickerButton','class="fromDate"','class="toDate"'])assert(html.includes(item),item);
 const start=script[1].indexOf('const persianParts='),end=script[1].indexOf('let openCalendar=',start);
 assert(start>0&&end>start);
 const calendar=vm.runInNewContext(script[1].slice(start,end)+'\n({jParts,findMonthFirst})',{Intl,Date},{timeout:3000});
 for(const year of [1404,1405,1406])for(const month of [1,2,7,8,10,11,12]){
  const first=calendar.findMonthFirst(year,month);assert(first,'month '+year+'/'+month);
  const day=calendar.jParts(first);
  assert.deepEqual({year:day.year,month:day.month,day:day.day},{year,month,day:1});
 }
});
test('site-parity invoice modal and customer statement detail are printable full layouts',async()=>{
 const html=await source();
 for(const token of ['invoicePaperHead','invoicePaperInfo','invoicePaperTableHead','invoicePaperItems','invoicePaperTotals','invoiceAccountDebt',
  'ریز اقلام فاکتور #','pb1441StatementDetail','pb1441StatementItems','شرح / سایز','تعداد','فی واحد','جمع','چاپ فاکتور','PDF','dialogPrintTop','dialogPdf'])assert(html.includes(token),token);
 assert(html.includes('body:has(#invoiceDialog[open]) main{display:none!important}'),'print isolates invoice paper');
 assert(html.includes('table.append(body);td.append(table);'),'details must use real table');
 assert(!html.includes('doc.lines.map(l=>l.description+" × "+l.quantity+" = "'),'old flat statement detail removed');
 assert(!html.includes('root.append(el("p","",invoice.customer+" · "'),'old invoice summary modal removed');
});
