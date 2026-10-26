/* PB1466: selected source files are removed only after a verified destination and committed order. */
(()=>{
 'use strict';
 if(window.pb1466IntakeMove)return;
 const sources=new WeakMap(),roots=[];
 const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;};
 const digest=async file=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('');
 const message={source_missing:'فایل مبدأ پیدا نشد.',source_changed:'فایل مبدأ پس از انتخاب تغییر کرده است.',same_file:'پوشهٔ سفارش و فایل مبدأ نباید یک فایل باشند.',destination_changed:'فایل ذخیره‌شده کامل نیست یا تغییر کرده است.',source_permission:'اجازهٔ حذف از پوشهٔ مبدأ داده نشده است.',source_required:'عکس‌ها را با دکمهٔ انتخاب عکس‌ها از پوشهٔ مبدأ انتخاب کنید.',destination_exists:'در مسیر سفارش فایلی با همین نام و محتوای متفاوت وجود دارد.'};
 const fail=key=>Error(message[key]||key);
 async function pick(){
  let handles=[],files=[],nativePicked=false;const handleByFile=new WeakMap();
  if(typeof window.showOpenFilePicker==='function'){
   try{handles=await window.showOpenFilePicker({multiple:true,id:'photobridge-intake-photos',types:[{description:'عکس‌های سفارش',accept:{'image/jpeg':['.jpg','.jpeg'],'image/png':['.png'],'image/tiff':['.tif','.tiff'],'image/webp':['.webp']}}]});nativePicked=true;}catch(e){if(e.name==='AbortError')return null;if(!['NotSupportedError','SecurityError','TypeError'].includes(e.name))throw e;}
   for(const h of handles){const file=await h.getFile();files.push(file);handleByFile.set(file,h);}
  }
  if(!nativePicked){
   files=await new Promise(resolve=>{const input=node('input');input.type='file';input.multiple=true;input.accept='.jpg,.jpeg,.png,.tif,.tiff,.webp';input.hidden=true;document.body.append(input);input.onchange=()=>{const selected=[...input.files];input.remove();resolve(selected);};input.oncancel=()=>{input.remove();resolve(null);};input.click();});
   if(!files)return null;
  }
  files=files.filter(f=>/\.(jpe?g|png|tiff?|webp)$/i.test(f.name));if(!files.length)return null;
  return new Promise(resolve=>{
   const dialog=node('dialog',null,'pb1466SourcePicker');dialog.dir='rtl';dialog.setAttribute('aria-label','روش ذخیرهٔ عکس‌های انتخاب‌شده');
   const header=node('header');header.append(node('strong',files.length.toLocaleString('fa-IR')+' عکس انتخاب شد'));
   const description=node('p','برای انتقال، پوشه‌ای را انتخاب کنید که همین عکس‌ها داخل آن هستند. بعد از ثبت موفق و بررسی نسخهٔ سفارش، فقط همین عکس‌ها از مبدأ حذف می‌شوند.');
   const names=node('div',null,'pb1466SourceFiles');files.forEach(f=>names.append(node('span',f.name)));
   const actions=node('div',null,'pb1466SourceControls'),move=node('button','انتقال: انتخاب پوشهٔ مبدأ','primary'),copy=node('button','فقط کپی؛ مبدأ باقی بماند'),cancel=node('button','انصراف'),status=node('p');status.setAttribute('role','status');
   const close=value=>{dialog.close();dialog.remove();resolve(value);};cancel.onclick=()=>close(null);dialog.oncancel=e=>{e.preventDefault();if(!dialog.dataset.busy)close(null);};
   copy.onclick=()=>{for(const file of files)sources.set(file,{copyOnly:true,key:crypto.randomUUID(),size:file.size,lastModified:file.lastModified,deleted:false});close(files);};
   move.disabled=typeof window.showDirectoryPicker!=='function';if(move.disabled)description.textContent+=' در این برنامه امکان اجازهٔ حذف از مبدأ موجود نیست؛ از «فقط کپی» استفاده کنید یا انتقال را در Chrome انجام دهید.';
   move.onclick=async()=>{
    dialog.dataset.busy='1';move.disabled=copy.disabled=cancel.disabled=true;
    try{
     const dir=await window.showDirectoryPicker({id:'photobridge-intake-source',mode:'readwrite'});
     if(await dir.queryPermission({mode:'readwrite'})!=='granted')throw fail('source_permission');
     let root=roots.find(r=>r.handle===dir);if(!root){for(const r of roots)if(await r.handle.isSameEntry(dir)){root=r;break;}}if(!root){root={id:crypto.randomUUID(),handle:dir};roots.push(root);}
     const matched=[];
     for(let i=0;i<files.length;i++){
      const file=files[i];let handle;try{handle=await dir.getFileHandle(file.name);}catch{throw Error('پوشهٔ انتخاب‌شده شامل همهٔ عکس‌های انتخاب‌شده نیست؛ پوشهٔ اصلی این عکس‌ها را انتخاب کنید.');}
      if(handleByFile.has(file)&&!await handle.isSameEntry(handleByFile.get(file)))throw Error('این فایل‌ها مربوط به پوشهٔ دیگری هستند؛ پوشهٔ مبدأ صحیح را انتخاب کنید.');
      const current=await handle.getFile();if(current.size!==file.size||await digest(current)!==await digest(file))throw fail('source_changed');
      matched.push([file,{dir,handle,name:file.name,key:root.id+'/'+file.name,size:current.size,lastModified:current.lastModified,deleted:false}]);
     }
     for(const[file,source]of matched)sources.set(file,source);close(files);
    }catch(e){if(e.name!=='AbortError')status.textContent=e.message;delete dialog.dataset.busy;move.disabled=copy.disabled=cancel.disabled=false;}
   };
   actions.append(move,copy,cancel);dialog.append(header,description,names,status,actions);document.body.append(dialog);dialog.showModal();
  });
 }
 const track=(item,file)=>{(item.pb1466Sources??=[item.file]).push(file);};
 function groups(targets){
  const map=new Map();for(const target of targets)for(const file of target.item.pb1466Sources||[target.item.file]){const source=sources.get(file);if(!source)throw fail('source_required');let group=map.get(source.key);if(!group){group={source,files:[],targets:[]};map.set(source.key,group);}group.files.push(file);if(!group.targets.includes(target))group.targets.push(target);}
  return [...map.values()];
 }
 async function original(group){
  const {source}=group;if(source.deleted)return;
  if(source.copyOnly)return digest(group.files[0]);
  if(await source.dir.queryPermission({mode:'readwrite'})!=='granted')throw fail('source_permission');
  let current;try{current=await source.dir.getFileHandle(source.name);}catch{throw fail('source_missing');}
  if(current.kind!=='file'||!await current.isSameEntry(source.handle))throw fail('source_changed');
  const file=await current.getFile();if(file.size!==source.size||file.lastModified!==source.lastModified)throw fail('source_changed');
  const hash=await digest(file);try{for(const selected of group.files)if(hash!==await digest(selected))throw fail('source_changed');}catch{throw fail('source_changed');}
  return hash;
 }
 async function destination(target,expected){
  const handle=await target.target.dir.getFileHandle(window.pbLabLocalIntakeStorage.fileName(target.file.original_name,'file'));
  const saved=await handle.getFile();if(saved.size!==target.item.file.size||await digest(saved)!==expected)throw fail('destination_changed');
  return handle;
 }
 async function prepare(targets){
  const selected=groups(targets);
  for(const group of selected){const hash=await original(group);for(const target of group.targets){let existing;try{existing=await target.target.dir.getFileHandle(window.pbLabLocalIntakeStorage.fileName(target.file.original_name,'file'));}catch(e){if(e.name!=='NotFoundError')throw e;}
    if(existing){for(const other of selected)if(other.source.handle&&await existing.isSameEntry(other.source.handle))throw fail('same_file');if(await digest(await existing.getFile())!==hash)throw fail('destination_exists');}
  }}
 }
 async function verify(targets){for(const group of groups(targets)){if(group.source.deleted)continue;const hash=await original(group);for(const target of group.targets){const saved=await destination(target,hash);if(group.source.handle&&await saved.isSameEntry(group.source.handle))throw fail('same_file');}}}
 async function finish(targets){
  let selected;try{selected=groups(targets);await verify(targets);}catch(error){const total=selected?.length??targets.length,removed=selected?.filter(g=>g.source.deleted).length??0;return{removed,total,remaining:total-removed,error:error.message};}
  const errors=[];
  for(const group of selected){if(group.source.deleted||group.source.copyOnly)continue;try{const hash=await original(group);for(const target of group.targets)await destination(target,hash);await group.source.dir.removeEntry(group.source.name,{recursive:false});group.source.deleted=true;}catch(error){errors.push(group.source.name+' — '+(Object.values(message).includes(error.message)?error.message:error.name==='NotAllowedError'?message.source_permission:'حذف از مبدأ انجام نشد؛ دسترسی پوشه یا باز بودن فایل در برنامه‌های دیگر را بررسی کنید.'));}}
  const removed=selected.filter(g=>g.source.deleted).length,copied=selected.filter(g=>g.source.copyOnly).length;return{removed,copied,total:selected.length,remaining:selected.length-removed-copied,error:errors[0]||''};
 }
 function report(parent,targets,result){
  const panel=node('section',null,'pb1466MoveResult');panel.setAttribute('role','status');parent.append(panel);
  const render=value=>{panel.replaceChildren();if(!value.remaining){if(value.copied)panel.append(node('p',value.copied.toLocaleString('fa-IR')+' عکس در پوشهٔ سفارش کپی شد؛ مبدأ طبق انتخاب شما باقی ماند.'));if(value.removed)panel.append(node('p',value.removed.toLocaleString('fa-IR')+' عکس به پوشهٔ سفارش منتقل شد و از پوشهٔ مبدأ حذف شد.'));return;}
   panel.append(node('strong','سفارش ثبت شد؛ حذف از مبدأ کامل نشده است.'),node('p','نسخهٔ سفارش محفوظ است. '+value.remaining.toLocaleString('fa-IR')+' عکس در مبدأ باقی مانده است؛ سفارش را دوباره ثبت نکنید.'),node('small',value.error));
   const retry=node('button','تلاش مجدد برای حذف از مبدأ');retry.type='button';retry.onclick=async()=>{retry.disabled=true;try{for(const g of groups(targets))if(!g.source.deleted&&g.source.dir?.requestPermission)await g.source.dir.requestPermission({mode:'readwrite'});render(await finish(targets));}catch(e){render({...value,error:e.message});}};panel.append(retry);
  };render(result);
 }
 window.pb1466IntakeMove={pick,track,prepare,verify,finish,report};
})();
