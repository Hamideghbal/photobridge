(()=>{'use strict';
 if(!window.pbNativeStorage||window.pbNativeFolder)return;
 const invoke=async(action,payload)=>{const packet=await window.pbNativeStorage.invoke(action,payload);if(!packet.ok){const error=new Error(packet.error.message);Object.assign(error,packet.error);throw error}return packet.value};
 const identity=handle=>({rootId:handle.rootId,parts:handle.parts});
 const child=(desc,name)=>({...identity(desc),parts:[...desc.parts,name]});
 function handle(desc){
  const permission=async()=>{try{return await invoke('permission',identity(desc))}catch{return 'denied'}};
  const result={...desc,__pbNative:true,queryPermission:permission,requestPermission:permission,isSameEntry:async other=>other?.rootId===desc.rootId&&JSON.stringify(other.parts)===JSON.stringify(desc.parts)};
  if(desc.kind==='directory')Object.assign(result,{
   getDirectoryHandle:async(name,options={})=>handle(await invoke('directory',{...child(desc,name),create:options.create===true})),
   getFileHandle:async(name,options={})=>handle(await invoke('file',{...child(desc,name),create:options.create===true})),
   removeEntry:async(name,options={})=>invoke('remove',{...child(desc,name),recursive:options.recursive===true}),
   entries:async function*(){for(const [name,item] of await invoke('entries',identity(desc)))yield [name,handle(item)]},
   values:async function*(){for await(const [,item] of result.entries())yield item},
   keys:async function*(){for await(const [name] of result.entries())yield name},
   resolve:async other=>other?.rootId===desc.rootId&&desc.parts.every((p,i)=>other.parts[i]===p)?other.parts.slice(desc.parts.length):null,
   [Symbol.asyncIterator]:async function*(){yield* result.entries()}
  });
  else Object.assign(result,{
   getFile:async()=>{const stat=await invoke('stat',identity(desc)),chunks=[];for(let offset=0;offset<stat.size;offset+=1024*1024){const bytes=await invoke('read',{...identity(desc),offset,length:Math.min(1024*1024,stat.size-offset)});if(bytes.byteLength!==Math.min(1024*1024,stat.size-offset))throw new Error('فایل هنگام خواندن تغییر کرد.');chunks.push(bytes)}return new File(chunks,desc.name,{lastModified:stat.lastModified})},
   createWritable:async()=>{const id=await invoke('begin',identity(desc));let closed=false;return {
    write:async value=>{if(closed)throw new Error('نشست ذخیره بسته شده است.');let bytes;if(value instanceof Blob)bytes=new Uint8Array(await value.arrayBuffer());else if(typeof value==='string')bytes=new TextEncoder().encode(value);else if(value instanceof ArrayBuffer)bytes=new Uint8Array(value);else if(ArrayBuffer.isView(value))bytes=new Uint8Array(value.buffer,value.byteOffset,value.byteLength);else throw new Error('نوع دادهٔ فایل پشتیبانی نمی‌شود.');for(let offset=0;offset<bytes.length;offset+=1024*1024)await invoke('write',{id,bytes:bytes.slice(offset,offset+1024*1024)});},
    close:async()=>{if(!closed){await invoke('close',{id});closed=true}},
    abort:async()=>{if(!closed){await invoke('abort',{id});closed=true}}
   }}
  });return result;
 }
 window.pbNativeFolder={
  choose:async()=>{const state=await invoke('choose');if(state.canceled)throw new DOMException('انصراف از انتخاب پوشه','AbortError');return handle(state.root)},
  root:async()=>{const state=await invoke('status');return state.root?handle(state.root):null},
  permission:async value=>value?.__pbNative&&await value.queryPermission()==='granted',
  announce:()=>invoke('announce'),activateConfigured:(force,revision)=>invoke('activate-configured',{force:force===true,revision}),device:()=>invoke('device'),register:force=>invoke('register',{force:force===true})
 };
})();
/* R1470 native intake handles */
/* Native intake handles never accept a filesystem path from the web page. */
(()=>{'use strict';if(!window.pbNativeStorage||!window.pbNativeFolder||window.pbNativeFolder.pickPhotos)return;
 const invoke=async(action,payload)=>{const packet=await window.pbNativeStorage.invoke(action,payload);if(!packet.ok)throw Object.assign(Error(packet.error.message),packet.error);return packet.value;};
 window.pbNativeFolder.pickPhotos=async()=>{const picked=await invoke('intake-pick');if(picked.canceled)throw new DOMException('انصراف از انتخاب عکس','AbortError');return picked.files.map(desc=>{
  const identity={sourceId:desc.sourceId};return {...desc,kind:'file',name:desc.name,__pbNativeIntake:true,
   queryPermission:()=>invoke('intake-permission',identity),requestPermission:()=>invoke('intake-permission',identity),
   isSameEntry:async other=>other?.__pbNativeIntake===true&&other.sourceId===desc.sourceId,sourceId:desc.sourceId,
   getFile:async()=>{const stat=await invoke('intake-stat',identity),chunks=[];for(let offset=0;offset<stat.size;offset+=1024*1024){const length=Math.min(1024*1024,stat.size-offset),bytes=await invoke('intake-read',{...identity,offset,length});if(bytes.byteLength!==length)throw Error('فایل مبدأ هنگام خواندن تغییر کرد.');chunks.push(bytes);}return new File(chunks,desc.name,{lastModified:stat.lastModified});},
   remove:async options=>{if(options?.recursive===true)throw Error('حذف پوشه مجاز نیست.');return invoke('intake-remove',identity);}
  };
 });};
})();

// Local operation IDs survive a lost localhost response; they never become cloud authority.
(()=>{if(window.__pbLocalFetchWrapped)return;window.__pbLocalFetchWrapped=true;const original=window.fetch.bind(window),pending=new Map();window.fetch=async(input,options={})=>{
 const url=typeof input==='string'?input:input?.url,same=url&&new URL(url,location.href).origin===location.origin,method=String(options.method||input?.method||'GET').toUpperCase();let key;
 if(same&&['POST','PUT','PATCH'].includes(method)&&typeof options.body==='string'){key=method+' '+url+' '+options.body;const headers=new Headers(options.headers||{});if(!headers.has('x-photobridge-local-operation')){let existing;try{existing=JSON.parse(options.body).desktopOperationId}catch{}if(typeof existing==='string'&&/^[0-9a-f-]{36}$/i.test(existing))headers.set('x-photobridge-local-operation',existing);else{if(!pending.has(key))pending.set(key,crypto.randomUUID());headers.set('x-photobridge-local-operation',pending.get(key));}}options={...options,headers};}
 const response=await original(input,options);
 if(same&&response.headers.get('content-type')?.includes('application/json')){try{const data=await response.clone().json();if(key&&response.status<500)pending.delete(key);if(data.offline)window.__PB_NATIVE_OFFLINE=true;else if(response.ok)window.__PB_NATIVE_OFFLINE=false;if(data.localCommitted)window.dispatchEvent(new CustomEvent('photobridge-local-committed',{detail:{}}));if(data.desktopPending)window.dispatchEvent(new CustomEvent('photobridge-native-pending',{detail:{message:'روی این دستگاه ذخیره شد؛ در انتظار تأیید سرور'}}));}catch{}}
 return response;
};})();
