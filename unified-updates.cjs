'use strict';
function createUnifiedUpdates({checkProgram,checkUi,uiBusy,pending,uiError,canApply,apply,show,prompt,isOnline=()=>true,progress=()=>{},stopProgress=()=>{},waitForUi=async()=>{}}){
 let flight=null;
 async function run(){
  await show();
  if(!isOnline())return prompt({kind:'error',message:'اینترنت قطع است. برای دریافت به‌روزرسانی، اتصال را برقرار کنید و تلاش دوباره را بزنید. نسخهٔ فعلی برنامه حفظ می‌شود.'});
  progress({start:true,message:'در حال بررسی و دریافت به‌روزرسانی ظاهر برنامه…',percent:0});
  try{
   if(uiBusy())await waitForUi();
   await checkUi((done,total)=>progress({message:`دریافت فایل‌های رابط برنامه: ${Number(done).toLocaleString('fa-IR')} از ${Number(total).toLocaleString('fa-IR')}`,percent:total?Math.round(done/total*100):0}));
  }finally{stopProgress();}
  const program=await checkProgram();
  if(['ready','busy','cancelled'].includes(program?.state))return;
  if(pending()){
   if(await prompt({kind:'ready'})==='apply'){
    if(!await canApply())return prompt({kind:'busy',message:'ابتدا فرم‌های باز و عملیات ذخیره‌سازی را تمام کنید؛ سپس دوباره به‌روزرسانی را بزنید.'});
    const applied=await apply();if(applied===false)return prompt({kind:'error',message:'اعمال ظاهر جدید انجام نشد؛ نسخهٔ سالم قبلی حفظ شد. با تلاش دوباره، فایل‌های رابط مجدداً بررسی می‌شوند.'});
   }
  }else if(uiError()||program?.state==='error')return prompt({kind:'error',message:!isOnline()?'اینترنت قطع شده است. پس از اتصال، تلاش دوباره را بزنید تا دریافت به‌روزرسانی ادامه پیدا کند.':'دریافت یا بررسی فایل‌های به‌روزرسانی کامل نشد. نسخهٔ فعلی حفظ شده؛ دوباره تلاش کنید.'});
  else if(program?.state==='available')return;
  else if(program?.state==='login_required')return prompt({kind:'error',message:'برای بررسی نسخهٔ برنامه، ابتدا وارد حساب لابراتوار شوید.'});
  else return prompt({kind:'current'});
 }
 async function loop(){for(;;){let result;try{result=await run()}catch{stopProgress();result=await prompt({kind:'error',message:!isOnline()?'اینترنت قطع است. پس از اتصال، تلاش دوباره را بزنید.':'بررسی به‌روزرسانی کامل نشد؛ نسخهٔ فعلی حفظ شده است. دوباره تلاش کنید.'})}if(result!=='retry')return;}}
 function check(){if(flight)return flight;flight=loop().finally(()=>{flight=null});return flight;}
 return{check};
}
module.exports={createUnifiedUpdates};
