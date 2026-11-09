const PB1395Marker='.photobridge-folder-id.json';
// R1725: Electron's native file bridge may return a plain Error with ENOENT in
// the message instead of DOMException.name or error.code. This is safe ONLY
// when the missing path is the selected folder's own marker file.
function pb1395MissingMarker(err){
 const code=String(err?.code||err?.cause?.code||err?.name||'');
 if(code==='NotFoundError'||code==='ENOENT')return true;
 const msg=String(err?.message||'');
 return /(?:\bENOENT\b|no such file or directory)/i.test(msg)&&msg.includes(PB1395Marker);
}
async function pb1395FolderId(root,create=false){
 let file;try{file=await root.getFileHandle(PB1395Marker)}catch(err){if(!create||!pb1395MissingMarker(err))throw err;
  file=await root.getFileHandle(PB1395Marker,{create:true});const writer=await file.createWritable();try{await writer.write(JSON.stringify({version:1,id:crypto.randomUUID()}));await writer.close()}catch(error){await writer.abort().catch(()=>{});throw error}
 }
 const source=await file.getFile();if(source.size>512)throw Error('شناسه پوشه معتبر نیست؛ پوشه دیگری انتخاب کنید.');
 const value=JSON.parse(await source.text());if(value.version!==1||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.id))throw Error('شناسه پوشه معتبر نیست؛ پوشه دیگری انتخاب کنید.');return value.id;
}
async function pb1395Choose(){
 if(window.pbNativeFolder&&!(await window.pbNativeFolder.announce()).pairSupport)throw Error('برای تطبیق مسیر مرورگر و ویندوز، برنامه ویندوز نسخه ۱.۰.۲۷ یا جدیدتر لازم است.');
 const root=window.pbNativeFolder?await window.pbNativeFolder.choose():await window.showDirectoryPicker({mode:'readwrite'});
 if(!await Vs(root))throw Error('اجازه خواندن و نوشتن پوشه داده نشد.');
 const pairFolderId=await pb1395FolderId(root,true);Uc();
 const state=await Me('/api/lab/storage-target',{method:'PUT',body:JSON.stringify({pairFolderId,name:root.displayPath||root.name,kind:window.pbNativeFolder?'native':'browser'})});
 if(!state.paired||!state.isThisDevice||state.folderId!==pairFolderId)throw Error('ثبت مسیر توسط سرور تأیید نشد.');
 await Oy(root);return {root,state};
}
function PB1395StoragePanel(){
 const [root,setRoot]=x.useState(null),[state,setState]=x.useState(null),[busy,setBusy]=x.useState(false),[error,setError]=x.useState('');
 const refresh=async()=>{try{const current=await qs();setRoot(current);Uc();const target=await Me('/api/lab/storage-target');if(target.paired&&target.isThisDevice&&!current){target.isThisDevice=false;target.message='پوشه در دسترس نیست؛ دسترسی را تأیید یا مسیر را دوباره انتخاب کنید.'}if(target.paired&&target.isThisDevice&&current){const permission=await current.queryPermission({mode:'readwrite'});if(permission!=='granted')target.message='دسترسی پوشه را دوباره تأیید کنید.';else if(await pb1395FolderId(current)!==target.folderId){target.isThisDevice=false;target.message='مسیر تغییر کرده؛ مسیرها را یکسان کنید.'}}setState(target);setError('')}catch(err){setError(err?.data?.display||err.message)}};
 x.useEffect(()=>{let alive=true;const poll=()=>{if(alive)void refresh()};poll();const timer=setInterval(poll,5000);window.addEventListener('focus',poll);return()=>{alive=false;clearInterval(timer);window.removeEventListener('focus',poll)}},[]);
 const choose=async()=>{setBusy(true);setError('');try{const result=await pb1395Choose();setRoot(result.root);setState(result.state)}catch(err){if(err.name!=='AbortError')setError(err?.data?.display||err.message)}finally{setBusy(false)}};
 return e.jsxs('section',{className:'card panel compactPanel pb1386StoragePanel',children:[e.jsx('h2',{children:'مسیر ذخیره‌سازی عکس‌ها'}),e.jsx('p',{children:'پوشه را یک بار در مرورگر و یک بار در برنامه ویندوز انتخاب کنید. اگر همان پوشه باشد، هر دو فعال می‌مانند.'}),e.jsx('p',{dir:'auto',children:root?.displayPath||root?.name||'هنوز پوشه‌ای انتخاب نشده است'}),e.jsx('p',{role:state?.paired&&!state.isThisDevice?'alert':'status',children:state?.paired?state.message:'برای فعال‌سازی، پوشه ذخیره‌سازی را انتخاب کنید.'}),e.jsxs('div',{className:'pb1386StorageActions',children:[e.jsx('button',{type:'button',disabled:busy,onClick:choose,children:busy?'در حال ثبت…':root?'انتخاب یا یکسان‌سازی مسیر':'انتخاب مسیر'}),root&&e.jsx('button',{type:'button',disabled:busy,onClick:async()=>{await Vs(root);await refresh()},children:'تأیید دسترسی'}),e.jsx('button',{type:'button',disabled:busy,onClick:refresh,children:'بازخوانی'})]}),error&&e.jsx('p',{role:'alert',children:error}),e.jsx(PB1386ArchiveSettings,{})]});
}
