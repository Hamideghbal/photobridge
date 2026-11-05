'use strict';
function createUnifiedUpdates({checkProgram,checkUi,uiBusy,pending,uiError,canApply,apply,show,prompt}){
 let flight=null;
 async function run(){
  await show();
  if(uiBusy())return prompt({kind:'busy'});
  await checkUi();
  const program=await checkProgram();
  // Installer prompts and progress remain owned by the signed program updater.
  if(['ready','busy','cancelled'].includes(program?.state))return;
  if(pending()){
   if(await prompt({kind:'ready'})==='apply'){
    if(!await canApply())return prompt({kind:'busy',message:'ابتدا فرم‌های باز و عملیات ذخیره‌سازی را تمام کنید؛ سپس دوباره به‌روزرسانی را بزنید.'});
    const applied=await apply();if(applied===false)return prompt({kind:'error',message:'اعمال ظاهر جدید انجام نشد؛ نسخهٔ سالم قبلی حفظ شد.'});
   }
  }else if(uiError()||program?.state==='error')return prompt({kind:'error',message:'اتصال اینترنت یا دریافت به‌روزرسانی کامل نشده است. نسخهٔ فعلی حفظ شده؛ دوباره تلاش کنید.'});
  else if(program?.state==='available')return;
  else if(program?.state==='login_required')return prompt({kind:'error',message:'برای بررسی نسخهٔ برنامه، ابتدا وارد حساب لابراتوار شوید.'});
  else return prompt({kind:'current'});
 }
 function check(){if(flight)return flight;flight=run().then(async result=>{if(result==='retry'){flight=null;return check()}}).finally(()=>{flight=null});return flight;}
 return{check};
}
module.exports={createUnifiedUpdates};
