'use strict';
function createUnifiedUpdates({checkProgram,checkUi,uiBusy,pending,uiError,canApply,apply,show,prompt,isOnline=()=>true,progress=()=>{},stopProgress=()=>{},waitForUi=async()=>{}}){
 let flight=null;

 async function applyReady(fast){
  if(!pending())return false;
  if(!fast&&(await prompt({kind:'ready'}))!=='apply')return true;
  if(!await canApply()){
   await prompt({kind:'busy',message:'فرم باز یا عملیات ذخیره‌سازی را تمام کنید؛ فایل‌های دریافت‌شده محفوظ هستند. سپس از منوی کنار ساعت دوباره به‌روزرسانی سریع ظاهر را بزنید.'});
   return true;
  }
  try{
   return await apply()===false?'failed':true;
  }catch{return 'failed';}
 }
 async function run(uiOnly=false,fast=false){
  await show();
  if(uiBusy())await waitForUi();
  // Offer a queued UI first, but a UI failure must not suppress installer updates.
  let uiResult=await applyReady(fast);
  if(uiResult===true)return;
  if(!isOnline())return prompt({kind:'error',message:'اینترنت قطع است؛ نسخهٔ فعلی حفظ می‌شود. پس از اتصال، از منوی کنار ساعت دوباره بررسی کنید.'});
  let failure=null;
  if(uiResult!=='failed'){
   progress({start:true,message:'در حال بررسی و دریافت به‌روزرسانی ظاهر برنامه…',percent:0});
   try{
    await checkUi((done,total)=>progress({message:'دریافت فایل‌های رابط برنامه: '+Number(done).toLocaleString('fa-IR')+' از '+Number(total).toLocaleString('fa-IR'),percent:total?Math.round(done/total*100):0}));
   }catch(error){failure=error;}finally{stopProgress();}
   uiResult=await applyReady(fast);
   if(uiResult===true)return;
  }
  const uiFailure=uiResult==='failed'
   ?'اعمال ظاهر جدید انجام نشد. نسخهٔ سالم قبلی و فایل‌های دانلودشده حفظ شدند.'
   :failure||uiError()?'دریافت فایل‌های ظاهر کامل نشد؛ نسخهٔ فعلی حفظ می‌شود. از منوی کنار ساعت دوباره بررسی کنید.':null;
  if(!uiOnly){
   let program;
   try{program=await checkProgram();}catch{program={state:'error'};}
   if(['ready','busy','cancelled','available'].includes(program?.state))return;
   if(program?.state==='error')return prompt({kind:'error',message:'بررسی نسخهٔ نصبی کامل نشد؛ نسخهٔ فعلی برنامه حفظ می‌شود.'});
   if(program?.state==='login_required')return prompt({kind:'error',message:'برای بررسی نسخهٔ برنامه، ابتدا وارد حساب لابراتوار شوید.'});
  }
  return uiFailure?prompt({kind:'error',message:uiFailure}):prompt({kind:'current'});
 }
 async function loop(uiOnly=false,fast=false){
  try{return await run(uiOnly,fast)}
  catch{stopProgress();return prompt({kind:'error',message:'بررسی یا اعمال به‌روزرسانی کامل نشد؛ نسخهٔ فعلی حفظ شده است. از منوی کنار ساعت دوباره اقدام کنید.'})}
 }
 function start(uiOnly,fast){if(flight)return flight;flight=loop(uiOnly,fast).finally(()=>{flight=null});return flight;}
 function check(){return start(false,false)}
 function checkUiOnly(){return start(true,true)}
 return{check,checkUiOnly};
}
module.exports={createUnifiedUpdates};
