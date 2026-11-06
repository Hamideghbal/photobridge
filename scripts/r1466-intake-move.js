/* PB1466: selected source files are removed only after a verified destination and committed order. */
(()=>{
 'use strict';
 if(window.pb1466IntakeMove)return;
 const sources=new WeakMap(),directHandles=[],pb1641SelectedHashes=new WeakMap(),pb1641VerifiedTargets=new WeakSet();
 const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;};
 // Only selected immutable File snapshots are cached. Fresh disk reads are rehashed
 // before a destructive move, so changing source files cannot bypass verification.
 const digest=async(file,cache=false)=>{
  if(!cache)return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('');
  let value=pb1641SelectedHashes.get(file);
  if(!value){
   value=digest(file,false);
   pb1641SelectedHashes.set(file,value);
   value.catch(()=>pb1641SelectedHashes.delete(file));
  }
  return value;
 };
 const message={source_missing:'فایل مبدأ پیدا نشد.',source_changed:'فایل مبدأ پس از انتخاب تغییر کرده است.',same_file:'پوشهٔ سفارش و فایل مبدأ نباید یک فایل باشند.',destination_changed:'فایل ذخیره‌شده کامل نیست یا تغییر کرده است.',source_permission:'اجازهٔ حذف از پوشهٔ مبدأ داده نشده است.',source_required:'عکس‌ها را با دکمهٔ انتخاب عکس‌ها از پوشهٔ مبدأ انتخاب کنید.',destination_exists:'در مسیر سفارش فایلی با همین نام و محتوای متفاوت وجود دارد.'};
 const fail=key=>Error(message[key]||key);
 async function pick(mode='copy'){
  let files=[];
  if(mode==='copy'){
   files=await new Promise(resolve=>{const input=node('input');input.type='file';input.multiple=true;input.accept='.jpg,.jpeg,.png,.tif,.tiff,.webp';input.hidden=true;document.body.append(input);input.onchange=()=>{const selected=[...input.files];input.remove();resolve(selected);};input.oncancel=()=>{input.remove();resolve(null);};input.click();});
   if(!files)return null;
   files=files.filter(f=>/\.(jpe?g|png|tiff?|webp)$/i.test(f.name));
   for(const file of files)sources.set(file,{copyOnly:true,key:crypto.randomUUID(),size:file.size,lastModified:file.lastModified,deleted:false});
   return files;
  }
  const unavailable='این نسخهٔ برنامه اجازهٔ انتقال مستقیم عکس‌ها را نمی‌دهد. از دکمهٔ «کپی عکس» استفاده کنید؛ فایل‌های مبدأ حذف نمی‌شوند.';
  const nativePicker=window.pbNativeFolder?.pickPhotos;if(!nativePicker&&typeof window.showOpenFilePicker!=='function')throw Error(unavailable);
  try{
   const handles=nativePicker?await nativePicker():await window.showOpenFilePicker({multiple:true,mode:'readwrite',id:'photobridge-intake-photos',types:[{description:'عکس‌های سفارش',accept:{'image/jpeg':['.jpg','.jpeg'],'image/png':['.png'],'image/tiff':['.tif','.tiff'],'image/webp':['.webp']}}]});
   const selected=[];
   for(const handle of handles){
    if(!/\.(jpe?g|png|tiff?|webp)$/i.test(handle.name))continue;
    if(handle.kind!=='file'||typeof handle.remove!=='function'||typeof handle.queryPermission!=='function')throw Error(unavailable);
    let permission=await handle.queryPermission({mode:'readwrite'});
    if(permission!=='granted'&&typeof handle.requestPermission==='function')permission=await handle.requestPermission({mode:'readwrite'});
    if(permission!=='granted')throw Error('اجازهٔ انتقال این عکس‌ها داده نشد. برای نگهداری مبدأ، از «کپی عکس» استفاده کنید.');
    const file=await handle.getFile();let identity;
    for(const candidate of directHandles)if(await candidate.handle.isSameEntry(handle)){identity=candidate;break;}
    if(!identity){identity={handle,key:crypto.randomUUID()};directHandles.push(identity);}
    selected.push([file,{direct:true,handle,name:file.name,key:identity.key,size:file.size,lastModified:file.lastModified,deleted:false}]);
   }
   for(const[file,source]of selected){sources.set(file,source);files.push(file);}return files;
  }catch(error){if(error.name==='AbortError')return null;if(['NotAllowedError','SecurityError','NotSupportedError','TypeError'].includes(error.name))throw Error(unavailable);throw error;}
 }
 const track=(item,file)=>{(item.pb1466Sources??=[item.file]).push(file);};
 function groups(targets){
  const map=new Map();for(const target of targets)for(const file of target.item.pb1466Sources||[target.item.file]){const source=sources.get(file);if(!source)throw fail('source_required');let group=map.get(source.key);if(!group){group={source,files:[],targets:[]};map.set(source.key,group);}group.files.push(file);if(!group.targets.includes(target))group.targets.push(target);}
  return [...map.values()];
 }
 async function original(group){
  const {source}=group;if(source.deleted)return;
  if(source.copyOnly)return digest(group.files[0],true);
  if(await (source.direct?source.handle:source.dir).queryPermission({mode:'readwrite'})!=='granted')throw fail('source_permission');
  let current;try{current=source.direct?source.handle:await source.dir.getFileHandle(source.name);}catch{throw fail('source_missing');}
  if(current.kind!=='file'||!await current.isSameEntry(source.handle))throw fail('source_changed');
  const file=await current.getFile();if(file.size!==source.size||file.lastModified!==source.lastModified)throw fail('source_changed');
  const hash=await digest(file);try{for(const selected of group.files)if(hash!==await digest(selected,true))throw fail('source_changed');}catch{throw fail('source_changed');}
  return hash;
 }
 async function destination(target,expected){
  const handle=await target.target.dir.getFileHandle(window.pbLabLocalIntakeStorage.fileName(target.file.original_name,'file'));
  const saved=await handle.getFile();if(saved.size!==target.item.file.size||await digest(saved)!==expected)throw fail('destination_changed');
  return handle;
 }
 async function prepare(targets){
  const selected=groups(targets);
  for(const group of selected){const hash=group.source.copyOnly?null:await original(group);for(const target of group.targets){let existing;try{existing=await target.target.dir.getFileHandle(window.pbLabLocalIntakeStorage.fileName(target.file.original_name,'file'));}catch(e){if(e.name!=='NotFoundError'&&e.code!=='ENOENT'&&e.name!=='ENOENT'&&!/^ENOENT: no such file or directory, lstat ['"].+['"]$/.test(e.message||''))throw e;}
    if(existing){for(const other of selected)if(other.source.handle&&await existing.isSameEntry(other.source.handle))throw fail('same_file');if(await digest(await existing.getFile())!==(hash||await original(group)))throw fail('destination_exists');}
  }}
 }
 async function verify(targets){for(const group of groups(targets)){if(group.source.deleted)continue;const hash=await original(group);for(const target of group.targets){const saved=await destination(target,hash);if(group.source.handle&&await saved.isSameEntry(group.source.handle))throw fail('same_file');}}for(const target of targets)pb1641VerifiedTargets.add(target);}
 async function finish(targets){
  // Copy-only orders have already been SHA-256 verified before the commit.
  // Never skip the final live disk check when ANY source will be deleted.
  let selected;try{selected=groups(targets);if(selected.some(group=>!group.source.copyOnly)||targets.some(target=>!pb1641VerifiedTargets.has(target)))await verify(targets);}catch(error){const total=selected?.length??targets.length,removed=selected?.filter(g=>g.source.deleted).length??0;return{removed,total,remaining:total-removed,error:error.message};}
  const errors=[];
  for(const group of selected){if(group.source.deleted||group.source.copyOnly)continue;try{const hash=await original(group);for(const target of group.targets)await destination(target,hash);if(group.source.direct)await group.source.handle.remove({recursive:false});else await group.source.dir.removeEntry(group.source.name,{recursive:false});group.source.deleted=true;}catch(error){errors.push(group.source.name+' — '+(Object.values(message).includes(error.message)?error.message:error.name==='NotAllowedError'?message.source_permission:'حذف از مبدأ انجام نشد؛ دسترسی پوشه یا باز بودن فایل در برنامه‌های دیگر را بررسی کنید.'));}}
  const removed=selected.filter(g=>g.source.deleted).length,copied=selected.filter(g=>g.source.copyOnly).length;return{removed,copied,total:selected.length,remaining:selected.length-removed-copied,error:errors[0]||''};
 }
 function report(parent,targets,result){
  const panel=node('section',null,'pb1466MoveResult');panel.setAttribute('role','status');parent.append(panel);
  const render=value=>{panel.replaceChildren();if(!value.remaining){if(value.copied)panel.append(node('p',value.copied.toLocaleString('fa-IR')+' عکس در پوشهٔ سفارش کپی شد؛ مبدأ طبق انتخاب شما باقی ماند.'));if(value.removed)panel.append(node('p',value.removed.toLocaleString('fa-IR')+' عکس به پوشهٔ سفارش منتقل شد و از پوشهٔ مبدأ حذف شد.'));return;}
   panel.append(node('strong','سفارش ثبت شد؛ حذف از مبدأ کامل نشده است.'),node('p','نسخهٔ سفارش محفوظ است. '+value.remaining.toLocaleString('fa-IR')+' عکس در مبدأ باقی مانده است؛ سفارش را دوباره ثبت نکنید.'),node('small',value.error));
   const retry=node('button','تلاش مجدد برای حذف از مبدأ');retry.type='button';retry.onclick=async()=>{retry.disabled=true;try{for(const g of groups(targets)){const handle=g.source.direct?g.source.handle:g.source.dir;if(!g.source.deleted&&handle?.requestPermission)await handle.requestPermission({mode:'readwrite'});}render(await finish(targets));}catch(e){render({...value,error:e.message});}};panel.append(retry);
  };render(result);
 }
 window.pb1466IntakeMove={pick,track,prepare,verify,finish,report};
})();

/* PB1641 safe manual intake fast-path */
