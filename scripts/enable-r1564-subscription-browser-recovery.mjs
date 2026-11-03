import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1564 changed anchor: '+a.slice(0,100));return s.replace(a,b)};
fs.writeFileSync('dist/api/sms-message-units.js',fs.readFileSync('scripts/r1564-sms-units.js.txt'));
const smsModule='dist/api/lab-intake-invoice-sms.js';
let sms=fs.readFileSync(smsModule,'utf8');
if(!sms.includes('export async function dispatchIntakeOrderSms(')){sms="import {orderConfirmationSms} from './sms-message-units.js';\n"+sms+'\n'+fs.readFileSync('scripts/r1564-order-confirmation-sms.js.txt','utf8');fs.writeFileSync(smsModule,sms);}
let server=fs.readFileSync('dist/api/server.js','utf8');
if(!server.includes('/* PB1564 immediate intake confirmation */')){
 // Unit multipliers are opt-in for wallet reservations; non-SMS services stay at one unit.
 for(const name of ['reserveServiceWalletCharge','reservePhotographerWalletCharge','reserveEquipmentRentalSmsCharge']){
  const start=server.indexOf('async function '+name+'('),end=server.indexOf('\nasync function ',start+25);if(start<0||end<start)throw Error('R1564 wallet boundary '+name);
  let part=server.slice(start,end);const at=part.indexOf('        const amount =');const close=part.indexOf(';',at);if(at<0||close<0)throw Error('R1564 wallet amount '+name);
  part=part.slice(0,at)+"        const units=args.units===undefined?1:Number(args.units);if(!Number.isInteger(units)||units<1||units>32)throw Error('invalid_sms_units');\n"+part.slice(at,close).replace('const amount =','const amount = (')+") * units"+part.slice(close);if(name==='reservePhotographerWalletCharge'){part=part.replace('amount !== Number(args.expectedAmount)','amount / units !== Number(args.expectedAmount)');part=once(part,'!service.enabled || !service.customer_enabled',"!service.enabled || !(service.customer_enabled || args.labOrderSms===true&&args.serviceKey==='sms_customer_notification'&&service.lab_enabled)");}server=server.slice(0,start)+part+server.slice(end);
 }
 const begin=server.indexOf('async function sendSms(args) {'),end=server.indexOf('\nfunction normalizePublicEmail',begin);if(begin<0||end<begin)throw Error('R1564 SMS boundary');
 let send=server.slice(begin,end);
 send=once(send,'async function sendSms(args) {',`async function sendSms(args) {
    const finalMessage=compactSms(args).slice(0,900),meter=smsParts(finalMessage);
    args={...args,metadata:{...(args.metadata||{}),smsParts:meter.parts,smsEncoding:meter.encoding,smsUnits:meter.units}};`);
 send=once(send,'shopId: args.chargeRentalShopId, serviceKey:','shopId: args.chargeRentalShopId, units:meter.parts, serviceKey:');
 send=once(send,'userId:args.chargePhotographerId,serviceKey:',"userId:args.chargePhotographerId,units:meter.parts,labOrderSms:args.purpose==='lab_intake_order_confirmation'&&args.metadata?.payer==='photographer',serviceKey:");
 send=once(send,'labId: args.chargeLabId, serviceKey:','labId: args.chargeLabId, units:meter.parts, serviceKey:');
 send=once(send,"metadata: { purpose: args.purpose, eventKey: args.eventKey, mobile } });","metadata: { purpose: args.purpose, eventKey: args.eventKey, mobile,...args.metadata } });");
 send=once(send,"String(args.message || '').slice(0, 900)",'finalMessage');
 send=once(send,'return { ...out, chargedAmount:','return { ...out, smsParts:meter.parts, chargedAmount:');
 server=server.slice(0,begin)+send+server.slice(end);
 server=once(server,"const invoiceSms=await dispatchIntakeInvoiceSms({pool,sendSms,normalizeMobile},labId,orderId)","const invoiceSms=await (smsBody.sendOrderSms===true?dispatchIntakeOrderSms:dispatchIntakeInvoiceSms)({pool,sendSms,normalizeMobile},labId,orderId)");
 server=once(server,"const smsBody=await bodyJson(req);","const smsBody=await bodyJson(req);if(smsBody.sendOrderSms!==undefined&&typeof smsBody.sendOrderSms!=='boolean')return sendJson(res,400,{error:'invalid_order_sms_choice'});");
 server=once(server,"else if(req.method==='POST'&&suffix==='customers')", "else if(req.method==='GET'&&/^customers\\/[0-9a-f-]{36}\\/account-summary$/i.test(suffix))url.pathname='/api/lab/delegated-customers/'+suffix.slice('customers/'.length);\n            else if(req.method==='POST'&&suffix==='customers')");
 server="import {smsParts,compactSms} from './sms-message-units.js';\nimport {dispatchIntakeOrderSms} from './lab-intake-invoice-sms.js';\n"+server+'\n/* PB1564 immediate intake confirmation */\n';fs.writeFileSync('dist/api/server.js',server);
}
const native='dist/web/lab-desktop-ui',bundle='assets/index-UIRefine-v655-r84.js',discount='photobridge-r1038-subscription-discounts.js';
for(const root of ['dist/web',native]){
 fs.writeFileSync(root+'/'+discount,fs.readFileSync('scripts/r1564-subscription-discounts.js.txt'));
 let source=fs.readFileSync(root+'/'+bundle,'utf8');
 if(!source.includes('/* PB1564 browser archive download */')){
  source=once(source,'className:s===O.id?"selected":"",onClick:()=>r(O.id)','type:"button","aria-pressed":s===O.id,className:s===O.id?"selected":"",onClick:()=>r(O.id)');
  const a=source.indexOf('async function pb1451RecoverOrder('),b=source.indexOf('\nfunction pb1451RecoveryMessage',a);if(a<0||b<a)throw Error('R1564 archive handler missing');let part=source.slice(a,b);
  part=once(part,"  progress?.({done:0,total:detail.files.length,current:'بازیابی نسخه سرور و ساخت سفارش جدید'});", "  const browserRoot=!window.pbNativeStorage&&ai()?await pb1450Root(true):null;\n  progress?.({done:0,total:detail.files.length,current:'بازیابی نسخه سرور و ساخت سفارش جدید'});");
  part=once(part,'  return {...result,localPrepared:false,localCount:0,serverCount:result.fileCount || detail.files.length};',`  if(browserRoot){
    try{
      const prepared=await Me('/api/lab/orders/'+result.order.id+'/download');
      await pb1550Root(prepared,false,browserRoot);
      const downloaded=await Dg(prepared,value=>progress?.(value));
      const confirmed=await pb1451LiveRecovery('/api/lab/orders/'+result.order.id,{status:'downloaded',note:'بازیابی آرشیو در مرورگر؛ فایل‌ها روی هارد ذخیره و بررسی شدند.'},'PATCH');
      if(!confirmed?.order?.id)throw Error('recovery_not_confirmed');
      return {...result,order:confirmed.order,localPrepared:true,localCount:0,serverCount:downloaded.done};
    }catch(error){error.recoveryOrder=result.order;throw error;}
  }
  return {...result,localPrepared:false,localCount:0,serverCount:result.fileCount || detail.files.length};`);
  source=source.slice(0,a)+part+source.slice(b)+'\n/* PB1564 browser archive download */\n';fs.writeFileSync(root+'/'+bundle,source);
 }
 let intake=fs.readFileSync(root+'/photobridge-r1137-lab-local-intake.js','utf8');
 if(!intake.includes('/* PB1564 order SMS choice */')){
  intake=once(intake,'async function api(url,body){try{',`async function api(url,body){try{
 if(body&&/^\\/api\\/lab\\/delegated-orders\\/[^/]+\\/submit$/.test(url))body={...body,sendOrderSms:body.sendInvoiceSms===true};
 if(window.pbNativeStorage&&/^\\/api\\/lab\\/delegated-customers\\/[^/]+\\/account-summary$/.test(url))url=url.replace('/api/lab/delegated-customers','/api/lab/intake-live/download/customers');`);
  intake=once(intake,'sms.checked=model.sendInvoiceSms===true;sms.disabled=!data.smsEnabled;','sms.checked=model.sendInvoiceSms===true;sms.disabled=false;');
  intake=once(intake,"sms.setAttribute('aria-label','ارسال پیامک فاکتور همین سفارش');","sms.setAttribute('aria-label','ارسال پیامک تأیید همین سفارش');");
  intake=once(intake,"smsChoice.title=data.smsEnabled?'پس از ثبت سفارش، پیامک فاکتور همین سفارش بعد از صدور ارسال می‌شود.':'ارسال پیامک برای این لابراتوار غیرفعال است';","smsChoice.title=(c.registrationPending?'هزینهٔ این پیامک بر عهدهٔ حساب مرکزی PhotoBridge است. ':'هزینهٔ این پیامک از کیف پول عکاس کم می‌شود. ')+'هزینه بر اساس تعداد بخش‌های متن نهایی محاسبه می‌شود؛ پیامک پس از ثبت همین سفارش ارسال می‌شود.';");
  intake=once(intake,"smsResult.status==='failed'?'سفارش ثبت شد، اما پیامک فاکتور ارسال نشد؛ وضعیت پیامک را بررسی کنید.':","smsResult.status==='failed'?'سفارش ثبت شد، اما پیامک ارسال نشد: '+(smsResult.error==='service_wallet_insufficient'?'اعتبار کیف پول پرداخت‌کننده کافی نیست.':smsResult.error==='lab_sms_disabled'?'مجوز پیامک لابراتوار فعال نیست.':'وضعیت سامانه پیامک را بررسی کنید.'):" );
  intake=once(intake,'پیامک فاکتور همین سفارش ارسال شد.','پیامک تأیید همین سفارش ارسال شد.');
  intake=once(intake,'درخواست پیامک ذخیره شد؛ پس از صدور فاکتور همین سفارش ارسال می‌شود.','درخواست پیامک ثبت شد؛ نتیجهٔ ارسال هنوز تأیید نشده است.');
  intake+='\n/* PB1564 order SMS choice */\n';fs.writeFileSync(root+'/photobridge-r1137-lab-local-intake.js',intake);
 }
 for(const file of [discount,bundle,'photobridge-r1137-lab-local-intake.js'])execFileSync(process.execPath,['--check',root+'/'+file],{stdio:'inherit'});
 const index=root+'/index.html';let html=fs.readFileSync(index,'utf8');for(const name of [discount,'index-UIRefine-v655-r84.js','photobridge-r1137-lab-local-intake.js'])html=html.replace(new RegExp('('+name.replaceAll('.','\\.')+'\\?[^"\\\']*)','g'),url=>url.includes('&fixes=r1564')?url:url+'&fixes=r1564');fs.writeFileSync(index,html);
}
execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});
execFileSync(process.execPath,['--check',smsModule],{stdio:'inherit'});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),file=native+'/manifest.json',m=JSON.parse(fs.readFileSync(file,'utf8'));
for(const name of [discount,bundle,'photobridge-r1137-lab-local-intake.js','index.html']){const row=m.files.find(f=>f.name===name);if(!row)throw Error('R1564 manifest entry missing');row.sha256=hash(fs.readFileSync(native+'/'+name));}m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(file,JSON.stringify(m));
console.log('[R1564] Selectable compact subscription plans and automatic browser archive download');
