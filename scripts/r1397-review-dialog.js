function pb1397ReviewDialog(message,{confirm=false,title:heading,confirmText}={}){
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='pb1397ReviewDialog'+(confirm?' pb1399ConfirmReview':'');dialog.dir='rtl';
  const title=document.createElement('h2');title.id='pb1397ReviewTitle';title.textContent=heading||'نتیجهٔ بررسی درخواست';dialog.setAttribute('aria-labelledby',title.id);
  const eyebrow=document.createElement('span');eyebrow.className='pb1397ReviewEyebrow';eyebrow.textContent='همکاری با عکاس';
  const body=document.createElement('div');body.className='pb1397ReviewBody';
  for(const line of String(message||'').split('\n').filter(Boolean)){const p=document.createElement('p');p.textContent=line;body.append(p)}
  const actions=document.createElement('div');actions.className='pb1397ReviewActions';
  let accepted=false;const cancel=confirm?document.createElement('button'):null;if(cancel){cancel.type='button';cancel.className='pb1399DialogCancel';cancel.textContent='انصراف';cancel.addEventListener('click',()=>dialog.close());actions.append(cancel)}
  const close=document.createElement('button');close.type='button';close.textContent=confirmText||'متوجه شدم';close.addEventListener('click',()=>{accepted=true;dialog.close()});actions.append(close);
  dialog.append(eyebrow,title,body,actions);dialog.addEventListener('close',()=>{dialog.remove();resolve(accepted)},{once:true});document.body.append(dialog);dialog.showModal();(cancel||close).focus();
 });
}
