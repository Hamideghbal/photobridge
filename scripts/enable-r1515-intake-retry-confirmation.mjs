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
    "async function api(url,body){try{return await storage().request(url,{...(body?{method:'POST',body:JSON.stringify(body)}:{})});}catch(e){throw Error(e.data?.message||errors[e.data?.error||e.message]||'ثبت سفارش انجام نشد. دوباره تلاش کن.');}}",
    "async function api(url,body){try{return await storage().request(url,{...(body?{method:'POST',body:JSON.stringify(body)}:{})});}catch(e){const code=e.data?.error||e.message,problem=Error(e.data?.message||errors[code]||'ثبت سفارش انجام نشد. دوباره تلاش کن.');problem.code=code;problem.data=e.data;throw problem;}}",
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
    "}catch(e){busy(false);error.textContent=e.name==='NotAllowedError'?'اجازهٔ ذخیره روی هارد داده نشد؛ سفارش ارسال نشد.':e.message;}",
    "}catch(e){if(e.code==='stock_unavailable')locked=false;busy(false);error.textContent=e.name==='NotAllowedError'?'اجازهٔ ذخیره روی هارد داده نشد؛ سفارش ارسال نشد.':e.message;}",
    'stock retry unlock'
  );
  intake=once(
    intake,
    "form.append(done);close.disabled=false;form.dataset.busy='';submitting=false;",
    "form.append(done);close.disabled=false;form.dataset.busy='';submitting=false;pb1515ShowIntakeConfirmation({number:order.orderNumber,message:albumMode?'سفارش آلبوم با موفقیت ثبت شد.':'سفارش عکس با موفقیت ثبت شد.',onOpen:done.onclick});",
    'shared success confirmation'
  );
  intake+=`\nfunction pb1515ShowIntakeConfirmation({number,message,onOpen}){
 const old=document.querySelector('.pb1515IntakeConfirmation');old?.remove();
 const box=node('dialog',null,'pb1515IntakeConfirmation');box.setAttribute('dir','rtl');box.setAttribute('aria-label','تأیید ثبت سفارش');
 const mark=node('span','✓','pb1515ConfirmMark'),title=node('h3','سفارش شمارهٔ '+number+' ثبت شد.'),text=node('p',message);
 const actions=node('div',null,'pb1515ConfirmActions'),stay=node('button','بستن'),open=node('button','نمایش سفارش');
 stay.type='button';open.type='button';stay.onclick=()=>{box.close();box.remove();};open.onclick=()=>{box.close();box.remove();onOpen();};
 actions.append(stay,open);box.append(mark,title,text,actions);document.body.append(box);box.addEventListener('cancel',event=>{event.preventDefault();stay.click();});box.showModal();
}\n/* PB1515 recoverable stock retry and shared confirmation */\n`;
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
.pb1515IntakeConfirmation{box-sizing:border-box;width:min(430px,calc(100vw - 28px));padding:24px;border:1px solid #dce6f2;border-radius:12px;background:#fff;color:#26364a;text-align:center;font-family:Vazirmatn,Tahoma,sans-serif;box-shadow:0 22px 70px #10233d38}
.pb1515IntakeConfirmation::backdrop{background:#10233d73}
.pb1515ConfirmMark{display:grid;width:48px;height:48px;margin:0 auto 12px;place-items:center;border-radius:50%;background:#e9f8ef;color:#087443;font-size:26px;font-weight:900}
.pb1515IntakeConfirmation h3{margin:0;font-size:18px}.pb1515IntakeConfirmation p{margin:8px 0 20px;color:#667085;font-size:13px}
.pb1515ConfirmActions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pb1515ConfirmActions button{min-height:42px;border:1px solid #d6e1f0;border-radius:8px;background:#fff;color:#344054;font:800 13px Vazirmatn,Tahoma,sans-serif}
.pb1515ConfirmActions button:last-child{border-color:#315efb;background:#315efb;color:#fff}
</style>`;
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('PB1515 shared intake confirmation'))html=html.replace('</head>',css+'</head>');
  html=html.replace(/(photobridge-r1137-lab-local-intake\.js\?[^"'\s]*)/g,url=>url.includes('intakeRetry=r1515')?url:url+'&intakeRetry=r1515');
  fs.writeFileSync(file,html);
}
for(const file of [intakeFile,serverFile])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
