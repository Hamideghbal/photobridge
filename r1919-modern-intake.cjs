'use strict';
/**
 * R1919 current-site manual intake compatibility. Never copy in the older
 * October 2-button asset, and never rewrite the on-photo Copy/Cut selector.
 */
function patchModernIntake(source){
 if(typeof source!=='string'||!source.includes("'pb1504ActionToggle'")||!source.includes('labOutboxBootstrap'))throw Error('r1919_modern_ui_incompatible');
 if(source.includes('R1919_MODERN_NATIVE_INTAKE'))return source;
 const replace=(from,to)=>{
  if(source.split(from).length!==2)throw Error('r1919_modern_ui_anchor_mismatch: '+from.slice(0,95));
  source=source.replace(from,to);
 };
 // Local-only walk-in capabilities are checked by the native host's scoped
 // subscription/device/disk preflight. Never promote remote download-primary.
 replace('cachedPrimary?Promise.resolve({registered:true,isThisDevice:true}):labOutboxPrimary()',
  "window.pbNativeStorage?api('/api/lab/manual-intake/preflight').then(check=>({...check,registered:check.allowed===true,isThisDevice:check.allowed===true})):cachedPrimary?Promise.resolve({registered:true,isThisDevice:true}):labOutboxPrimary()");
 replace('primaryState=!!(primary.registered&&primary.isThisDevice);primaryCheckedAt=Date.now();',
  'if(!window.pbNativeStorage){primaryState=!!(primary.registered&&primary.isThisDevice);primaryCheckedAt=Date.now();}');
 replace("labOutboxBootstrap(/^\\/lab\\/album(?:s|[-/]|$)/.test(location.pathname)?'album':'print')",
  "window.pbNativeStorage?api('/api/lab/delegated-orders/bootstrap'+(albumMode?'':'?mode=print')):labOutboxBootstrap(albumMode?'album':'print')");
 // The native page already shows an immediate cancellable warmup dialog.
 replace('document.body.append(prep);prep.showModal();',
  'if(!window.pbNativeStorage){document.body.append(prep);prep.showModal();}');
 // Avoid the second 1200ms WAN bootstrap on each native modal open.
 const duplicate="  if(window.pbNativeStorage){\n   try{const live=await pb1884Bounded(api('/api/lab/intake-live/download/bootstrap'+(albumMode?'':'?mode=print')),1200);if(Array.isArray(live.customers)){const rows=new Map((data.customers||[]).filter(c=>c.local_contact||c.origin_offline&&!c.remote).map(c=>[String(c.serverId||c.id),c]));for(const c of live.customers)rows.set(String(c.id),c);data.customers=[...rows.values()];if(live.album)data.album=live.album;if(Array.isArray(live.printSizes))data.printSizes=live.printSizes;}}\n   catch{ /* Existing offline contacts remain selectable; no SMS success is claimed. */ }\n  }\n";
 replace(duplicate,'  /* R1919 native modal uses the current local bootstrap; no duplicate WAN fetch. */\n');
 // On native offline use durable local SQLite + file store, not a second full
 // binary copy into browser IndexedDB. Browser-only outbox remains untouched.
 replace("if(!labOutboxOffline())device=await pb1884Bounded(labOutboxLiveDevice(),2600);",
  "if(window.pbNativeStorage){const local=await api('/api/lab/manual-intake/preflight');if(!local.allowed)throw Error(local.message||'ثبت سفارش محلی تأیید نشد.');device={registered:true,isThisDevice:true,localOnly:local.localOnly};}else if(!labOutboxOffline())device=await pb1884Bounded(labOutboxLiveDevice(),2600);");
 replace("/* PB1888 deny secondary lab device */if(primaryState===false){document.getElementById('pb1137LocalIntakeButton')?.remove();return;}",
  "/* R1919_MODERN_NATIVE_INTAKE: local-only manual entry never grants remote primary. */if(!window.pbNativeStorage&&primaryState===false){document.getElementById('pb1137LocalIntakeButton')?.remove();return;}");
 replace('if(primaryState===null&&provider.deviceId())checkPrimary();',
  'if(!window.pbNativeStorage&&primaryState===null&&provider?.deviceId?.())checkPrimary();');
 // Keep the manual entry visible when the local storage bridge or the inner
 // header has not yet appeared; submission remains capability-gated.
 replace("if(!/^\\/lab(?:\\/|$)/.test(location.pathname)||!host||!provider){old?.remove();return;}",
  "if(!/^\\/lab(?:\\/|$)/.test(location.pathname)||!host){old?.remove();return;}");
 replace("const target=desktopQueue?(header||visibleFallback):host.querySelector('.ordersWorkspace');if(!target){old?.remove();return;}",
  "const target=(desktopQueue?(header||visibleFallback):host.querySelector('.ordersWorkspace'))||host;");
 replace('const provider=storage();let directory,bootstrap,loadError;',
  "const provider=storage();let directory,bootstrap,loadError;if(!provider||typeof provider.root!=='function'||typeof provider.request!=='function')loadError=Error('اتصال ذخیره‌سازی برنامه هنوز آماده نیست؛ دوباره تلاش کنید.');");
 replace(' try{\n  // The toolbar already checked this device.',
  ' try{if(loadError)throw loadError;\n  // The toolbar already checked this device.');

 // Incomplete/pending native sync must NEVER delete source files of Cut photos.
 replace('   const moveResult=await window.pb1466IntakeMove.finish(targets);',
  '   const pendingNative=window.pbNativeStorage&&(result.desktopPending||result.localCommitted&&result.syncPending);\n   const moveResult=pendingNative?{moved:0,pending:true}:await window.pb1466IntakeMove.finish(targets);');
 replace('   window.pb1466IntakeMove.report(form,targets,moveResult);',
  "   if(!pendingNative)window.pb1466IntakeMove.report(form,targets,moveResult);else form.append(node('p','فایل‌های سفارش روی دستگاه ثبت شدند؛ تا تأیید همگام‌سازی، عکس‌های مبدأ حذف نمی‌شوند.'));");
 replace('{sendInvoiceSms:customers.sendInvoiceSms===true});',
  '{sendInvoiceSms:customers.sendInvoiceSms===true,desktopProforma:{customer:billCustomer.textContent,rows:billRows.textContent,total:billTotals.textContent,estimatedTotal:albumMode?albumForm.estimate().total:null,estimateComplete:albumMode&&!albumForm.estimate().missing},desktopLocalFiles:targets.map(({item,target})=>({rootId:target.dir.rootId,parts:[...target.dir.parts,item.localName||item.file.name],bytes:item.file.size}))});');
 replace("form.append(done);close.disabled=false;form.dataset.busy='';submitting=false;",
  "form.append(done);close.disabled=false;form.dataset.busy='';submitting=false;if(window.pbManualInvoiceFlow?.open){closeModal();void window.pbManualInvoiceFlow.open({orderId:order.orderId,labId:bootstrap.lab?.id});}");
 replace('ثبت سفارش و ذخیره پیش‌فاکتور','ثبت سفارش و صدور فاکتور');
 replace('عکس‌ها در مسیر سفارش روی هارد ثبت شدند. وضعیت سفارش دانلودشده است؛ پیش‌فاکتور تا زمان «آماده تحویل» قطعی نمی‌شود.',
  'عکس‌ها در مسیر سفارش روی هارد ثبت شدند. فاکتور پس از تکمیل قیمت‌گذاری همین سفارش صادر می‌شود.');
 if(!source.includes("'pb1504ActionToggle'")||source.includes("movePhotos=node('button','انتقال عکس')"))throw Error('r1919_per_photo_copy_cut_was_rolled_back');
 return source;
}
module.exports={patchModernIntake};
