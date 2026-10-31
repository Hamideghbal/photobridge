'use strict';
const {checkWriteAccess,exempt}=require('./write-access.cjs');
function createQuickReply({store,request,getAccount,checkAccess=()=>checkWriteAccess(store,request)}){
 return async function(customerId,text,account){
  const valid=()=>{if(!account||getAccount()!==account)throw Error('حساب کاربری تغییر کرده است؛ دوباره پیام را باز کنید.')};
  valid();if(!/^[0-9a-f-]{36}$/i.test(String(customerId)))throw Error('گیرنده پیام معتبر نیست.');
  const message=String(text||'').trim();if(!message||message.length>4000)throw Error('متن پاسخ باید بین ۱ تا ۴۰۰۰ نویسه باشد.');
  const route='/api/lab/chat/'+customerId;
  if(!exempt('POST',route)){const access=await checkAccess();valid();if(!access.allowed)throw Error(access.message||'ارسال پاسخ برای این حساب فعال نیست.')}
  valid();let response;try{response=await request(route,{method:'POST',body:JSON.stringify({message})})}catch{throw Error('پاسخ ارسال نشد؛ اتصال اینترنت را بررسی کنید.')}
  valid();const data=await response.json().catch(()=>({}));valid();if(!response.ok||response.status===202||!data.message?.id)throw Error(data.display||'ارسال پاسخ تأیید نشد؛ پیام حفظ شده است.');
  return {sent:true};
 };
}
module.exports={createQuickReply};
