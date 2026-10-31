/* Desktop picker owns saving; it does not depend on hidden mobile avatar inputs. */
(()=>{
 'use strict';let input,epoch=0,busy=false;
 addEventListener('photobridge-auth-session-changed',()=>{epoch++;if(input)input.value='';});
 async function imageData(file){
  if(!/^image\/(jpeg|png|webp)$/i.test(file.type||''))throw Error('فرمت عکس باید JPG، PNG یا WebP باشد.');
  if(file.size>8*1024*1024)throw Error('حجم عکس باید کمتر از ۸ مگابایت باشد.');
  const url=URL.createObjectURL(file);
  try{const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('فایل عکس خوانده نشد.'));im.src=url;});
   const side=Math.min(img.naturalWidth,img.naturalHeight),canvas=document.createElement('canvas');canvas.width=canvas.height=192;
   const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('آماده‌سازی عکس انجام نشد.');ctx.fillStyle='#fff';ctx.fillRect(0,0,192,192);ctx.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,192,192);return canvas.toDataURL('image/jpeg',.84);
  }finally{URL.revokeObjectURL(url);}
 }
 window.PBDesktopPhotographerAvatarInput=()=>{
  if(input?.isConnected)return input;
  input=document.createElement('input');input.id='pb1325DesktopAvatarInput';input.type='file';input.accept='image/jpeg,image/png,image/webp';input.hidden=true;document.body.append(input);
  input.addEventListener('change',async()=>{
   const file=input.files?.[0],version=epoch;input.value='';if(!file||busy)return;
   busy=true;const buttons=[...document.querySelectorAll('.pb1163ProfileButton')];for(const button of buttons){button.disabled=true;button.setAttribute('aria-busy','true');button.title='در حال ذخیره عکس…';}
   try{
    const data=await imageData(file);if(version!==epoch)return;
    const response=await fetch('/api/photographer/profile/avatar',{method:'PUT',credentials:'include',headers:{'content-type':'application/json','x-photobridge-portal':'photographer'},body:JSON.stringify({imageData:data})});
    const result=await response.json().catch(()=>({}));
    if(!response.ok){const message=response.status===404?'پروفایل عکاسی این حساب پیدا نشد.':response.status===401||response.status===403?'برای ذخیره عکس دوباره وارد حساب عکاس شوید.':'ذخیره عکس پروفایل انجام نشد؛ دوباره تلاش کنید.';throw Error(message);}
    if(version!==epoch)return;
    const saved=typeof result.imageData==='string'?result.imageData:data;
    dispatchEvent(new CustomEvent('photobridge-profile-avatar-updated',{detail:{imageData:saved}}));
   }catch(error){if(version===epoch)alert(error.message||'ذخیره عکس پروفایل انجام نشد.');}
   finally{busy=false;for(const button of buttons){button.disabled=false;button.removeAttribute('aria-busy');button.title='عکس پروفایل';}}
  });return input;
 };
})();
