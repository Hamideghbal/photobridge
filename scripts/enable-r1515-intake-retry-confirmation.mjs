import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const once=(source,before,after,label)=>{
  const count=source.split(before).length-1;
  if(count!==1)throw Error(`R1515 ${label} anchor count ${count}`);
  return source.replace(before,after);
};

const intakeFile='dist/web/photobridge-r1137-lab-local-intake.js';
let intake=fs.readFileSync(intakeFile,'utf8');
if(!intake.includes('/* PB1515 recoverable stock retry and shared confirmation */')){
  intake=once(
    intake,
    "catch(e){throw Error(e.data?.message||errors[e.data?.error||e.message]||'ثبت سفارش انجام نشد. دوباره تلاش کن.');}",
    "catch(e){const code=e.data?.error||e.message,problem=Error(e.data?.message||errors[code]||'ثبت سفارش انجام نشد. دوباره تلاش کن.');problem.code=code;problem.data=e.data;throw problem;}",
    'structured API error'
  );
  intake=once(
    intake,
    'for(const item of entries){if(item.registered)continue;const result=await api(',
    'for(const item of entries){const result=await api(',
    'draft metadata replay'
  );
  intake=once(
    intake,
    'const clientOrderId=crypto.randomUUID();',
    'let committed=false;const clientOrderId=crypto.randomUUID();',
    'commit state'
  );
  intake=once(
    intake,
    "const result=await api('/api/lab/delegated-orders/'+order.orderId+'/submit',{sendInvoiceSms:customers.sendInvoiceSms===true});",
    "const result=await api('/api/lab/delegated-orders/'+order.orderId+'/submit',{sendInvoiceSms:customers.sendInvoiceSms===true});committed=true;",
    'commit confirmation'
  );
  intake=once(
    intake,
    "}catch(e){busy(false);error.textContent=e.name==='NotAllowedError'?'اجازهٔ ذخیره روی هارد داده نشد؛ سفارش ارسال نشد.':e.message;}",
    "}catch(e){if(!committed)locked=false;busy(false);const missing=e.name==='NotFoundError'||e.code==='ENOENT'||/requested file or directory could not be found/i.test(e.message||'');error.textContent=e.name==='NotAllowedError'?'اجازهٔ ذخیره روی هارد داده نشد؛ سفارش ارسال نشد.':missing?'فایل یا پوشه پیدا نشد؛ عکس را حذف و دوباره انتخاب کنید یا مسیر ذخیره‌سازی را بررسی کنید، سپس دوباره ثبت کنید.':e.message;}",
    'pre-commit retry unlock'
  );
  intake=once(
    intake,
    "form.append(done);close.disabled=false;form.dataset.busy='';submitting=false;",
    "form.append(done);close.disabled=false;form.dataset.busy='';submitting=false;modal.classList.add('pb1519IntakeComplete');",
    'compact completed intake'
  );
  intake+='\n/* PB1515 recoverable stock retry and shared confirmation */\n';
  fs.writeFileSync(intakeFile,intake);
}

const serverFile='dist/api/server.js';
let server=fs.readFileSync(serverFile,'utf8');
if(!server.includes('/* PB1515 delegated draft metadata replay */')){
  server=once(
    server,
    "if (already.rowCount) {\n                const f = already.rows[0], key = String(f.object_key || '');",
    `if (already.rowCount) {
                const replayCopies=albumMode?1:Number(b.printCopies??1);
                if(!Number.isInteger(replayCopies)||replayCopies<1||replayCopies>99)return sendJson(res,400,{error:'invalid_print_copies'});
                const replaySize=albumMode?null:(b.printSizeId?String(b.printSizeId):null),replayType=String(b.printType||'');
                if(!albumMode&&(!replaySize||!await labCanUsePrintSize(pool,labId,replaySize)))return sendJson(res,400,{error:'invalid_print_size'});
                if(!albumMode&&!['luster','silk','metallic'].includes(replayType))return sendJson(res,400,{error:'print_selection_required'});
                await pool.query(\`UPDATE order_files SET print_size_id=$4,print_type=$5,chassis=$6,frame=$7,print_copies=$8 WHERE id=$1 AND lab_id=$2 AND order_id=$3\`,[id,labId,order.id,replaySize,albumMode?null:replayType,Boolean(b.chassis),Boolean(b.frame),replayCopies]);
                /* PB1515 delegated draft metadata replay */
                const f = already.rows[0], key = String(f.object_key || '');`,
    'server replay update'
  );
  fs.writeFileSync(serverFile,server);
}

const css=`<style>/* PB1515 shared intake confirmation */
.pb1137Intake.pb1519IntakeComplete{box-sizing:border-box!important;position:fixed!important;inset:50% auto auto 50%!important;transform:translate(-50%,-50%)!important;width:min(420px,calc(100vw - 32px))!important;height:auto!important;min-height:0!important;max-height:calc(100dvh - 32px)!important;margin:0!important;padding:0 18px 18px!important;overflow:auto!important;border-radius:10px!important}
.pb1137Intake.pb1519IntakeComplete>header{box-sizing:border-box!important;position:relative!important;display:grid!important;place-items:center!important;width:calc(100% + 36px)!important;min-height:48px!important;height:48px!important;margin:0 -18px 12px!important;padding:8px 18px!important;gap:0!important}.pb1137Intake.pb1519IntakeComplete>header h2{width:100%!important;margin:0!important;padding:0 40px!important;text-align:center!important;font:800 14px/1.4 Vazirmatn,Tahoma,sans-serif!important}.pb1137Intake.pb1519IntakeComplete>header>.pb1469IntakeClose{position:absolute!important;left:18px!important;top:8px!important;right:auto!important;width:32px!important;min-width:32px!important;height:32px!important;min-height:32px!important;margin:0!important;padding:0!important;font-size:20px!important}
.pb1137Intake.pb1519IntakeComplete>p{display:none!important}.pb1137Intake.pb1519IntakeComplete form{display:grid!important;gap:10px!important;min-height:0!important;height:auto!important;overflow:visible!important;margin:0!important;text-align:center!important}
.pb1137Intake.pb1519IntakeComplete form h3{margin:4px 0 0!important;font-size:17px!important}.pb1137Intake.pb1519IntakeComplete form p{margin:0!important;color:#667085!important;font-size:12px!important;line-height:1.8!important}
.pb1137Intake.pb1519IntakeComplete form>button{width:100%!important;min-height:40px!important;margin:4px 0 0!important;border:0!important;border-radius:8px!important;background:#315efb!important;color:#fff!important;font-weight:800!important}
</style>`;
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('PB1515 shared intake confirmation'))html=html.replace('</head>',css+'</head>');
  html=html.replace(/(photobridge-r1137-lab-local-intake\.js\?[^"'\s]*)/g,url=>url.includes('intakeRetry=r1521')?url:url.replace(/&intakeRetry=r151[5789]|&intakeRetry=r1520/g,'')+'&intakeRetry=r1521');
  fs.writeFileSync(file,html);
}
for(const file of [intakeFile,serverFile])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
