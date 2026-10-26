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
  if(typeof window.showDirectoryPicker!=='function')throw Error('برای انتقال عکس‌ها از پوشهٔ مبدأ، این صفحه را در Chrome باز کنید.');
  let dir;try{dir=await window.showDirectoryPicker({id:'photobridge-intake-source',mode:'readwrite'});}catch(e){if(e.name==='AbortError')return null;throw e;}
  if(await dir.queryPermission({mode:'readwrite'})!=='granted')throw fail('source_permission');
  let root=roots.find(r=>r.handle===dir);if(!root){for(const r of roots)if(await r.handle.isSameEntry(dir)){root=r;break;}}
  if(!root){root={id:crypto.randomUUID(),handle:dir};roots.push(root);}
  const files=[];for await(const [name,handle]of dir.entries())if(handle.kind==='file'&&/\.(?:jpe?g|png|tiff?|webp)$/i.test(name))files.push({name,handle});
  files.sort((a,b)=>a.name.localeCompare(b.name,'fa',{numeric:true}));
  if(!files.length)throw Error('در این پوشه عکس قابل انتخابی وجود ندارد؛ پوشهٔ حاوی عکس‌ها را انتخاب کنید.');
  return new Promise(resolve=>{
   const dialog=node('dialog',null,'pb1466SourcePicker');dialog.dir='rtl';dialog.setAttribute('aria-label','انتخاب عکس‌ها از پوشهٔ مبدأ');
   const header=node('header');header.append(node('strong','انتخاب عکس‌های سفارش'),node('small','پوشهٔ مبدأ: '+dir.name));
   const notice=node('p','فقط عکس‌های انتخاب‌شده، پس از ذخیرهٔ کامل و ثبت موفق سفارش، از این پوشه حذف می‌شوند.');
   const list=node('div',null,'pb1466SourceFiles'),controls=node('div',null,'pb1466SourceControls'),all=node('button','انتخاب همه'),none=node('button','لغو انتخاب‌ها'),cancel=node('button','انصراف'),accept=node('button','افزودن عکس‌های انتخاب‌شده','primary'),status=node('p');status.setAttribute('role','status');
   const checkboxes=files.map(file=>{const row=node('label'),check=node('input');check.type='checkbox';check.setAttribute('aria-label',file.name);row.append(check,node('span',file.name));list.append(row);return check;});
   const update=()=>{const n=checkboxes.filter(c=>c.checked).length;accept.disabled=n===0;accept.textContent=n?'انتخاب '+n.toLocaleString('fa-IR')+' عکس':'افزودن عکس‌های انتخاب‌شده';};
   list.onchange=update;all.onclick=()=>{checkboxes.forEach(c=>c.checked=true);update();};none.onclick=()=>{checkboxes.forEach(c=>c.checked=false);update();};
   const close=value=>{dialog.close();dialog.remove();resolve(value);};cancel.onclick=()=>close(null);dialog.oncancel=e=>{e.preventDefault();if(!dialog.dataset.busy)close(null);};
   accept.onclick=async()=>{dialog.dataset.busy='1';for(const b of [accept,cancel,all,none,...checkboxes])b.disabled=true;try{const picked=[];for(let i=0;i<files.length;i++){if(!checkboxes[i].checked)continue;const {handle,name}=files[i],file=await handle.getFile();sources.set(file,{dir,handle,name,key:root.id+'/'+name,size:file.size,lastModified:file.lastModified,deleted:false});picked.push(file);}close(picked);}catch(e){status.textContent='خواندن عکس‌ها انجام نشد؛ دوباره تلاش کنید.';delete dialog.dataset.busy;for(const b of [accept,cancel,all,none,...checkboxes])b.disabled=false;update();}};
   controls.append(all,none,cancel,accept);dialog.append(header,notice,list,status,controls);document.body.append(dialog);update();dialog.showModal();
  });
 }
 const track=(item,file)=>{(item.pb1466Sources??=[item.file]).push(file);};
 function groups(targets){
  const map=new Map();for(const target of targets)for(const file of target.item.pb1466Sources||[target.item.file]){const source=sources.get(file);if(!source)throw fail('source_required');let group=map.get(source.key);if(!group){group={source,files:[],targets:[]};map.set(source.key,group);}group.files.push(file);if(!group.targets.includes(target))group.targets.push(target);}
  return [...map.values()];
 }
 async function original(group){
  const {source}=group;if(source.deleted)return;
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
    if(existing){for(const other of selected)if(await existing.isSameEntry(other.source.handle))throw fail('same_file');if(await digest(await existing.getFile())!==hash)throw fail('destination_exists');}
  }}
 }
 async function verify(targets){for(const group of groups(targets)){if(group.source.deleted)continue;const hash=await original(group);for(const target of group.targets){const saved=await destination(target,hash);if(await saved.isSameEntry(group.source.handle))throw fail('same_file');}}}
 async function finish(targets){
  let selected;try{selected=groups(targets);await verify(targets);}catch(error){const total=selected?.length??targets.length,removed=selected?.filter(g=>g.source.deleted).length??0;return{removed,total,remaining:total-removed,error:error.message};}
  const errors=[];
  for(const group of selected){if(group.source.deleted)continue;try{const hash=await original(group);for(const target of group.targets)await destination(target,hash);await group.source.dir.removeEntry(group.source.name,{recursive:false});group.source.deleted=true;}catch(error){errors.push(group.source.name+' — '+(Object.values(message).includes(error.message)?error.message:error.name==='NotAllowedError'?message.source_permission:'حذف از مبدأ انجام نشد؛ دسترسی پوشه یا باز بودن فایل در برنامه‌های دیگر را بررسی کنید.'));}}
  const removed=selected.filter(g=>g.source.deleted).length;return{removed,total:selected.length,remaining:selected.length-removed,error:errors[0]||''};
 }
 function report(parent,targets,result){
  const panel=node('section',null,'pb1466MoveResult');panel.setAttribute('role','status');parent.append(panel);
  const render=value=>{panel.replaceChildren();if(!value.remaining){panel.append(node('p',value.removed.toLocaleString('fa-IR')+' عکس به پوشهٔ سفارش منتقل شد و از پوشهٔ مبدأ حذف شد.'));return;}
   panel.append(node('strong','سفارش ثبت شد؛ حذف از مبدأ کامل نشده است.'),node('p','نسخهٔ سفارش محفوظ است. '+value.remaining.toLocaleString('fa-IR')+' عکس در مبدأ باقی مانده است؛ سفارش را دوباره ثبت نکنید.'),node('small',value.error));
   const retry=node('button','تلاش مجدد برای حذف از مبدأ');retry.type='button';retry.onclick=async()=>{retry.disabled=true;try{for(const g of groups(targets))if(!g.source.deleted&&g.source.dir.requestPermission)await g.source.dir.requestPermission({mode:'readwrite'});render(await finish(targets));}catch(e){render({...value,error:e.message});}};panel.append(retry);
  };render(result);
 }
 window.pb1466IntakeMove={pick,track,prepare,verify,finish,report};
})();
