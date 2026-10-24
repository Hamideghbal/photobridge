function pb1397ReviewDialog(message){
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='pb1397ReviewDialog';dialog.dir='rtl';
  const title=document.createElement('h2');title.id='pb1397ReviewTitle';title.textContent='نتیجهٔ بررسی درخواست';dialog.setAttribute('aria-labelledby',title.id);
  const eyebrow=document.createElement('span');eyebrow.className='pb1397ReviewEyebrow';eyebrow.textContent='همکاری با عکاس';
  const body=document.createElement('div');body.className='pb1397ReviewBody';
  for(const line of String(message||'').split('\n').filter(Boolean)){const p=document.createElement('p');p.textContent=line;body.append(p)}
  const actions=document.createElement('div');actions.className='pb1397ReviewActions';
  const close=document.createElement('button');close.type='button';close.textContent='متوجه شدم';close.addEventListener('click',()=>dialog.close());actions.append(close);
  dialog.append(eyebrow,title,body,actions);dialog.addEventListener('close',()=>{dialog.remove();resolve()},{once:true});document.body.append(dialog);dialog.showModal();close.focus();
 });
}
