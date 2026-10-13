import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/web/photobridge-r1137-lab-local-intake.js';
let src=fs.readFileSync(file,'utf8');
function one(oldText,newText,tag){let n=src.split(oldText).length-1;if(n!==1)throw Error('R1184 '+tag+': expected one anchor, got '+n+' '+oldText.slice(0,100));src=src.replace(oldText,newText)}
function pb1184AlbumConfigurator(editor,settings,album,sizeSelect,entriesFn){
 const panel=node('section',null,'pb1184AlbumPanel');panel.setAttribute('aria-label','تنظیمات سفارش آلبوم');
 panel.append(node('h3','مشخصات آلبوم'));
 const grid=node('div',null,'pb1184AlbumGrid');panel.append(grid);
 const covers=Array.isArray(album.covers)?album.covers:[];
 const sizeOptions=Array.isArray(album.sizes)?album.sizes:[];
 const packages=Array.isArray(album.packages)?album.packages:[];
 const extras=Array.isArray(album.extras)?album.extras:[];
 const cover=field(grid,'جلد آلبوم',select([['','انتخاب جلد'],...covers.map(x=>[String(x.id),[x.materialName,x.modelName,x.name].filter(Boolean).join(' · ')]),['__custom__','جلد سفارشی']]));
 const color=field(grid,'رنگ جلد',select([['','انتخاب رنگ']]));
 const coverRequest=field(grid,'توضیحات جلد سفارشی',node('textarea'));coverRequest.rows=2;coverRequest.placeholder='جنس، مدل، رنگ و جزئیات جلد را وارد کن';
 const coverText=field(grid,'متن روی جلد',node('input'));coverText.maxLength=160;coverText.placeholder='متن یا نام روی جلد (اختیاری)';
 const albumPackage=field(grid,'باکس / کیف آلبوم',select([['','بدون باکس']]));
 const orderMode=field(grid,'ترتیب چاپ صفحات',select([['backprint','براساس بک‌پرینت'],['manual','ترتیب دستی']]));
 const orderNotes=field(grid,'توضیح ترتیب دستی',node('textarea'));orderNotes.rows=2;orderNotes.maxLength=2000;orderNotes.placeholder='ترتیب فایل‌ها و توضیح مونتاژ';
 const generalNotes=field(grid,'یادداشت سفارش آلبوم',node('textarea'));generalNotes.rows=2;generalNotes.maxLength=2500;
 const extraSection=node('div',null,'pb1184AlbumExtras');panel.append(extraSection);
 if(extras.length){extraSection.append(node('strong','خدمات اضافه'));for(const item of extras){const choice=node('label',null,'pb1184Extra');const box=node('input');box.type='checkbox';box.value=String(item.id);choice.append(box,node('span',String(item.name)));extraSection.append(choice)}}
 const small=node('p','هر فایل یک لت است. همه فایل‌ها یک سایز آلبوم دارند؛ تعداد لت به‌صورت خودکار از عکس‌ها محاسبه می‌شود.','pb1184AlbumHint');panel.append(small);
 function showOptions(){
  const currentSize=String(sizeSelect.value);
  const active=covers.filter(x=>!x.sizeId||String(x.sizeId)===currentSize);
  const oldCover=cover.value;
  cover.replaceChildren(...[['','انتخاب جلد'],...active.map(x=>[String(x.id),[x.materialName,x.modelName,x.name].filter(Boolean).join(' · ')]),['__custom__','جلد سفارشی']].map(([id,label])=>{const opt=node('option',label);opt.value=id;return opt}));
  if([...cover.options].some(x=>x.value===oldCover))cover.value=oldCover;else if(album.coverCatalogEnabled===false)cover.value='__custom__';
  const selected=active.find(x=>String(x.id)===String(cover.value));
  const oldColor=color.value;
  color.replaceChildren(...[['','انتخاب رنگ'],...(selected?.colors||[]).filter(x=>x.active!==false).map(x=>[String(x.id),String(x.name||x.colorValue||'رنگ')])].map(([id,label])=>{const opt=node('option',label);opt.value=id;return opt}));
  if([...color.options].some(x=>x.value===oldColor))color.value=oldColor;
  color.parentElement.hidden=!(selected&&(selected.colors||[]).some(x=>x.active!==false));
  coverRequest.parentElement.hidden=cover.value!=='__custom__';
  const selectedPack=albumPackage.value;
  albumPackage.replaceChildren(...[['','بدون باکس'],...packages.filter(x=>String(x.sizeId)===currentSize).map(x=>[String(x.id),[x.modelName,x.colorName].filter(Boolean).join(' · ')])].map(([id,label])=>{const opt=node('option',label);opt.value=id;return opt}));
  if([...albumPackage.options].some(x=>x.value===selectedPack))albumPackage.value=selectedPack;
  orderNotes.parentElement.hidden=orderMode.value!=='manual';
 }
 cover.onchange=showOptions;
 sizeSelect.addEventListener('change',showOptions);
 orderMode.onchange=showOptions;
 editor.insertBefore(panel,settings.nextSibling);
 showOptions();
 function collect(){
  const size=sizeOptions.find(x=>String(x.id)===String(sizeSelect.value));
  if(!size)throw Error('سایز آلبوم را مشخص کن.');
  const entries=entriesFn();
  if(entries.length<Math.max(1,Number(size.minSpreads||1))||entries.length>Math.min(500,Number(size.maxSpreads||500)))throw Error('تعداد لت‌های آلبوم باید بین '+String(size.minSpreads||1)+' و '+String(size.maxSpreads||500)+' باشد.');
  const paperCounts={luster:0,silk:0,metallic:0};
  for(const item of entries){if(!Object.hasOwn(paperCounts,item.paper))throw Error('کاغذ یکی از لت‌ها معتبر نیست.');paperCounts[item.paper]++}
  const picked=covers.find(x=>String(x.id)===String(cover.value));
  const customCover=cover.value==='__custom__'||album.coverCatalogEnabled===false;
  if(!customCover&&!picked)throw Error('مدل جلد آلبوم را انتخاب کن.');
  const colors=(picked?.colors||[]).filter(x=>x.active!==false);
  if(!customCover&&colors.length&&!colors.some(x=>String(x.id)===String(color.value)))throw Error('رنگ جلد آلبوم را انتخاب کن.');
  if(customCover&&!coverRequest.value.trim())throw Error('مشخصات جلد سفارشی را وارد کن.');
  if(orderMode.value==='manual'&&!orderNotes.value.trim())throw Error('ترتیب دستی فایل‌ها را توضیح بده.');
  return{sizeId:size.id,spreads:entries.length,paperType:entries[0]?.paper||'luster',paperCounts,coverId:customCover?null:picked.id,colorId:customCover?null:color.value||null,customCover,coverRequest:customCover?coverRequest.value.trim():'',coverText:coverText.value.trim(),packageId:albumPackage.value||null,extraIds:[...extraSection.querySelectorAll('input:checked')].map(x=>x.value),printOrderMode:orderMode.value,printOrderNotes:orderNotes.value.trim(),generalNotes:generalNotes.value.trim()};
 }
 function estimate(){
  const list=entriesFn(),size=sizeOptions.find(x=>String(x.id)===String(sizeSelect.value));
  const rows=[],paperCounts={luster:0,silk:0,metallic:0};
  list.forEach(x=>{if(Object.hasOwn(paperCounts,x.paper))paperCounts[x.paper]++});
  let total=0,missing=false;
  for(const [paper,count] of Object.entries(paperCounts)){if(!count)continue;
   const value=size?.[paper];if(value==null){missing=true;rows.push([count+' لت '+(paper==='luster'?'لاستر':paper==='silk'?'سیلک':'متالیک'),'تعرفه نامشخص']);}
   else{const amount=Number(value)*count;total+=amount;rows.push([count+' لت چاپ',amount.toLocaleString('fa-IR')+' تومان']);}}
  const binding=size?.bindingPrice;if(binding==null){missing=true;}else total+=Number(binding)*list.length;
  if(list.length)rows.push(['صحافی '+list.length+' لت',binding==null?'تعرفه نامشخص':(Number(binding)*list.length).toLocaleString('fa-IR')+' تومان']);
  const picked=covers.find(x=>String(x.id)===String(cover.value));const chosenColor=(picked?.colors||[]).find(x=>String(x.id)===String(color.value));
  const coverPrice=cover.value==='__custom__'?null:chosenColor?.price??picked?.price;
  if(cover.value){if(coverPrice==null||Number(coverPrice)<=0){missing=true;rows.push(['جلد','قیمت در فاکتور']);}else{total+=Number(coverPrice);rows.push(['جلد',Number(coverPrice).toLocaleString('fa-IR')+' تومان'])}}
  const pkg=packages.find(x=>String(x.id)===String(albumPackage.value));if(pkg){total+=Number(pkg.price||0);rows.push(['باکس آلبوم',Number(pkg.price||0).toLocaleString('fa-IR')+' تومان'])}
  for(const input of extraSection.querySelectorAll('input:checked')){const item=extras.find(x=>String(x.id)===input.value);if(!item)continue;const price=Number(item.price||0)*(item.pricingMode==='per_spread'?list.length:1);total+=price;rows.push([item.name,price.toLocaleString('fa-IR')+' تومان'])}
  return{rows,total,missing,count:list.length,sizeLabel:size?.label||'سایز انتخاب نشده'};
 }
 panel.addEventListener('change',()=>panel.dispatchEvent(new CustomEvent('pb1184-estimate',{bubbles:false})));
 panel.addEventListener('input',()=>panel.dispatchEvent(new CustomEvent('pb1184-estimate',{bubbles:false})));
 return{panel,collect,estimate};
}
if(!src.includes('PB1184 album walk-in configurator')){
 const helper=pb1184AlbumConfigurator.toString();
 one('async function open(){','async function open(mode="print"){const albumMode=mode==="album";','open by mode');
 one("const launch=document.getElementById('pb1137LocalIntakeButton');","const launch=document.getElementById('pb1137LocalIntakeButton');const intakeTitle=albumMode?'ثبت سفارش آلبوم حضوری':'ثبت سفارش عکس حضوری';",'dynamic launch');
 one("launch.textContent='در حال آماده‌سازی…';","launch.textContent='در حال آماده‌سازی…';",'launch state'); // no-op anchor intentional?
 one("launch.textContent='ثبت سفارش عکس حضوری';","launch.textContent=intakeTitle;",'restore appropriate title');
 one("modal.setAttribute('aria-label','ثبت سفارش عکس حضوری');","modal.setAttribute('aria-label',intakeTitle);",'dialog title');
 one("const modal=node('dialog',null,'pb1137Intake');","const modal=node('dialog',null,'pb1137Intake');if(albumMode)modal.classList.add('pb1184AlbumMode');",'album modal class');
 one("head.append(node('h2','ثبت سفارش عکس حضوری'));","head.append(node('h2',intakeTitle));",'heading');
 one("const sizes=(bootstrap.printSizes||[]).map(s=>[s.id,s.label]);",
 "const sizes=(albumMode?(bootstrap.album?.sizes||[]):(bootstrap.printSizes||[])).map(s=>[s.id,s.label]);",'album size catalog');
 one("const defaultSize=field(settings,'سایز چاپ',select([['','انتخاب سایز'],...sizes]));",
 "const defaultSize=field(settings,albumMode?'سایز آلبوم':'سایز چاپ',select([['','انتخاب سایز'],...sizes]));",'single size chooser');
 one("const defaultPaper=field(settings,'کاغذ',select(paperOptions));",
 "const defaultPaper=field(settings,albumMode?'کاغذ لت‌ها':'کاغذ',select(paperOptions));",'paper label');
 one("const empty=node('p','سایز و کاغذ را انتخاب کن، عکس‌ها را اضافه کن و برای سایز بعدی همین کار را تکرار کن.','pb1139Empty');",
 "const empty=node('p',albumMode?'سایز آلبوم را انتخاب کن و همه لت‌های آلبوم را برای همان سایز اضافه کن.':'سایز و کاغذ را انتخاب کن، عکس‌ها را اضافه کن و برای سایز بعدی همین کار را تکرار کن.','pb1139Empty');",'empty message');
 one("const priceBySize=new Map((bootstrap.printSizes||[]).map(row=>[String(row.id),row]));",
 "const priceBySize=new Map((bootstrap.printSizes||[]).map(row=>[String(row.id),row]));const albumForm=albumMode?pb1184AlbumConfigurator(editor,settings,bootstrap.album||{},defaultSize,()=>entries):null;albumForm?.panel.addEventListener('pb1184-estimate',()=>refreshInvoice());",'insert album configuration below chooser');
 one("  let total=0,missing=0,totalPrints=0;",
 "  if(albumMode){const q=albumForm.estimate();for(const [label,amount] of q.rows){const row=node('div',null,'pb1178BillRow');row.append(node('b',label),node('strong',amount));billRows.append(row)}if(!q.rows.length)billRows.append(node('p','فایل‌های لت آلبوم را انتخاب کن.','pb1178BillEmpty'));billTotals.replaceChildren(node('span',q.count.toLocaleString('fa-IR')+' لت · '+q.sizeLabel),node('strong',(q.missing?'جمع مبالغ مشخص: ':'برآورد: ')+money(q.total)+' تومان'));billNotice.textContent='تعرفه‌های نامشخص هنگام صدور فاکتور نهایی توسط اپراتور تعیین می‌شوند.';return;}\n  let total=0,missing=0,totalPrints=0;",'album pre-invoice');
 one("if(item){additions.push({existing:item});}else additions.push({file,hash,size,paper,copies:1,chassis:false});",
 "if(item){if(albumMode)throw Error('این فایل قبلاً به لت‌های آلبوم اضافه شده است.');additions.push({existing:item});}else additions.push({file,hash,size,paper,copies:1});",'one spread per file');
 one("  list.replaceChildren();if(!groups.length){list.append(empty);refreshInvoice();return;}",
 "  list.replaceChildren();defaultSize.disabled=albumMode&&groups.length>0;if(!groups.length){list.append(empty);refreshInvoice();return;}",'lock album size after first files');
 one("head.append(node('b',", "head.append(node('b',",'head preserve'); // one-off no-op
 one("const chassisLabel=node('label',null,'pb1181ChassisToggle');",
 "const chassisLabel=node('label',null,'pb1181ChassisToggle');",'chassis anchor');
 one("actions.append(chassisLabel);",
 "if(!albumMode)actions.append(chassisLabel);",'album has no chassis');
 one("const quantity=node('div',null,'pb1142Quantity');",
 "const quantity=node('div',null,'pb1142Quantity');",'quantity anchor');
 one("quantity.append(minus,count,plus);photo.append(quantity);photos.append(photo);",
 "quantity.append(minus,count,plus);if(!albumMode)photo.append(quantity);photos.append(photo);",'album no print copies');
 one("let group=groups.find(x=>x.size===defaultSize.value);const fresh=!group;",
 "if(albumMode&&groups.length&&groups[0].size!==defaultSize.value)throw Error('برای هر سفارش آلبوم فقط یک سایز مجاز است.');let group=groups.find(x=>x.size===defaultSize.value);const fresh=!group;",'single album size only');
 one("  busy(true);error.textContent='در حال ذخیره روی هارد و ثبت سفارش…';",
 "  let albumData=null;if(albumMode)try{albumData=albumForm.collect()}catch(e){error.textContent=e.message;return;}\n  busy(true);error.textContent='در حال ذخیره روی هارد و ثبت سفارش…';",'validate album before draft');
 one("mode:'print',delivery:'pickup',priority:'normal',customerId:customers.value",
 "mode:albumMode?'album':'print',albumData,delivery:'pickup',priority:'normal',customerId:customers.value",'persist validated album snapshot');
 one("fileInput.accept='image/jpeg,image/png,image/tiff,image/webp';",
 "fileInput.accept='image/jpeg,image/png,image/tiff,image/webp';",'accept');
 one("const detail=await api('/api/lab/orders/'+order.orderId);",
 "const detail=await api('/api/lab/orders/'+order.orderId);",'detail');
 one("form.replaceChildren(node('h3','سفارش شمارهٔ '+order.orderNumber+' ثبت شد.'),node('p','عکس‌ها در مسیر سفارش روی هارد ثبت شدند. وضعیت سفارش دانلودشده است؛ پیش‌فاکتور تا زمان «آماده تحویل» قطعی نمی‌شود.'));",
 "form.replaceChildren(node('h3','سفارش شمارهٔ '+order.orderNumber+' ثبت شد.'),node('p',albumMode?'لت‌های آلبوم و مشخصات جلد و صحافی ثبت شد. فایل‌ها روی هارد اصلی قرار گرفتند.':'عکس‌ها در مسیر سفارش روی هارد ثبت شدند. وضعیت سفارش دانلودشده است؛ پیش‌فاکتور تا زمان «آماده تحویل» قطعی نمی‌شود.'));",'success text');
 const old="if(old){if(old.parentElement!==target)target.append(old);return;}const button=node('button','ثبت سفارش عکس حضوری','pb1137Launch');button.id='pb1137LocalIntakeButton';button.type='button';button.onclick=open;";
 const next="const albumTab=/^\\/lab\\/album(?:s|[-/]|$)/.test(location.pathname);const text=albumTab?'ثبت سفارش آلبوم حضوری':'ثبت سفارش عکس حضوری';if(old){if(old.parentElement!==target)target.append(old);old.textContent=text;old.onclick=()=>open(albumTab?'album':'print');return;}const button=node('button',text,'pb1137Launch');button.id='pb1137LocalIntakeButton';button.type='button';button.onclick=()=>open(albumTab?'album':'print');";
 one(old,next,'album tab action');
 src=src.replace("async function open(mode=\"print\")",helper+"\n/* PB1184 album walk-in configurator */\nasync function open(mode=\"print\")");
 fs.writeFileSync(file,src);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
