'use strict';
function patchOfflineIntake(source){
 const changes=[
 ["   const moveResult=await window.pb1466IntakeMove.finish(targets);","   const moveResult=result.desktopPending?{moved:0,pending:true}:await window.pb1466IntakeMove.finish(targets);"],
 ["node('h3','سفارش شمارهٔ '+order.orderNumber+' ثبت شد.')","node('h3',result.desktopPending?'سفارش محلی ذخیره شد؛ در انتظار تأیید سرور':'سفارش شمارهٔ '+order.orderNumber+' ثبت شد.')"],
 ["{sendInvoiceSms:customers.sendInvoiceSms===true});","{sendInvoiceSms:customers.sendInvoiceSms===true,desktopProforma:{customer:billCustomer.textContent,rows:billRows.textContent,total:billTotals.textContent,estimatedTotal:albumMode?albumForm.estimate().total:null,estimateComplete:albumMode&&!albumForm.estimate().missing},desktopLocalFiles:targets.map(({item,target})=>({rootId:target.dir.rootId,parts:[...target.dir.parts,item.localName||item.file.name],bytes:item.file.size}))});"],
 ["   window.pb1466IntakeMove.report(form,targets,moveResult);","   if(!result.desktopPending)window.pb1466IntakeMove.report(form,targets,moveResult);else form.append(node('p',result.localCommitted?'سفارش روی دستگاه ثبت شد و قابل استفاده است. عکس‌ها روی هارد ذخیره شدند؛ همگام‌سازی جداگانه انجام می‌شود و جلوی کار را نمی‌گیرد.':'عکس‌ها روی هارد ذخیره شدند و مبدأ حذف نشده است. شمارهٔ سفارش و فاکتور قطعی پس از تأیید سرور مشخص می‌شود.'));"],
 ];
 for(const [from,to] of changes){if(source.includes(to))continue;if(!source.includes(from))throw Error('offline_intake_ui_incompatible: '+from.slice(0,100));source=source.replace(from,to);}
 // Opening may use this account's verified native disk. Submit and replay
 // still call the live device endpoint without the opening flag.
 source=source.replace('const live=labOutboxLiveDevice();',
  "const live=api('/api/lab/intake-live/download/device?purpose=open');");
 const completion="form.append(done);close.disabled=false;form.dataset.busy='';submitting=false;";
 if(!source.includes('window.pbManualInvoiceFlow?.open'))source=source.replace(completion,completion+"if(window.pbManualInvoiceFlow?.open){closeModal();void window.pbManualInvoiceFlow.open({orderId:order.orderId,labId:bootstrap.lab?.id});}");
 source=source.replace('ثبت سفارش و ذخیره پیش‌فاکتور','ثبت سفارش و صدور فاکتور');
 source=source.replace('عکس‌ها در مسیر سفارش روی هارد ثبت شدند. وضعیت سفارش دانلودشده است؛ پیش‌فاکتور تا زمان «آماده تحویل» قطعی نمی‌شود.','عکس‌ها در مسیر سفارش روی هارد ثبت شدند. فاکتور پس از تکمیل قیمت‌گذاری همین سفارش صادر می‌شود.');
 return restoreSinglePhotoPicker(source);
}
module.exports={patchOfflineIntake,restoreSinglePhotoPicker};


function restoreSinglePhotoPicker(source){
 const start=source.indexOf("const choose=node('button','انتخاب عکس‌ها');");
 const end=source.indexOf("const list=node('div',null,'pb1137Files pb1139Groups');",start);
 const oldInput=/fileInput\.onchange=\(\)=>\{pendingFiles=\[\.\.\.fileInput\.files\];[^\n]+\};/;
 if(start<0||end<0||!oldInput.test(source)||!source.includes('add.onclick=async()=>'))return source;
 const original=source.slice(start,end);
 const action=original.includes('const defaultPhotoAction=')?"const defaultPhotoAction=()=> 'copy';":'';
 const selectAction=source.includes("pendingAction='copy'")?"pendingAction='copy';":'';
 const modern=original.includes("pick('select')");
 const controls=`
 const choose=node('button','انتخاب عکس‌ها','pbNativeIntakePhotoPicker');choose.type='button';
 choose.setAttribute('aria-label','انتخاب عکس‌ها');field(settings,'عکس‌ها',choose);
 ${action}
 const add=node('button');add.type='button';
 let pbNativePicking=false;
 const pbNativePending=node('div',null,'pbNativePendingPhotos');
 const pbNativePendingUrls=[];
 function pbNativeShowPending(){
  for(const url of pbNativePendingUrls.splice(0))URL.revokeObjectURL(url);
  pbNativePending.replaceChildren();pbNativePending.hidden=!pendingFiles.length;
  for(const file of pendingFiles){
   const figure=node('figure'),image=node('img');
   const url=URL.createObjectURL(file);
   image.src=url;image.alt=file.name;image.loading='lazy';
   pbNativePendingUrls.push(url);previews.push(url);
   figure.append(image,node('figcaption',file.name));pbNativePending.append(figure);
  }
 }
 async function pbNativeAddSelected(){
  if(locked||submitting||!pendingFiles.length)return;
  if(!defaultSize.value){error.textContent='عکس‌ها انتخاب شدند. سایز را مشخص کن تا به سفارش اضافه شوند.';return;}
  await add.onclick();
  if(!pendingFiles.length)pbNativeShowPending();
 }
 async function pbNativeAcceptPhotos(files){
  if(!files?.length||locked||submitting||!modal.open)return;
  pendingFiles.push(...files);${selectAction}
  pbNativeShowPending();
  await pbNativeAddSelected();
 }
 choose.onclick=async()=>{
  if(locked||submitting||pbNativePicking)return;
  pbNativePicking=true;error.textContent='';
  try{
   const mode=${modern}&&navigator.onLine!==false&&window.pbNativeFolder?.pickPhotos?'select':'copy';
   const files=await window.pb1466IntakeMove.pick(mode);
   await pbNativeAcceptPhotos(files);
  }catch(problem){error.textContent=problem.message;}
  finally{pbNativePicking=false;}
 };
 defaultSize.addEventListener('change',()=>void pbNativeAddSelected());
 `;
 return (source.slice(0,start)+controls+source.slice(end))
  .replace('editor.append(list);','editor.append(list,pbNativePending);pbNativePending.hidden=true;')
  .replace(oldInput,'fileInput.onchange=()=>void pbNativeAcceptPhotos([...fileInput.files]);')
  .replace('عکس‌های انتخاب‌شده را با دکمهٔ افزودن به سفارش اضافه کن.','سایز عکس‌های انتخاب‌شده را مشخص کن.');
}
