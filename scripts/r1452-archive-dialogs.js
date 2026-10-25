// Project-styled archive messages; native <dialog> provides focus trapping and background inertness.
let pb1452DialogQueue=Promise.resolve();
function pb1452ArchiveDialog(message,{title='آرشیو سفارش‌ها',confirm=false,tone='info',acceptLabel}={}) {
  const open=()=>new Promise(resolve=>{
    const previous=document.activeElement,dialog=document.createElement('dialog');
    dialog.className='pb1452ArchiveDialog';dialog.dir='rtl';
    dialog.setAttribute('aria-labelledby','pb1452DialogTitle');dialog.setAttribute('aria-describedby','pb1452DialogMessage');
    const header=document.createElement('header'),brand=document.createElement('small'),heading=document.createElement('h3'),close=document.createElement('button'),body=document.createElement('div'),actions=document.createElement('footer');
    brand.textContent='فوتوبریج · آرشیو';heading.id='pb1452DialogTitle';heading.textContent=title;
    close.type='button';close.className='pb1452DialogClose';close.textContent='×';close.setAttribute('aria-label','بستن پنجره');
    const intro=document.createElement('div');intro.append(brand,heading);header.append(intro,close);
    body.id='pb1452DialogMessage';body.className='pb1452DialogMessage';body.textContent=String(message||'');
    const finish=value=>{dialog.close();dialog.remove();previous?.isConnected&&previous.focus?.();resolve(value)};
    close.onclick=()=>finish(false);dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false)});
    if(confirm){const cancel=document.createElement('button');cancel.type='button';cancel.textContent='انصراف';cancel.autofocus=true;cancel.onclick=()=>finish(false);actions.append(cancel)}
    const accept=document.createElement('button');accept.type='button';accept.className='primary';accept.textContent=acceptLabel||(confirm?'تأیید و ادامه':'متوجه شدم');accept.autofocus=!confirm;accept.onclick=()=>finish(true);actions.append(accept);
    dialog.dataset.tone=tone;dialog.append(header,body,actions);document.body.append(dialog);dialog.showModal();
  });
  const next=pb1452DialogQueue.then(open);pb1452DialogQueue=next.catch(()=>{});return next;
}
function pb1452ArchiveNotice(message,options){return pb1452ArchiveDialog(message,options)}
function pb1452ArchiveConfirm(message){return pb1452ArchiveDialog(message,{title:'تأیید چاپ مجدد',confirm:true,acceptLabel:'ساخت سفارش جدید'})}
function pb1452RetentionHours(settings){
  const value=settings||{};
  const raw=value.originalRetentionHours??(value.originalRetentionDays==null?NaN:Number(value.originalRetentionDays)*24);
  const hours=Number(raw);if(!Number.isFinite(hours)||hours<0||hours>87600)throw Error('retention_read_failed');return hours;
}
async function pb1452ReadRetention(){
  const data=await Me('/api/admin/storage-settings?readback='+Date.now());
  pb1452RetentionHours(data.settings);return data;
}
async function pb1452SaveRetention(value){
  const hours=Number(ss(String(value)).replace(/[٫,،]/g,'.'));
  if(String(value).trim()===''||!Number.isFinite(hours)||hours<0||hours>87600)throw Error('invalid_retention_hours');
  const saved=await Me('/api/admin/storage-settings',{method:'PUT',body:JSON.stringify({originalRetentionHours:hours,originalRetentionDays:hours/24})});
  if(saved?.queued||saved?.operationId)throw Error('retention_not_confirmed');
  const fresh=await pb1452ReadRetention();
  if(Math.abs(pb1452RetentionHours(fresh.settings)-hours)>1e-7)throw Error('retention_not_confirmed');
  return fresh;
}
