'use strict';
function patchOfflineIntake(source){
 const changes=[
 ["   const moveResult=await window.pb1466IntakeMove.finish(targets);","   const moveResult=result.desktopPending?{moved:0,pending:true}:await window.pb1466IntakeMove.finish(targets);"],
 ["node('h3','سفارش شمارهٔ '+order.orderNumber+' ثبت شد.')","node('h3',result.desktopPending?'سفارش محلی ذخیره شد؛ در انتظار تأیید سرور':'سفارش شمارهٔ '+order.orderNumber+' ثبت شد.')"],
 ["{sendInvoiceSms:customers.sendInvoiceSms===true});","{sendInvoiceSms:customers.sendInvoiceSms===true,desktopProforma:{customer:billCustomer.textContent,rows:billRows.textContent,total:billTotals.textContent,estimatedTotal:albumMode?albumForm.estimate().total:null,estimateComplete:albumMode&&!albumForm.estimate().missing},desktopLocalFiles:targets.map(({item,target})=>({rootId:target.dir.rootId,parts:[...target.dir.parts,item.localName||item.file.name],bytes:item.file.size}))});"],
 ["   window.pb1466IntakeMove.report(form,targets,moveResult);","   if(!result.desktopPending)window.pb1466IntakeMove.report(form,targets,moveResult);else form.append(node('p',result.localCommitted?'سفارش روی دستگاه ثبت شد و قابل استفاده است. عکس‌ها روی هارد ذخیره شدند؛ همگام‌سازی جداگانه انجام می‌شود و جلوی کار را نمی‌گیرد.':'عکس‌ها روی هارد ذخیره شدند و مبدأ حذف نشده است. شمارهٔ سفارش و فاکتور قطعی پس از تأیید سرور مشخص می‌شود.'));"],
 ];
 for(const [from,to] of changes){if(!source.includes(from))throw Error('offline_intake_ui_incompatible');source=source.replace(from,to);}
 const completion="form.append(done);close.disabled=false;form.dataset.busy='';submitting=false;";
 source=source.replace(completion,completion+"if(window.pbManualInvoiceFlow?.open){closeModal();void window.pbManualInvoiceFlow.open({orderId:order.orderId,labId:bootstrap.lab?.id});}");
 source=source.replace('ثبت سفارش و ذخیره پیش‌فاکتور','ثبت سفارش و صدور فاکتور');
 source=source.replace('عکس‌ها در مسیر سفارش روی هارد ثبت شدند. وضعیت سفارش دانلودشده است؛ پیش‌فاکتور تا زمان «آماده تحویل» قطعی نمی‌شود.','عکس‌ها در مسیر سفارش روی هارد ثبت شدند. فاکتور پس از تکمیل قیمت‌گذاری همین سفارش صادر می‌شود.');
 return source;
}
module.exports={patchOfflineIntake};
