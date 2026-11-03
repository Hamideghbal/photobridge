'use strict';
// R1568: Windows-only, fixed-printer receipt spooler. No renderer-supplied HTML.
// The committed job journal deliberately prefers "needs review" over duplicate paper.
const fs=require('node:fs'),path=require('node:path');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const money=v=>Number(v||0).toLocaleString('fa-IR');
const key=(lab,kind,id)=>'thermalJob:v1:'+lab+':'+kind+':'+id;
const configKey=lab=>'thermalPrinter:v1:'+lab;
const number=v=>Number.isFinite(Number(v))?money(v):'نامشخص';
function ticketRows(files=[]){
 const groups=new Map();
 for(const f of files){
  const label=String(f.size_label||f.print_size_id||'سایز نامشخص'),type=String(f.print_type||'بدون نوع');
  const k=label+'|'+type,old=groups.get(k)||{label,type,count:0};
  old.count++;groups.set(k,old);
 }
 return [...groups.values()];
}
function documentHtml({kind,labName,order,invoice,files=[],requirements=[],widthMm=80,fontData=''}) {
 if(![58,80].includes(widthMm))throw Error('receipt_width_invalid');
 const css=`@font-face{font-family:Vazirmatn;src:url(data:font/woff2;base64,${fontData})}
 @page{size:${widthMm}mm auto;margin:0}*{box-sizing:border-box}
 html,body{margin:0;padding:0;width:${widthMm}mm;max-width:${widthMm}mm;background:white;color:#101820}
 body{font:11px/1.55 Vazirmatn,Tahoma,sans-serif;direction:rtl}
 article{padding:3mm 2.5mm 5mm}h1{font-size:15px;text-align:center;margin:0}
 h2{font-size:12px;text-align:center;margin:1mm 0 2mm}
 .meta{border-top:1px dashed #111;border-bottom:1px dashed #111;margin:2mm 0;padding:2mm 0}
 .line{display:flex;justify-content:space-between;gap:2mm;align-items:baseline}
 .line span:first-child{min-width:0;overflow-wrap:anywhere}
 .line b:last-child{white-space:nowrap;direction:ltr;text-align:left}
 table{width:100%;border-collapse:collapse;table-layout:fixed}
 th,td{border-bottom:1px dotted #aaa;padding:1mm 0;text-align:right;vertical-align:top;overflow-wrap:anywhere}
 th:nth-child(1),td:nth-child(1){width:47%}th:nth-child(2),td:nth-child(2){width:13%;text-align:center}th:nth-child(3),td:nth-child(3){width:40%;text-align:left}
 .item{page-break-inside:avoid}.unit{font-size:9px;color:#444}
 .total{border-top:1px dashed #111;margin-top:2mm;padding-top:2mm}
 .debt{font-size:14px;font-weight:900;border:2px solid #111;padding:2mm;margin-top:2mm;text-align:center}
 .warning{border:2px solid #111;padding:3mm 2mm;margin-top:3mm;font-size:12px;font-weight:900;text-align:center}
 .foot{text-align:center;font-size:9px;margin-top:3mm}
 @media print{article{break-inside:auto}tr{break-inside:avoid}}`;
 let lines='';
 if(kind==='invoice'){
  if(!invoice?.id||!Array.isArray(invoice.items))throw Error('invoice_missing_items');
  lines='<table><thead><tr><th>شرح / واحد</th><th>تعداد</th><th>مبلغ</th></tr></thead><tbody>'+
    invoice.items.map(item=>'<tr class="item"><td>'+esc(item.description||[item.sizeLabel,item.printTypeLabel].filter(Boolean).join(' · ')||item.kind)+'<div class="unit">فی واحد: '+number(item.unitPrice)+'</div></td><td>'+number(item.quantity)+'</td><td>'+number(item.lineTotal)+'</td></tr>').join('')+'</tbody></table>';
  const rows=[['جمع اقلام',invoice.subtotal],['جمع فاکتور',invoice.total]];
  if(invoice.discount_total!=null||invoice.discount!=null)rows.splice(1,0,['تخفیف',invoice.discount_total??invoice.discount]);
  if(invoice.correction_delta!=null&&Number(invoice.correction_delta)!==0)rows.push(['اصلاحات مالی فاکتور',invoice.correction_delta]);
  if(invoice.paid!=null)rows.push(['پرداخت ثبت‌شده',invoice.paid]);
  if(invoice.paid!=null||invoice.correction_delta!=null)rows.push(['مانده همین فاکتور',Number(invoice.total||0)+Number(invoice.correction_delta||0)-Number(invoice.paid||0)]);
  lines+='<section class="total">'+rows.map(([label,v])=>'<div class="line"><span>'+esc(label)+'</span><b>'+number(v)+'</b></div>').join('');
  const balance=invoice.account_balance_at_issue??invoice.customer_total_debt;
  lines+='<div class="debt">کل بدهی عکاسی<br>'+ (balance==null?'نامشخص':number(balance)+' تومان')+'</div></section>';
 }else if(kind==='ticket'){
  if(!files.length||!requirements.some(x=>x.resolved===false))throw Error('ticket_only_when_prices_missing');
  lines='<div>تعداد فایل‌ها: <strong>'+number(files.length)+'</strong></div><table><thead><tr><th>سایز</th><th>تعداد</th><th>نوع چاپ</th></tr></thead><tbody>'+
    ticketRows(files).map(item=>'<tr><td>'+esc(item.label)+'</td><td>'+number(item.count)+'</td><td>'+esc(item.type)+'</td></tr>').join('')+'</tbody></table>';
  const missing=requirements.filter(x=>!x.resolved);
  lines+='<div class="warning">نیازمند قیمت‌گذاری دستی و صدور فاکتور توسط اپراتور</div>'+
    '<div>موارد فاقد قیمت:</div>'+missing.map(x=>'<div>• '+esc(x.label||x.sizeLabel||x.sizeId||x.key)+' · '+esc(x.printType||'')+'</div>').join('');
 }
 const date=new Date(invoice?.issued_at||order?.created_at||Date.now()).toLocaleString('fa-IR',{timeZone:'Asia/Tehran'});
 return '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; font-src data:; script-src \'none\'"><style>'+css+'</style></head><body><article>'+
   '<h1>'+esc(labName||'PhotoBridge Lab')+'</h1>'+
   '<h2>'+(kind==='invoice'?'فاکتور فروش':'برگه سفارش چاپ / غیرمالی')+'</h2>'+
   '<div class="meta"><div>شماره سفارش: '+esc(order?.number||'—')+'</div>'+
   (kind==='invoice'?'<div>شماره فاکتور: '+esc(invoice.number||'—')+'</div>':'')+
   '<div>عکاسی: '+esc(order?.customer_name||invoice?.customer_name||'—')+'</div><div>تاریخ: '+esc(date)+'</div></div>'+
   lines+'<div class="foot">PhotoBridge · '+(kind==='invoice'?'مبالغ به تومان':'این برگه سند مالی نیست')+'</div></article></body></html>';
}
async function fetchJson(request,url){
 const response=await request(url);
 if(!response.ok)throw Object.assign(Error('upstream_'+response.status),{status:response.status});
 return response.json();
}
class ThermalPrinter{
 constructor({store,request,BrowserWindow,getWindow}){Object.assign(this,{store,request,BrowserWindow,getWindow});}
 account(){const lab=this.store.get('auth')&&this.store.get('labId');if(!lab)throw Object.assign(Error('login_required'),{status:401});return lab;}
 async printers(){
  const window=this.getWindow?.()||this.BrowserWindow.getAllWindows()[0];if(!window)throw Error('window_unavailable');
  return await window.webContents.getPrintersAsync();
 }
 async status(){const lab=this.account();return {supported:true,config:this.store.get(configKey(lab))||{deviceName:''},printers:(await this.printers()).map(p=>({name:p.name,displayName:p.displayName||p.name}))};}
 async configure(input){
  const lab=this.account(),deviceName=String(input?.deviceName||'');
  if(!deviceName||deviceName.length>180)throw Object.assign(Error('printer_required'),{status:400});
  const printers=await this.printers();
  if(!printers.some(p=>p.name===deviceName))throw Object.assign(Error('printer_not_installed'),{status:409});
  const config={deviceName};this.store.set(configKey(lab),config);return {config};
 }
 async print(input){
  const lab=this.account(),kind=String(input?.kind||''),id=String(input?.orderId||''),invoiceId=String(input?.invoiceId||'');
  if(!['invoice','ticket'].includes(kind)||!/^[0-9a-f-]{36}$/i.test(id))throw Object.assign(Error('invalid_print_job'),{status:400});
  const config=this.store.get(configKey(lab));
  if(!config?.deviceName)throw Object.assign(Error('printer_not_configured'),{status:409});
  const available=await this.printers();
  if(!available.some(p=>p.name===config.deviceName))throw Object.assign(Error('printer_offline_or_missing'),{status:409});
  const doc=await fetchJson(this.request,'/api/lab/orders/'+id);
  if(String(doc.order?.lab_id)!==String(lab))throw Object.assign(Error('wrong_lab'),{status:403});
  let invoice=null,requirements=[],printId=id;
  if(kind==='invoice'){
   invoice=doc.invoice;if(!invoice||String(invoice.id)!==invoiceId)throw Object.assign(Error('invoice_not_found'),{status:409});
   if(!invoice.pdf_ready)throw Object.assign(Error('invoice_pdf_not_ready'),{status:409});
   printId=invoiceId;
  }else{
   const pricing=await fetchJson(this.request,'/api/lab/orders/'+id+'/invoice-pricing');
   requirements=pricing.requirements||[];
   if(!requirements.some(x=>!x.resolved)||doc.invoice)throw Object.assign(Error('ticket_not_needed'),{status:409});
  }
  const jobKey=key(lab,kind,printId),previous=this.store.get(jobKey);
  if(previous)return {alreadyHandled:true,state:previous.state,jobId:jobKey};
  const settings=await fetchJson(this.request,'/api/lab/automation');
  const widthMm=settings?.settings?.receiptWidthMm===58?58:80;
  const labData=await fetchJson(this.request,'/api/auth/me');
  const font=fs.readFileSync(path.join(__dirname,'assets/photobridge-vazirmatn.woff2')).toString('base64');
  const html=documentHtml({kind,labName:labData.lab?.name,order:doc.order,invoice,files:doc.files,requirements,widthMm,fontData:font});
  // State is persisted BEFORE we hand off to the OS spooler. Unknown outcomes require a human.
  this.store.set(jobKey,{state:'submitting',date:new Date().toISOString(),printer:config.deviceName});
  const win=new this.BrowserWindow({show:false,width:900,height:1100,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
  try{
   win.webContents.setWindowOpenHandler?.(()=>({action:'deny'}));
   await win.loadURL('data:text/html;base64,'+Buffer.from(html).toString('base64'));
   await win.webContents.executeJavaScript('document.fonts.ready.then(()=>true)');
   const height=Math.max(120000,Math.min(1800000,Math.round((kind==='invoice'?120+(invoice.items||[]).length*16:110+ticketRows(doc.files).length*12)*1000)));
   const result=await new Promise(resolve=>win.webContents.print({silent:true,deviceName:config.deviceName,printBackground:true,landscape:false,pageSize:{width:widthMm*1000,height},margins:{marginType:'none'}},(success,reason)=>resolve({success,reason})));
   const state=result.success?'spool_accepted':'needs_review';
   this.store.set(jobKey,{state,date:new Date().toISOString(),printer:config.deviceName,reason:result.reason||null});
   return {jobId:jobKey,state,alreadyHandled:false,spoolAccepted:result.success};
  }catch(error){
   this.store.set(jobKey,{state:'needs_review',date:new Date().toISOString(),printer:config.deviceName,reason:String(error.message||error)});
   throw Object.assign(Error('printer_submission_uncertain'),{status:409});
  }finally{if(!win.isDestroyed())win.destroy();}
 }
}
module.exports={ThermalPrinter,documentHtml,ticketRows};
