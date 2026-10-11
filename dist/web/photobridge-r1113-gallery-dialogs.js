(()=>{
 if(window.pb1113GalleryConfirm)return;
 let tail=Promise.resolve();
 const open=(message,confirm)=>new Promise(resolve=>{
  const previous=document.activeElement,dialog=document.createElement('dialog');dialog.className='pb1113GalleryDialog';dialog.dir='rtl';dialog.setAttribute('aria-labelledby','pb1113GalleryDialogTitle');
  const title=document.createElement('h2');title.id='pb1113GalleryDialogTitle';title.textContent=confirm?'تأیید عملیات گالری':'پیام گالری';
  const text=document.createElement('p');text.textContent=String(message||'');
  const actions=document.createElement('div');actions.className='pb1113GalleryDialogActions';
  const finish=value=>{dialog.close();dialog.remove();if(previous?.isConnected)previous.focus({preventScroll:true});resolve(value)};
  if(confirm){const cancel=document.createElement('button');cancel.type='button';cancel.textContent='انصراف';cancel.autofocus=true;cancel.onclick=()=>finish(false);actions.append(cancel)}
  const accept=document.createElement('button');accept.type='button';accept.className=confirm&&/حذف/.test(String(message))?'danger':'primary';accept.textContent=confirm?'تأیید':'متوجه شدم';accept.autofocus=!confirm;accept.onclick=()=>finish(true);actions.append(accept);
  dialog.append(title,text,actions);document.body.append(dialog);dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false)});dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)finish(false)}});dialog.showModal();
 });
 const queued=(text,confirm)=>{const result=tail.then(()=>open(text,confirm));tail=result.catch(()=>{});return result};
 window.pb1113GalleryConfirm=text=>queued(text,true);
 window.pb1113GalleryNotice=text=>queued(text,false);
})();
