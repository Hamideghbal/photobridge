function PB1455CollectPhotos(settings){
 const entries=[];for(const category of ['cover','package'])for(const model of PB1380Models(settings,category)){
  const add=(photos,label)=>{for(const[sourceIndex,imageData]of (photos||[]).entries())if(imageData)entries.push({id:category+':'+entries.length,name:(label+(photos.length>1?' '+V(sourceIndex+1):'')).slice(0,120),category,imageData})};
  add(model.images??(model.imageData?[model.imageData]:[]),model.title);
  for(const color of model.colors||[])add(color.images??(color.imageData?[color.imageData]:[]),model.title+' · '+(color.name||color.colorValue));
 }
 return entries;
}
async function PB1455CopyPhotos(entries){
 if(!entries.length)throw Error('حداقل یک عکس را انتخاب کنید.');
 // Always load the latest library immediately before adding; never edit source lab settings.
 const current=await Me('/api/admin/album-cover-presets');if(!Array.isArray(current.items))throw Error('دریافت گالری فوتوبریج کامل نشد.');
 const items=[...current.items];let added=0,reused=0;
 for(const row of entries){
  let imageData;try{imageData=await PB1454SampleImage(row)}catch(err){throw Error('کپی عکس «'+row.name+'» انجام نشد. '+err.message+' هیچ تغییری در گالری مشترک ثبت نشد.')}
  const category=PB1454Category(row);
  if(items.some(item=>PB1454Category(item)===category&&item.imageData===imageData)){reused++;continue}
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(imageData)))).map(v=>v.toString(16).padStart(2,'0')).join('');
  items.push({key:'recovered-'+category+'-'+hash.slice(0,32),name:String(row.name||'عکس بازیابی‌شده').trim().slice(0,120),category,imageData,paletteStorage:{}});added++;
 }
 if(added)await PB1454SaveSamples(items,current.hiddenDefaultKeys||[]);
 return {added,reused};
}
function PB1455GalleryRecovery({photos,title}){
 const[allowed,setAllowed]=x.useState(false),[entries,setEntries]=x.useState(null),[selected,setSelected]=x.useState(new Set()),[busy,setBusy]=x.useState(false),[error,setError]=x.useState(''),[notice,setNotice]=x.useState('');
 x.useEffect(()=>{let active=true;Me('/api/auth/me').then(data=>{if(active)setAllowed(data.user?.platformRole==='platform_admin')}).catch(()=>{});return()=>{active=false}},[]);
 const open=async()=>{setBusy(true);setError('');setNotice('');try{const rows=photos?photos.map((imageData,i)=>({id:'gallery:'+i,name:(title||'نمونه آلبوم')+(photos.length>1?' '+V(i+1):''),category:'cover',imageData})):PB1455CollectPhotos((await Me('/api/lab/album-settings')).settings);setEntries(rows);setSelected(new Set(rows.map(row=>row.id)))}catch{setError('دریافت عکس‌های فعلی لابراتوار انجام نشد. اتصال را بررسی و دوباره تلاش کنید.')}finally{setBusy(false)}};
 if(!allowed)return null;
 return e.jsxs('section',{className:'pb1455RecoveryTools',children:[e.jsx('button',{type:'button',disabled:busy||photos?.length===0,onClick:open,children:busy?'در حال بررسی…':photos?'کپی عکس‌های این گالری به فوتوبریج':'بازیابی عکس‌های این لابراتوار به گالری فوتوبریج'}),!entries&&error&&e.jsx('p',{role:'alert',children:error}),notice&&e.jsx('p',{role:'status',children:notice}),entries&&e.jsxs('div',{className:'pb1455RecoveryPanel',role:'region','aria-label':'کپی نمونه‌ها به گالری فوتوبریج',children:[e.jsx('h3',{children:'کپی نمونه‌ها به گالری فوتوبریج'}),e.jsx('p',{children:'این کار فقط یک نسخه به گالری مشترک اضافه می‌کند. عکس‌های اصلی، ارتباط با جلد و کیف، رنگ‌ها و قیمت‌های لابراتوار تغییر نمی‌کنند.'}),e.jsx('div',{className:'pb1455RecoveryChoices',children:entries.length?entries.map(row=>e.jsxs('label',{children:[e.jsx('input',{type:'checkbox',checked:selected.has(row.id),disabled:busy,onChange:event=>setSelected(old=>{const next=new Set(old);event.target.checked?next.add(row.id):next.delete(row.id);return next})}),e.jsx('img',{src:row.imageData,alt:row.name}),e.jsx('span',{children:row.name}),e.jsx('select',{'aria-label':'دسته '+row.name,value:row.category,disabled:busy,onChange:event=>setEntries(old=>old.map(item=>item.id===row.id?{...item,category:event.target.value}:item)),children:['cover','package'].map(category=>e.jsx('option',{value:category,children:PB1454CategoryName(category)},category))})]},row.id)):e.jsx('p',{children:'در این بخش عکس ذخیره‌شده‌ای پیدا نشد.'})}),error&&e.jsx('p',{role:'alert',children:error}),e.jsxs('div',{className:'modalActions',children:[e.jsx('button',{type:'button',disabled:busy,onClick:()=>setEntries(null),children:'انصراف'}),e.jsx('button',{type:'button',className:'primary',disabled:busy||!selected.size,onClick:async()=>{setBusy(true);setError('');try{const result=await PB1455CopyPhotos(entries.filter(row=>selected.has(row.id)));setEntries(null);setNotice(V(result.added)+' عکس به گالری فوتوبریج اضافه شد.'+(result.reused?' '+V(result.reused)+' عکس از قبل موجود بود.':'')+' عکس‌های لابراتوار بدون تغییر باقی ماندند.')}catch(err){setError(err?.status===403?'برای افزودن به گالری مشترک باید با حساب ادمین پلتفرم وارد شده باشید.':err.message||'کپی نمونه‌ها انجام نشد.')}finally{setBusy(false)}},children:busy?'در حال کپی و ذخیره…':'تأیید و افزودن به گالری فوتوبریج'})]})]})]});
}
