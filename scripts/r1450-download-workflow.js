function pb1450Retry(order, state) {
  return !!(order?.downloaded_at || state?.startedAt || ['downloaded','printing','reviewing','ready_print','printed','ready','completed'].includes(String(order?.status || '')));
}
function pb1450CanDownload(order) { return !['cancelled','uploading'].includes(String(order?.status || '')); }
function pb1450Code(error) { return String(error?.data?.error || error?.code || error?.message || 'download_failed'); }
function pb1450Missing(error) { return error?.name === 'NotFoundError' || error?.code === 'ENOENT'; }
async function pb1450FileInfo(handle) {
  // Native getFile() loads the entire photo through IPC. Existing stat is enough for verification.
  if (handle.__pbNative && window.pbNativeStorage) {
    const result = await window.pbNativeStorage.invoke('stat',{rootId:handle.rootId,parts:handle.parts});
    if (!result.ok) throw Object.assign(Error(result.error?.message || 'file_stat_failed'),result.error);
    return {...result.value,name:handle.name};
  }
  return handle.getFile();
}
async function pb1450Root(choose = false) {
  if (!ai()) throw Error('folder_picker_unsupported');
  const device = await Hu();
  if (device.registered && !device.isThisDevice) throw Error('not_primary_download_device');
  let root = await qs();
  if (!root && choose) root = await no();
  if (!root) throw Error('folder_not_selected');
  if (!await Vs(root)) throw Error('folder_permission_denied');
  if (!device.registered) {
    if (!choose) throw Error('download_device_not_registered');
    await vc(false);
    const confirmed = await Hu();
    if (!confirmed.registered || !confirmed.isThisDevice) throw Error('not_primary_download_device');
  }
  return root;
}
// New order filenames show real print copies with a literal equals sign.
// Previously saved orders retain the exact legacy sanitized filename.
// R1780: filenames and production labels are ASCII-only. Model names stay
// Persian in tariffs and immutable order snapshots; only the disk/UI label
// is transliterated. Reuse PhotoBridge's existing Tf() romanizer for unknown
// words and map common print-product words for more readable results.
function pb1780Latin(value,fallback='item'){
 const named={
  'شاسی':'Shasi','شاسی‌':'Shasi','قاب':'Ghab','کلاسیک':'Classic',
  'چوبی':'Choobi','چوب':'Choob','فلزی':'Felezi','فلز':'Felez',
  'ساده':'Sade','طلایی':'Talaei','طلائي':'Talaei','نقره‌ای':'Noghrei',
  'نقره':'Noghrei','مشکی':'Meshki','سفید':'Sefid','قرمز':'Ghermez',
  'آبی':'Abi','سبز':'Sabz','قهوه‌ای':'Gahvei','قهوه':'Gahve',
  'گردویی':'Gerdooyi','طوسی':'Toosi','کرم':'Kerem','زرد':'Zard',
  'صورتی':'Soorati','بنفش':'Banafsh','مات':'Mat','براق':'Baragh','مدل':'Model','ای':'Ei',
  'باریک':'Barik','پهن':'Pahn','مدرن':'Modern','طرح':'Tarh',
  'طرح‌دار':'Tarhdar','فندقی':'Fandoghi','دودی':'Doodi'
 };
 let input=String(value??'').normalize('NFKC').replace(/[\u200c\u200d]/g,' ').replace(/[\\/:*?"<>|,;،؛]+/g,' ').trim();
 input=input.replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
  .replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
 const chunks=input.split(/\s+/).filter(Boolean);
 const latin=chunks.map(word=>{
  if(named[word])return named[word];
  if(/^[A-Za-z0-9._-]+$/.test(word))return word;
  return (typeof Tf==='function'?Tf(word):'')
   .replace(/-/g,' ');
 }).join(' ')
  .replace(/[^A-Za-z0-9 ._-]/g,' ')
  .replace(/\s+/g,' ').trim();
 const safe=latin.replace(/^[ ._-]+|[ ._-]+$/g,'').slice(0,90);
 return safe||String(fallback).replace(/[^A-Za-z0-9._-]/g,'')||'item';
}
function pb1778IsSelected(value){
 return value===true||value===1||value==='true'||value==='1';
}
// R1779: Snapshot the model names at order creation, not the live edited tariffs.
// Existing files with a single chassis/frame still show the human-readable base name.
function pb1779ModelName(value,fallback){
 const name=String(value||'').normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001F\u007F]/g,' ')
    .replace(/\s+/g,' ').replace(/\.+$/g,'').trim().slice(0,64);
 return name||fallback;
}
function pb1779ReadModel(file,kind){
 const selection=file?.addon_selection||file?.addonSelection||{};
 const data=selection[kind]||{};
 const primary=kind==='chassis'?
  (data.name||data.modelName||file?.chassis_model_name||file?.chassisModelName):
  (data.name||data.modelName||file?.frame_model_name||file?.frameModelName);
 const color=kind==='frame'?
  (data.colorName||data.color_name||file?.frame_color_name||file?.frameColorName):null;
 return pb1779ModelName(primary,kind==='chassis'?'شاسی':'قاب')+
  (color?' '+pb1779ModelName(color,''):'');
}
function pb1778PhotoFlags(file){
 const tags=[];
 if(pb1778IsSelected(file?.chassis))tags.push(pb1780Latin(pb1779ReadModel(file,'chassis'),'Shasi'));
 if(pb1778IsSelected(file?.frame))tags.push(pb1780Latin(pb1779ReadModel(file,'frame'),'Ghab'));
 return tags.map(tag=>' = '+tag).join('');
}
function pb1769DownloadName(file,incomingName,order){
 const source=String(incomingName||file?.original_name||'file');
 // Never rename an older order's local files after a tariff/model change.
 if(typeof pb1769OrderFirst==='function'&&!pb1769OrderFirst(order))return Ya(source,'file');
 const copies=Number(file?.print_copies??file?.printCopies??1);
 const copyValid=Number.isSafeInteger(copies)&&copies>=2&&copies<=99;
 const marks=pb1778PhotoFlags(file);
 if(!copyValid&&!marks)return Ya(source,'file');
 const extMatch=source.match(/\.[A-Za-z0-9]{1,12}$/),ext=extMatch?.[0]||'';
 let stem=ext?source.slice(0,-ext.length):source;
 // Remove legacy S/F codes only if they were previously generated, avoid duplicates.
 if(marks&&stem.endsWith(marks))stem=stem.slice(0,-marks.length);
 stem=stem.replace(/(?:\s*=\s*(?:S|F))+$/ig,'');
 if(copyValid)stem=stem.replace(new RegExp('(?:\\s*=\\s*|\\s+_\\s+)'+copies+'$'),'');
 const suffix=(copyValid?' = '+copies:'')+marks;
 const base=Ya(stem,'file');
 return base.slice(0,Math.max(1,180-ext.length-suffix.length))+suffix+ext;
}
function pb1450Meta(file, receipts) {
  const receipt = receipts?.[String(file.id)];
  if (receipt && receipt.serverName === file.original_name && receipt.serverBytes === Number(file.bytes || 0))
    return {...file,original_name:receipt.name,bytes:receipt.bytes};
  return file;
}
async function pb1450Target(root, detail, file, cache) {
  const key = Uy(detail,file);
  if (!cache.has(key)) {
    const state = yc(detail.order.id) || {};
    const date = state.pathDate || detail.order.downloaded_at || detail.order._local_download_started_at || state.startedAt;
    const targetDetail = date ? {...detail,order:{...detail.order,downloaded_at:date}} : detail;
    const bridge = window.pbLabLocalIntakeStorage;
    cache.set(key,bridge?.target ? await bridge.target(root,targetDetail,file) : await el(targetDetail,file));
  }
  return cache.get(key);
}
async function pb1450Verify(detail, root, receipts = {}, progress) {
  const files = detail.files || [], expected = files.length;
  const report = {expected,valid:0,actual:0,missing:[],invalid:[],extra:[],collisions:[],complete:false,rootName:root.displayPath || root.name || '',day:'',loadedBytes:0,completedIds:[]};
  const targets = new Map(), groups = new Map();
  if (!expected || detail.order.file_count != null && Number(detail.order.file_count) !== expected)
    throw Object.assign(Error('download_manifest_incomplete'),{report});
  for (const file of files) {
    const meta = pb1450Meta(file,receipts), target = await pb1450Target(root,detail,file,targets);
    const key = Uy(detail,file), name = pb1769DownloadName(file,meta.original_name,detail.order);
    report.day = target.day || report.day;
    if (!groups.has(key)) groups.set(key,{target,names:new Set()});
    const group = groups.get(key);
    // Windows paths are case-insensitive; two records must never count one physical photo twice.
    const folded = name.toLocaleLowerCase('en-US');
    if (group.names.has(folded)) { report.collisions.push(meta.original_name); continue; }
    group.names.add(folded);
    try {
      const handle = await target.dir.getFileHandle(name,{create:false}), info = await pb1450FileInfo(handle);
      report.actual++;
      if (!info.size || Number(meta.bytes || 0) > 0 && info.size !== Number(meta.bytes))
        report.invalid.push(meta.original_name);
      else { report.valid++; report.loadedBytes += info.size; report.completedIds.push(String(file.id)); }
    } catch (error) {
      if (!pb1450Missing(error)) throw error;
      report.missing.push(meta.original_name);
    }
    progress?.({phase:'scanning',done:report.valid,total:expected,current:meta.original_name,percent:0});
  }
  for (const {target,names} of groups.values()) {
    for await (const [name,handle] of target.dir.entries()) {
      // PDFs/invoices and temporary writer files are not photo records.
      if (handle.kind === 'file' && /\.(jpe?g|png|tiff?|webp|bmp|heic|heif|psd|psb|avif|gif)$/i.test(name) && !names.has(name.toLocaleLowerCase('en-US')))
        report.extra.push(name);
    }
  }
  report.actual += report.extra.length;
  report.complete = report.valid === expected && !report.missing.length && !report.invalid.length && !report.extra.length && !report.collisions.length;
  return report;
}
function pb1450Save(detail, report, receipts, error = null) {
  const old = yc(detail.order.id) || {};
  hr(detail.order.id,{...old,startedAt:old.startedAt || detail.order._local_download_started_at || new Date().toISOString(),done:report.valid,total:report.expected,remaining:Math.max(0,report.expected-report.valid),loadedBytes:report.loadedBytes,completedIds:report.completedIds,localFiles:receipts,localComplete:report.complete,lastError:error,verification:{actual:report.actual,missing:report.missing,invalid:report.invalid,extra:report.extra,collisions:report.collisions,checkedAt:new Date().toISOString()}});
}
function pb1450ReportText(report) {
  const lines = [`فایل‌های سفارش کامل نیستند: ${V(report.valid)} فایل سالم از ${V(report.expected)} فایل سرور؛ ${V(report.actual)} فایل در پوشه سفارش.`];
  for (const [label,items] of [['پیدا نشد',report.missing],['اندازه ناقص یا متفاوت',report.invalid],['عکس اضافه در پوشه',report.extra],['نام تکراری در یک مسیر',report.collisions]]) {
    if (items?.length) lines.push(label+': '+items.slice(0,12).join('، ')+(items.length>12?' …':''));
  }
  if (report.rootName) lines.push('مسیر: '+report.rootName+(report.day?' / '+report.day:''));
  lines.push(report.extra?.length || report.collisions?.length ? 'عکس‌های اضافه یا نام‌های تکراری را در پوشه همین سفارش بررسی کنید. تا تأیید فایل‌های کامل، ادامه چاپ مجاز نیست.' : 'از همان دکمه «دانلود مجدد» استفاده کنید. تا کامل‌شدن فایل‌ها، ادامه چاپ مجاز نیست.');
  return lines.join('\n');
}
function pb1450Notify(error) {
  if (error?.name === 'AbortError') return;
  const code = pb1450Code(error);
  if (error?.report && code === 'local_download_incomplete') return alert(pb1450ReportText(error.report));
  const messages = {
    folder_picker_unsupported:'بررسی فایل‌های پوشه و شروع چاپ باید در برنامه ویندوز یا مرورگر دسکتاپ سیستم اصلی انجام شود.',
    folder_not_selected:'مسیر ذخیره روی این سیستم انتخاب نشده است. در تنظیمات، پوشه واقعی سفارش‌ها را انتخاب کنید.',
    folder_permission_denied:'دسترسی پوشه ذخیره داده نشد؛ مجوز پوشه و اتصال هارد را بررسی کنید.',
    not_primary_download_device:'این دستگاه سیستم اصلی دانلود نیست. دانلود مجدد و تأیید فایل‌ها را روی سیستم اصلی لابراتوار انجام دهید.',
    download_device_not_registered:'سیستم اصلی دانلود هنوز ثبت نشده است؛ آن را در تنظیمات مسیر ذخیره ثبت کنید.',
    primary_device_exists:'یک سیستم دیگر به‌عنوان سیستم اصلی ثبت شده است؛ وضعیت سیستم اصلی را در تنظیمات بررسی کنید.',
    payment_required:'پرداخت این سفارش هنوز تأیید نشده است و دریافت فایل از سرور مجاز نیست.',
    download_manifest_incomplete:'فهرست فایل‌های سفارش از سرور کامل دریافت نشد. هیچ مرحله‌ای تغییر نکرد؛ صفحه را تازه‌سازی و دوباره تلاش کنید.',
    file_not_found:'نسخه کامل یکی از فایل‌ها روی سرور پیدا نشد. دانلود کامل نشده است؛ اصل فایل باید دوباره از عکاس دریافت شود.',
    local_file_only:'این فایل فقط روی هارد سیستم قبلی موجود است و نسخه‌ای برای دریافت دوباره روی سرور ندارد.',
    download_size_mismatch:'اندازه فایل دریافتی کامل نیست. ارتباط یا فضای هارد را بررسی کنید و «دانلود مجدد» را بزنید.',
    download_busy:'دریافت همین سفارش هنوز در حال انجام است. تا پایان آن صبر کنید.'
  };
  alert((messages[code] || 'بررسی یا دریافت فایل‌ها انجام نشد. اتصال اینترنت، مسیر ذخیره و دسترسی هارد را بررسی و دوباره تلاش کنید.')+'\n'+(messages[code]?'':'جزئیات: '+String(error?.message || code))+(error.report && !error.report.complete?'\n'+pb1450ReportText(error.report):''));
}
const pb1450Flights = new Set();
async function pb1450Download(detail, progress = () => {}, options = {}) {
  const id = detail.order.id;
  if (pb1450Flights.has(id)) throw Error('download_busy');
  pb1450Flights.add(id);
  let receipts = {...(yc(id)?.localFiles || {})}, report, root;
  try {
    root = await pb1450Root(true);
    const old = yc(id) || {};
    detail.order._local_download_started_at = old.startedAt || new Date().toISOString();
    const latin=String(detail.order.folder_latin_name||'').trim(),initialFolder=latin||String(detail.order.customer_name||'مشتری').trim()||'مشتری';
    // Pin both layout and photographer directory at the first write. Subsequent
    // lab alias/name changes must only affect future orders, never live files.
    hr(id,{...old,startedAt:detail.order._local_download_started_at,pathDate:old.pathDate || detail.order.downloaded_at || detail.order._local_download_started_at,
      pathLayout:old.pathLayout || (old.startedAt || detail.order.downloaded_at ? 'legacy' : 'order-v2'),
      pathCustomerName:old.pathCustomerName??initialFolder,
      pathLatinAlias:old.pathCustomerName!=null ? old.pathLatinAlias===true : !!latin,
      localComplete:false,lastError:null});
    report = await pb1450Verify(detail,root,receipts,progress);
    if (report.collisions.length) throw Object.assign(Error('local_download_incomplete'),{report});
    const force = options.force === true, already = new Set(report.completedIds), targets = new Map();
    const files = detail.files || [];
    let done = force ? 0 : report.valid, bytes = force ? 0 : report.loadedBytes;
    for (const file of files) {
      if (!force && already.has(String(file.id))) continue;
      const target = await pb1450Target(root,detail,file,targets), response = await Ky(file.id);
      const name = pb1769DownloadName(file,response.pbDownloadName || file.original_name,detail.order), expected = Number(response.pbDownloadBytes || file.bytes || 0);
      const publish = () => progress({phase:'downloading',done,total:files.length,current:file.original_name,loadedBytes:bytes,totalBytes:files.reduce((sum,f)=>sum+Number(f.bytes || 0),0),percent:Math.round(done/files.length*100)});
      publish();
      await pb1445WriteDownload(target.dir,name,response,chunk=>{bytes+=chunk;publish();},expected,pb1769OrderFirst(detail.order));
      const saved = await pb1450FileInfo(await target.dir.getFileHandle(pb1769OrderFirst(detail.order)?name:Ya(name,'file'),{create:false}));
      if (!saved.size || expected > 0 && saved.size !== expected) throw Error('download_size_mismatch');
      receipts[String(file.id)] = {serverName:file.original_name,serverBytes:Number(file.bytes || 0),name,bytes:saved.size,transportName:response.pbDownloadName || file.original_name,transportBytes:expected};
      done++;
      const state = yc(id) || {};
      hr(id,{...state,done,total:files.length,remaining:files.length-done,localFiles:receipts,localComplete:false,lastError:null});
      publish();
      if (response.pbFallbackOriginal) alert('نسخه آماده چاپ «'+file.original_name+'» روی سرور نبود؛ نسخه اصلی «'+name+'» دریافت شد. فرمت آن را پیش از چاپ بررسی کنید.');
    }
    // Re-read disk after the final close. Status changes are allowed only after this succeeds.
    report = await pb1450Verify(detail,root,receipts,progress);
    pb1450Save(detail,report,receipts,report.complete?null:'local_download_incomplete');
    if (!report.complete) throw Object.assign(Error('local_download_incomplete'),{report});
    progress({phase:'complete',done:report.valid,total:report.expected,percent:100,loadedBytes:report.loadedBytes,totalBytes:report.loadedBytes,current:''});
    return {rootName:report.rootName,day:report.day,done:report.valid,totalBytes:report.loadedBytes,loadedBytes:report.loadedBytes,alreadyComplete:!force && already.size===files.length};
  } catch (error) {
    if (root) try {
      report = await pb1450Verify(detail,root,receipts);
      pb1450Save(detail,report,receipts,pb1450Code(error));
      error.report = report;
    } catch {}
    hr(id,{...(yc(id)||{}),localFiles:receipts,localComplete:false,lastError:pb1450Code(error)});
    throw error;
  } finally { pb1450Flights.delete(id); }
}
async function pb1450AllowStage(order) {
  if (pb1450Flights.has(order.id)) { pb1450Notify(Error('download_busy')); return false; }
  try {
    const detail = await Me(`/api/lab/orders/${order.id}`), root = await pb1450Root(false);
    const receipts = yc(order.id)?.localFiles || {}, report = await pb1450Verify(detail,root,receipts);
    pb1450Save(detail,report,receipts,report.complete?null:'local_download_incomplete');
    if (!report.complete) throw Object.assign(Error('local_download_incomplete'),{report});
    return true;
  } catch (error) { pb1450Notify(error); return false; }
}
