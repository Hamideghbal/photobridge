import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const once=(source,before,after)=>{
  const count=source.split(before).length-1;
  if(count!==1)throw Error(`R1504 expected one post-R1501 anchor, found ${count}: ${before.slice(0,100)}`);
  return source.replace(before,after);
};
const onceOrAlready=(source,befores,after,already,label)=>{
  const matches=befores.filter(before=>source.includes(before));
  if(matches.length===1)return source.replace(matches[0],after);
  const alreadyCount=source.split(already).length-1;
  if(matches.length===0&&alreadyCount===1)return source;
  throw Error(`R1504 expected one ${label} anchor or its post-R1504 form; found ${matches.length} and ${alreadyCount}`);
};

const intakeFile='dist/web/photobridge-r1137-lab-local-intake.js';
let intake=fs.readFileSync(intakeFile,'utf8');
if(!intake.includes('/* PB1504 per-photo copy/move */')){
  intake=once(intake,
    "const choose=node('button','انتخاب عکس‌ها');choose.type='button';choose.setAttribute('aria-label','انتخاب عکس‌ها');field(settings,'عکس‌ها',choose);choose.textContent='کپی عکس';choose.setAttribute('aria-label','کپی عکس');const movePhotos=node('button','انتقال عکس');movePhotos.type='button';movePhotos.setAttribute('aria-label','انتقال عکس');const fileActions=node('div',null,'pb1468FileActions');choose.replaceWith(fileActions);fileActions.append(choose,movePhotos);const selectPhotos=async mode=>{if(locked||submitting)return;error.textContent='';try{const files=await window.pb1466IntakeMove.pick(mode);if(files?.length){pendingFiles=files;pendingAction=mode;choose.textContent='کپی عکس';movePhotos.textContent='انتقال عکس';error.textContent=files.length.toLocaleString('fa-IR')+' عکس برای '+(mode==='move'?'انتقال':'کپی')+' انتخاب شد؛ «افزودن» را بزنید.';}}catch(e){error.textContent=e.message;}};choose.onclick=()=>selectPhotos('copy');movePhotos.onclick=()=>selectPhotos('move');",
    "const choose=node('button','انتخاب عکس‌ها');choose.type='button';choose.setAttribute('aria-label','انتخاب عکس‌ها');field(settings,'عکس‌ها',choose);const defaultPhotoAction=()=> 'move';const selectPhotos=async()=>{if(locked||submitting)return;error.textContent='';try{const files=await window.pb1466IntakeMove.pick('select');if(files?.length){pendingFiles=files;pendingAction=defaultPhotoAction();choose.textContent=files.length.toLocaleString('fa-IR')+' عکس انتخاب شد';error.textContent=files.length.toLocaleString('fa-IR')+' عکس انتخاب شد؛ روش پیش‌فرض «انتقال» است. برای نگهداری فایل مبدأ، دکمهٔ «کپی» روی همان کارت را بزنید.';}}catch(e){error.textContent=e.message;}};choose.onclick=selectPhotos;"
  );

  intake=once(intake,
    "const more=node('button','افزودن عکس');more.type='button';more.textContent='کپی عکس';const moveMore=node('button','انتقال عکس');moveMore.type='button';const addMore=async mode=>{if(locked||submitting)return;try{const files=await window.pb1466IntakeMove.pick(mode);if(!files?.length)return;busy(true);await appendFiles(group,files,group.size,group.paper,mode);syncEntries();renderGroups();error.textContent='';}catch(e){error.textContent=e.message;}finally{busy(false);}};more.onclick=()=>addMore('copy');moveMore.onclick=()=>addMore('move');head.append(moveMore);input.onchange=async()=>{if(locked||submitting)return;busy(true);try{await appendFiles(group,input.files,group.size,group.paper,'copy');syncEntries();renderGroups();error.textContent='';}catch(e){error.textContent=e.message;}finally{busy(false);}};head.append(more,input);",
    "const more=node('button','افزودن عکس');more.type='button';const addMore=async()=>{if(locked||submitting)return;try{const files=await window.pb1466IntakeMove.pick('select');if(!files?.length)return;busy(true);await appendFiles(group,files,group.size,group.paper,defaultPhotoAction());syncEntries();renderGroups();error.textContent='';}catch(e){error.textContent=e.message;}finally{busy(false);}};more.onclick=addMore;input.onchange=async()=>{if(locked||submitting)return;busy(true);try{await appendFiles(group,input.files,group.size,group.paper,'copy');syncEntries();renderGroups();error.textContent='';}catch(e){error.textContent=e.message;}finally{busy(false);}};head.append(more,input);"
  );

  intake=onceOrAlready(intake,
    [
      "const item=group.items.find(x=>x.hash===hash)||additions.find(x=>x.hash===hash);",
      "const item=group.items.find(x=>sameIntakeCopyTarget(x,{hash,paper},albumMode,group.paper))||additions.find(x=>sameIntakeCopyTarget(x.existing||x,{hash,paper},albumMode,group.paper));"
    ],
    "const item=group.items.find(x=>sameIntakeCopyTarget(x,{hash,paper,sourceAction},albumMode,group.paper,sourceAction))||additions.find(x=>sameIntakeCopyTarget(x.existing||x,{hash,paper,sourceAction},albumMode,group.paper,sourceAction));",
    "const item=group.items.find(x=>sameIntakeCopyTarget(x,{hash,paper,sourceAction},albumMode,group.paper,sourceAction))||additions.find(x=>sameIntakeCopyTarget(x.existing||x,{hash,paper,sourceAction},albumMode,group.paper,sourceAction));",
    'photo identity matcher'
  );
  intake=once(intake,
    "async function appendFiles(group,files,size,paper,sourceAction='copy'){",
    "function sameIntakeCopyTarget(a,b,isAlbum,fallbackPaper='',sourceAction='copy'){return Boolean(a&&b&&a.hash===b.hash&&String(a.sourceAction||'copy')===String(sourceAction||'copy')&&(isAlbum||String(a.paper||fallbackPaper)===String(b.paper||fallbackPaper)));}\n async function appendFiles(group,files,size,paper,sourceAction='copy'){"
  );
  intake=onceOrAlready(intake,
    ["}else additions.push({file,hash,size,paper,copies:1,sourceActions:[sourceAction]});}"],
    "}else additions.push({file,hash,size,paper,copies:1,sourceAction,sourceActions:[sourceAction]});}",
    "}else additions.push({file,hash,size,paper,copies:1,sourceAction,sourceActions:[sourceAction]});}",
    'new photo source action'
  );
  intake=onceOrAlready(intake,
    ["window.pb1466IntakeMove.track(item.existing,item.sourceFile);item.existing.copies++;item.existing.sourceActions ||= [];"],
    "window.pb1466IntakeMove.track(item.existing,item.sourceFile,item.sourceAction);item.existing.copies++;item.existing.sourceActions ||= [];",
    "window.pb1466IntakeMove.track(item.existing,item.sourceFile,item.sourceAction);item.existing.copies++;item.existing.sourceActions ||= [];",
    'duplicate source tracking'
  );
  intake=onceOrAlready(intake,
    ["item.id=crypto.randomUUID();item.sourceActions ||= [sourceAction];item.preview=URL.createObjectURL(item.file);previews.push(item.preview);group.items.push(item);"],
    "item.id=crypto.randomUUID();item.sourceAction=sourceAction;item.sourceActions ||= [sourceAction];item.preview=URL.createObjectURL(item.file);previews.push(item.preview);group.items.push(item);window.pb1466IntakeMove.track(item,item.file,sourceAction);",
    "item.id=crypto.randomUUID();item.sourceAction=sourceAction;item.sourceActions ||= [sourceAction];item.preview=URL.createObjectURL(item.file);previews.push(item.preview);group.items.push(item);window.pb1466IntakeMove.track(item,item.file,sourceAction);",
    'new photo source tracking'
  );
  intake=once(intake,
    "const photo=node('figure');const frame=node('div',null,'pb1181IntakeFrame');const image=node('img');image.src=item.preview;image.alt=item.file.name;frame.append(image);const modes=[...new Set(item.sourceActions||['copy'])];const modeLabel=modes.includes('copy')&&modes.includes('move')?'کپی و انتقال':modes.includes('move')?'انتقال':'کپی';const actionBadge=node('span',modeLabel,'pb1501ActionBadge');actionBadge.dataset.action=modes.length>1?'both':modes[0];photo.append(frame,node('figcaption',item.file.name),actionBadge);",
    "const photo=node('figure');const frame=node('div',null,'pb1181IntakeFrame');const image=node('img');image.src=item.preview;image.alt=item.file.name;frame.append(image);const setPhotoAction=async action=>{if(locked||submitting)return;try{await window.pb1466IntakeMove.setMode(item,action);item.sourceAction=action;item.sourceActions=[action];renderGroups();}catch(e){error.textContent=e.message;}};photo.addEventListener('contextmenu',event=>{event.preventDefault();void setPhotoAction('copy');});const actionBadge=node('button',item.sourceAction==='copy'?'کپی':'برش','pb1504ActionToggle');actionBadge.type='button';actionBadge.dataset.action=item.sourceAction||'move';actionBadge.setAttribute('aria-pressed',item.sourceAction==='copy'?'true':'false');actionBadge.setAttribute('aria-label',item.sourceAction==='copy'?'حالت کپی؛ تغییر به برش':'حالت برش؛ تغییر به کپی');actionBadge.title=item.sourceAction==='copy'?'کپی: فایل مبدأ باقی می‌ماند. برای تغییر به برش کلیک کنید.':'برش: پس از ثبت موفق، فایل مبدأ حذف می‌شود. برای تغییر به کپی کلیک کنید.';actionBadge.onclick=()=>setPhotoAction(item.sourceAction==='copy'?'move':'copy');frame.append(image,actionBadge);photo.append(frame,node('figcaption',item.file.name));"
  );
  intake+='\n/* PB1504 per-photo copy/move */\n';
  fs.writeFileSync(intakeFile,intake);
}

const helperFile='scripts/r1466-intake-move.js';
let helper=fs.readFileSync(helperFile,'utf8');
if(!helper.includes('/* PB1504 per-photo source mode */')){
  helper=once(helper,
    "const track=(item,file)=>{(item.pb1466Sources??=[item.file]).push(file);};",
    "const track=(item,file,action='copy')=>{item.pb1466Sources??=[item.file];if(!item.pb1466Sources.includes(file))item.pb1466Sources.push(file);const source=sources.get(file);if(source)source.action=action;};\n async function setMode(item,action){if(!['copy','move'].includes(action))throw Error('روش ذخیره عکس معتبر نیست.');const files=[...new Set([item.file,...(item.pb1466Sources||[])])];const selected=files.map(file=>sources.get(file));if(selected.some(source=>!source))throw fail('source_required');if(action==='move'){if(selected.some(source=>source.copyOnly||!source.direct||typeof source.handle?.remove!=='function'))throw Error('مرورگر اجازهٔ انتقال این فایل را نمی‌دهد؛ در برنامهٔ ویندوز انتقال کنید یا در مرورگر کپی را نگه دارید.');for(const source of selected){let permission=await source.handle.queryPermission({mode:'readwrite'});if(permission!=='granted'&&source.handle.requestPermission)permission=await source.handle.requestPermission({mode:'readwrite'});if(permission!=='granted')throw Error(message.source_permission);}}for(const source of selected)source.action=action;return action;}"
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
if(!css.includes('PB1504 per-photo copy/move'))css+='\n/* PB1504 per-photo copy/move */\n.pb1137Intake .pb1139GroupPhotos .pb1181IntakeFrame{position:relative!important}\n.pb1137Intake .pb1139GroupPhotos .pb1504ActionToggle{position:absolute!important;z-index:3!important;left:6px!important;top:6px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:62px!important;min-height:24px!important;height:24px!important;padding:2px 9px!important;border-radius:999px!important;font:800 11px/1.3 Vazirmatn,Tahoma,sans-serif!important;cursor:pointer!important;box-shadow:0 2px 8px rgba(16,24,40,.22)!important}\n.pb1137Intake .pb1139GroupPhotos .pb1504ActionToggle[data-action="copy"]{color:#1458a5!important;background:#fff!important;border:1px solid #c7dcff!important}\n.pb1137Intake .pb1139GroupPhotos .pb1504ActionToggle[data-action="move"]{color:#087443!important;background:#e9f8ef!important;border:1px solid #b8e7c9!important}\n.pb1137Intake .pb1468FileActions{display:none!important}\n';
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
