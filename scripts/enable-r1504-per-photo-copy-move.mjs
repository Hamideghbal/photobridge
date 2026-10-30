import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1504 unsafe anchor: '+a.slice(0,100));return s.replace(a,b)};
const intakeFile='dist/web/photobridge-r1137-lab-local-intake.js';
let intake=fs.readFileSync(intakeFile,'utf8');
if(!intake.includes('/* PB1504 per-photo copy/move */')){
  intake=once(intake,
    "const choose=node('button','انتخاب عکس‌ها');choose.type='button';choose.setAttribute('aria-label','انتخاب عکس‌ها');field(settings,'عکس‌ها',choose);choose.textContent='کپی عکس';choose.setAttribute('aria-label','کپی عکس');const movePhotos=node('button','انتقال عکس');movePhotos.type='button';movePhotos.setAttribute('aria-label','انتقال عکس');const fileActions=node('div',null,'pb1468FileActions');choose.replaceWith(fileActions);fileActions.append(choose,movePhotos);const selectPhotos=async mode=>{if(locked||submitting)return;error.textContent='';try{const files=await window.pb1466IntakeMove.pick(mode);if(files?.length){pendingFiles=files;pendingAction=mode;choose.textContent='کپی عکس';movePhotos.textContent='انتقال عکس';error.textContent=files.length.toLocaleString('fa-IR')+' عکس برای '+(mode==='move'?'انتقال':'کپی')+' انتخاب شد؛ «افزودن» را بزنید.';}}catch(e){error.textContent=e.message;}};choose.onclick=()=>selectPhotos('copy');movePhotos.onclick=()=>selectPhotos('move');",
    "const choose=node('button','انتخاب عکس‌ها');choose.type='button';choose.setAttribute('aria-label','انتخاب عکس‌ها');field(settings,'عکس‌ها',choose);const selectPhotos=async()=>{if(locked||submitting)return;error.textContent='';try{const files=await window.pb1466IntakeMove.pick('select');if(files?.length){pendingFiles=files;pendingAction='copy';choose.textContent=files.length.toLocaleString('fa-IR')+' عکس انتخاب شد';error.textContent='عکس‌ها را اضافه کنید؛ روش کپی یا انتقال را روی کارت هر عکس انتخاب کنید.';}}catch(e){error.textContent=e.message;}};choose.onclick=selectPhotos;"
  );
  intake=once(intake,
    "const more=node('button','افزودن عکس');more.type='button';more.textContent='کپی عکس';const moveMore=node('button','انتقال عکس');moveMore.type='button';const addMore=async mode=>{if(locked||submitting)return;try{const files=await window.pb1466IntakeMove.pick(mode);if(!files?.length)return;busy(true);await appendFiles(group,files,group.size,group.paper,mode);syncEntries();renderGroups();error.textContent='';}catch(e){error.textContent=e.message;}finally{busy(false);}};more.onclick=()=>addMore('copy');moveMore.onclick=()=>addMore('move');head.append(moveMore);input.onchange=async()=>{if(locked||submitting)return;busy(true);try{await appendFiles(group,input.files,group.size,group.paper,'copy');syncEntries();renderGroups();error.textContent='';}catch(e){error.textContent=e.message;}finally{busy(false);}};head.append(more,input);",
    "const more=node('button','افزودن عکس');more.type='button';const addMore=async()=>{if(locked||submitting)return;try{const files=await window.pb1466IntakeMove.pick('select');if(!files?.length)return;busy(true);await appendFiles(group,files,group.size,group.paper,'copy');syncEntries();renderGroups();error.textContent='';}catch(e){error.textContent=e.message;}finally{busy(false);}};more.onclick=addMore;input.onchange=async()=>{if(locked||submitting)return;busy(true);try{await appendFiles(group,input.files,group.size,group.paper);syncEntries();renderGroups();error.textContent='';}catch(e){error.textContent=e.message;}finally{busy(false);}};head.append(more,input);"
  );
  intake=once(intake,
    "const item=group.items.find(x=>sameIntakeCopyTarget(x,{hash,paper},albumMode,group.paper))||additions.find(x=>sameIntakeCopyTarget(x.existing||x,{hash,paper},albumMode,group.paper));",
    "const item=group.items.find(x=>sameIntakeCopyTarget(x,{hash,paper,sourceAction},albumMode,group.paper,sourceAction))||additions.find(x=>sameIntakeCopyTarget(x.existing||x,{hash,paper,sourceAction},albumMode,group.paper,sourceAction));"
  );
  intake=once(intake,
    "function sameIntakeCopyTarget(a,b,isAlbum,fallbackPaper=''){return Boolean(a&&b&&a.hash===b.hash&&(isAlbum||String(a.paper||fallbackPaper)===String(b.paper||fallbackPaper)));}",
    "function sameIntakeCopyTarget(a,b,isAlbum,fallbackPaper='',sourceAction='copy'){return Boolean(a&&b&&a.hash===b.hash&&String(a.sourceAction||'copy')===String(sourceAction||'copy')&&(isAlbum||String(a.paper||fallbackPaper)===String(b.paper||fallbackPaper)));}"
  );
  intake=once(intake,
    "if(item){if(albumMode)throw Error('این فایل قبلاً به لت‌های آلبوم اضافه شده است.');additions.push({existing:item.existing||item,sourceFile:file,sourceAction});}else additions.push({file,hash,size,paper,copies:1,sourceActions:[sourceAction]});",
    "if(item){if(albumMode)throw Error('این فایل قبلاً به لت‌های آلبوم اضافه شده است.');additions.push({existing:item.existing||item,sourceFile:file,sourceAction});}else additions.push({file,hash,size,paper,copies:1,sourceAction,sourceActions:[sourceAction]});"
  );
  intake=once(intake,
    "window.pb1466IntakeMove.track(item.existing,item.sourceFile);item.existing.copies++;",
    "window.pb1466IntakeMove.track(item.existing,item.sourceFile,item.sourceAction);item.existing.copies++;"
  );
  intake=once(intake,
    "const modes=[...new Set(item.sourceActions||['copy'])];const modeLabel=modes.includes('copy')&&modes.includes('move')?'کپی و انتقال':modes.includes('move')?'انتقال':'کپی';const actionBadge=node('span',modeLabel,'pb1501ActionBadge');actionBadge.dataset.action=modes.length>1?'both':modes[0];photo.append(frame,node('figcaption',item.file.name),actionBadge);",
    "const actionBadge=node('button',item.sourceAction==='move'?'انتقال':'کپی','pb1501ActionBadge pb1504ActionToggle');actionBadge.type='button';actionBadge.dataset.action=item.sourceAction||'copy';actionBadge.setAttribute('aria-label','روش ذخیره عکس: '+(item.sourceAction==='move'?'انتقال':'کپی'));actionBadge.title=item.sourceAction==='move'?'انتقال: پس از ثبت موفق سفارش، فایل مبدأ حذف می‌شود. برای تغییر، کلیک کنید.':'کپی: فایل مبدأ باقی می‌ماند. برای تغییر به انتقال کلیک کنید.';actionBadge.onclick=async()=>{if(locked||submitting)return;const next=item.sourceAction==='move'?'copy':'move';try{await window.pb1466IntakeMove.setMode(item,next);item.sourceAction=next;item.sourceActions=[next];renderGroups();}catch(e){error.textContent=e.message;}};frame.append(actionBadge);photo.append(frame,node('figcaption',item.file.name));"
  );
  intake=once(intake,
    "const message=node('p','کپی عکس: مبدأ باقی می‌ماند. انتقال عکس: فقط پس از ذخیرهٔ کامل و ثبت موفق سفارش، عکس‌های انتخاب‌شده از مبدأ حذف می‌شوند.');",
    "const message=node('p','روش ذخیره را روی هر عکس انتخاب کنید: کپی، یا انتقال که فقط پس از ثبت موفق سفارش فایل مبدأ را حذف می‌کند.');"
  );
  intake += '\n/* PB1504 per-photo copy/move */\n';
  fs.writeFileSync(intakeFile,intake);
}

const helperFile='scripts/r1466-intake-move.js';
let helper=fs.readFileSync(helperFile,'utf8');
if(!helper.includes('/* PB1504 per-photo source mode */')){
  helper=once(helper,
    "async function pick(mode='copy'){\n  let files=[];\n  if(mode==='copy')",
    "async function pick(mode='copy'){\n  let files=[];\n  const nativePicker=window.pbNativeFolder?.pickPhotos;\n  if(mode==='select'&&(nativePicker||typeof window.showOpenFilePicker==='function')){\n   try{const handles=nativePicker?await nativePicker():await window.showOpenFilePicker({multiple:true,mode:'read',id:'photobridge-intake-photos',types:[{description:'عکس‌های سفارش',accept:{'image/jpeg':['.jpg','.jpeg'],'image/png':['.png'],'image/tiff':['.tif','.tiff'],'image/webp':['.webp']}}]});const selected=[];for(const handle of handles){if(!/\\.(jpe?g|png|tiff?|webp)$/i.test(handle.name))continue;if(handle.kind!=='file')continue;const file=await handle.getFile();let identity;for(const candidate of directHandles)if(await candidate.handle.isSameEntry(handle)){identity=candidate;break;}if(!identity){identity={handle,key:crypto.randomUUID()};directHandles.push(identity);}sources.set(file,{direct:typeof handle.remove==='function',copyOnly:typeof handle.remove!=='function',handle,name:file.name,key:identity.key,size:file.size,lastModified:file.lastModified,deleted:false,action:'copy'});selected.push(file);}return selected;}catch(error){if(error.name==='AbortError')return null;if(error.name==='NotAllowedError'||error.name==='SecurityError')throw error;}\n  }\n  if(mode==='select')mode='copy';\n  if(mode==='copy')"
  );
  helper=once(helper,
    "const nativePicker=window.pbNativeFolder?.pickPhotos;if(!nativePicker&&typeof window.showOpenFilePicker!=='function')throw Error(unavailable);",
    "if(!nativePicker&&typeof window.showOpenFilePicker!=='function')throw Error(unavailable);"
  );
  helper=once(helper,
    "selected.push([file,{direct:true,handle,name:file.name,key:identity.key,size:file.size,lastModified:file.lastModified,deleted:false}]);",
    "selected.push([file,{direct:true,handle,name:file.name,key:identity.key,size:file.size,lastModified:file.lastModified,deleted:false,action:'move'}]);"
  );
  helper=once(helper,
    "const track=(item,file)=>{(item.pb1466Sources??=[item.file]).push(file);};",
    "const track=(item,file,action='copy')=>{(item.pb1466Sources??=[item.file]).push(file);const source=sources.get(file);if(source)source.action=action;};\n async function setMode(item,action){if(!['copy','move'].includes(action))throw Error('روش ذخیره عکس معتبر نیست.');const files=[...new Set([item.file,...(item.pb1466Sources||[])])];const selected=files.map(file=>sources.get(file));if(selected.some(source=>!source))throw fail('source_required');if(action==='move'){if(selected.some(source=>source.copyOnly||!source.direct||typeof source.handle?.remove!=='function'))throw Error('برای انتقال این عکس، آن را از پنجرهٔ انتخاب عکس برنامه یا مرورگر Chrome انتخاب کنید؛ در غیر این صورت «کپی» را نگه دارید.');for(const source of selected){let permission=await source.handle.queryPermission({mode:'readwrite'});if(permission!=='granted'&&source.handle.requestPermission)permission=await source.handle.requestPermission({mode:'readwrite'});if(permission!=='granted')throw Error(message.source_permission);}}for(const source of selected)source.action=action;return action;}"
  );
  helper=once(helper,
    "if(source.copyOnly)return digest(group.files[0]);\n  if(await (source.direct?source.handle:source.dir).queryPermission({mode:'readwrite'})!=='granted')throw fail('source_permission');",
    "if(source.action!=='move'||source.copyOnly)return digest(group.files[0]);\n  if(await (source.direct?source.handle:source.dir).queryPermission({mode:'readwrite'})!=='granted')throw fail('source_permission');"
  );
  helper=once(helper,
    "for(const group of selected){if(group.source.deleted||group.source.copyOnly)continue;try{",
    "for(const group of selected){if(group.source.deleted||group.source.action!=='move'||group.source.copyOnly)continue;try{"
  );
  helper=once(helper,
    "const removed=selected.filter(g=>g.source.deleted).length,copied=selected.filter(g=>g.source.copyOnly).length;",
    "const removed=selected.filter(g=>g.source.deleted).length,copied=selected.filter(g=>g.source.action!=='move'||g.source.copyOnly).length;"
  );
  helper=helper.replace('window.pb1466IntakeMove={pick,track,prepare,verify,finish,report};','window.pb1466IntakeMove={pick,track,setMode,prepare,verify,finish,report};\n /* PB1504 per-photo source mode */');
  if(!helper.includes('PB1504 per-photo source mode'))throw Error('R1504 helper patch did not apply');
  fs.writeFileSync(helperFile,helper);
}

const cssFile='dist/web/photobridge-r1137-lab-local-intake.css';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('PB1504 per-photo copy/move'))css+='\n/* PB1504 per-photo copy/move */\n.pb1137Intake .pb1139GroupPhotos .pb1181IntakeFrame{position:relative!important}\n.pb1137Intake .pb1139GroupPhotos .pb1504ActionToggle{position:absolute!important;z-index:3!important;left:6px!important;bottom:6px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:62px!important;min-height:24px!important;height:24px!important;padding:2px 9px!important;border-radius:999px!important;font:800 11px/1.3 Vazirmatn,Tahoma,sans-serif!important;cursor:pointer!important;box-shadow:0 2px 8px rgba(16,24,40,.22)!important}\n.pb1137Intake .pb1139GroupPhotos .pb1504ActionToggle[data-action="copy"]{color:#1458a5!important;background:#fff!important;border:1px solid #c7dcff!important}\n.pb1137Intake .pb1139GroupPhotos .pb1504ActionToggle[data-action="move"]{color:#087443!important;background:#e9f8ef!important;border:1px solid #b8e7c9!important}\n.pb1137Intake .pb1468FileActions{display:none!important}\n';
fs.writeFileSync(cssFile,css);

const moveDest='dist/web/photobridge-r1466-intake-move.js';
fs.copyFileSync(helperFile,moveDest);
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
  if(!fs.existsSync(file))continue;
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/(photobridge-r1137-lab-local-intake\.js\?[^"'\s]*)/g,url=>url.includes('r1504-per-photo-mode')?url:url+'&r1504-per-photo-mode');
  html=html.replace(/(photobridge-r1137-lab-local-intake\.css\?[^"'\s]*)/g,url=>url.includes('r1504-per-photo-mode')?url:url+'&r1504-per-photo-mode');
  html=html.replace(/(photobridge-r1466-intake-move\.js\?[^"'\s]*)/g,url=>url.includes('r1504-per-photo-mode')?url:url+'&r1504-per-photo-mode');
  fs.writeFileSync(file,html);
}
for(const file of [intakeFile,helperFile,moveDest])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
