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
