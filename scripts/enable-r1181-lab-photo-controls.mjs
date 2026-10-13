import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
function patch(src,a,b,label){const n=src.split(a).length-1;if(n!==1)throw Error('R1181 '+label+' unsafe anchor '+n+': '+a.slice(0,100));return src.replace(a,b);}
// This is serialized into the existing lab order-detail component.
async function pb1181RemoveFile(file){
 if(!pb1180Editable())return;
 if(!window.confirm('عکس «'+String(file.original_name||'')+'» از سفارش حذف شود؟'))return;
 let local=null;
 if(y.order.downloaded_at&&ai())try{local=await tl(y,file)}catch{}
 Re(!0);
 try{
  await Me('/api/lab/order-files/'+file.id,{method:'DELETE'});
  let localWarning=false;
  if(local)try{await local.target.dir.removeEntry(Ya(file.original_name,'file'))}catch{localWarning=true;}
  _pbDetailCache.current.delete(String(y.order.id));await Tt(y.order,!1);await ye();
  if(localWarning)alert('عکس از سفارش حذف شد، اما فایل روی هارد باقی ماند. آن را از پوشه سفارش هم پاک کن.');
 }catch(err){
  const code=String((err&&err.data&&err.data.error)||err.message||'');
  alert(code==='last_print_photo_required'?'حداقل یک عکس باید در سفارش باقی بماند.':code==='issued_invoice_locked'?'فاکتور سفارش صادر شده و حذف عکس نیازمند رسیدگی مالی است.':code==='order_print_settings_locked'?'چاپ شروع شده و حذف عکس دیگر مجاز نیست.':'حذف عکس انجام نشد.');
 }finally{Re(!1);}
}
const intakePath='dist/web/photobridge-r1137-lab-local-intake.js';
let intake=fs.readFileSync(intakePath,'utf8');
if(!intake.includes('pb1181IntakeFrame')){
 intake=patch(intake,"}else additions.push({file,hash,size,paper,copies:1});","}else additions.push({file,hash,size,paper,copies:1,chassis:false});",'chassis default');
 intake=patch(intake,"for(const item of group.items){const k=String(item.paper||group.paper);byPaper.set(k,(byPaper.get(k)||0)+Math.max(1,Number(item.copies||1)));}",
"for(const item of group.items){const k=String(item.paper||group.paper)+'|'+(item.chassis?'1':'0');byPaper.set(k,(byPaper.get(k)||0)+Math.max(1,Number(item.copies||1)));}",'chassis item grouping');
 intake=patch(intake,"for(const [paper,count] of byPaper){\n    const price=priceBySize.get(String(group.size))?.[paper];\n    const valid=price!=null&&Number.isFinite(Number(price))&&Number(price)>=0;\n    const amount=valid?Number(price)*count:0;",
"for(const [key,count] of byPaper){\n    const [paper,chassis]=key.split('|');const prices=priceBySize.get(String(group.size));\n    const price=prices?.[paper],chassisPrice=chassis==='1'?prices?.chassis:0;\n    const valid=price!=null&&Number.isFinite(Number(price))&&Number(price)>=0&&chassisPrice!=null&&Number.isFinite(Number(chassisPrice));\n    const amount=valid?(Number(price)+Number(chassisPrice))*count:0;",'chassis quote');
 intake=patch(intake,"String(group.label)+' · '+paperName(paper)","String(group.label)+' · '+paperName(paper)+(chassis==='1'?' · شاسی':'')",'chassis preview label');
 intake=patch(intake,
"const photo=node('figure');const image=node('img');image.src=item.preview;image.alt=item.file.name;photo.append(image,node('figcaption',item.file.name));",
"const photo=node('figure');const frame=node('div',null,'pb1181IntakeFrame');const image=node('img');image.src=item.preview;image.alt=item.file.name;frame.append(image);photo.append(frame,node('figcaption',item.file.name));",
'intake photo frame');
 intake=patch(intake,"actions.append(del);","del.classList.add('pb1181DeleteOverlay');frame.append(del);",'delete overlay');
 intake=patch(intake,
"const quantity=node('div',null,'pb1142Quantity');quantity.append(node('span','تعداد'));",
"const chassisLabel=node('label',null,'pb1181ChassisToggle');const chassisInput=node('input');chassisInput.type='checkbox';chassisInput.checked=!!item.chassis;chassisInput.setAttribute('aria-label','شاسی');chassisInput.onchange=()=>{if(locked||submitting)return;item.chassis=chassisInput.checked;refreshInvoice();};chassisLabel.append(chassisInput,node('span','شاسی'));actions.append(chassisLabel);\n    const quantity=node('div',null,'pb1142Quantity');",
'intake chassis and remove quantity title');
 intake=patch(intake,"printType:item.paper,printCopies:item.copies,localOnly:true","printType:item.paper,printCopies:item.copies,chassis:!!item.chassis,localOnly:true",'chassis persisted with local file');
 fs.writeFileSync(intakePath,intake);
}
const bundlePath='dist/web/assets/index-UIRefine-v655-r84.js';
let bundle=fs.readFileSync(bundlePath,'utf8');
if(!bundle.includes('PB1181 same compact photo controls')){
 bundle=patch(bundle,
'chassis:!!file.chassis,frame:!!file.frame,printCopies:copies',
'chassis:delta.chassis===undefined?!!file.chassis:!!delta.chassis,frame:!!file.frame,printCopies:copies',
'detail chassis');
 bundle=patch(bundle,
'copies===Number(file.print_copies||1))return;',
'copies===Number(file.print_copies||1)&&change.chassis===!!file.chassis)return;',
'detail detects chassis change');
 bundle=patch(bundle,'await jc(target.dir,updated.original_name,original.file);',
'const handle=await target.dir.getFileHandle(Ya(updated.original_name,"file"),{create:true});const writer=await handle.createWritable();try{await writer.write(original.file);await writer.close()}catch(err){await writer.abort().catch(()=>{});throw err}',
'write photo with image name, never invoice.pdf');
 bundle=patch(bundle,' function pb1180RenderGroups(){',
 ' /* PB1181 same compact photo controls */\n '+pb1181RemoveFile.toString()+'\n function pb1180RenderGroups(){',
'detail delete handler');
 bundle=patch(bundle,
'e.jsx("div",{className:"pb1180Thumb",children:e.jsx(qu,{file,detail:y,onOpen:()=>re(y.files.findIndex(item=>item.id===file.id))})}),',
'e.jsxs("div",{className:"pb1180Thumb pb1181PhotoFrame",children:[e.jsx(qu,{file,detail:y,onOpen:()=>re(y.files.findIndex(item=>item.id===file.id))}),canEdit&&e.jsx("button",{type:"button",className:"pb1181DeleteOverlay",title:"حذف عکس",onClick:()=>pb1181RemoveFile(file),children:"×"})]}),',
'detail photo delete overlay');
 bundle=patch(bundle,
'e.jsx("button",{type:"button",className:"pb1180Settings",onClick:()=>Ot(file),disabled:!canEdit,title:"تغییر سایز، کاغذ، شاسی یا قاب",children:"⚙"}),\n     y.order.recovered_from_order_id&&canEdit&&e.jsx("button",{type:"button",className:"pb1180Remove",onClick:()=>Je(file),title:"حذف عکس از سفارش چاپ مجدد",children:"×"})',
'e.jsxs("label",{className:"pb1181ChassisToggle",children:[e.jsx("input",{type:"checkbox",checked:!!file.chassis,disabled:!canEdit,"aria-label":"شاسی",onChange:event=>pb1180Patch(file,{chassis:event.target.checked})}),e.jsx("span",{children:"شاسی"})]})',
'detail settings replaced with chassis');
 bundle=patch(bundle,
'e.jsx("span",{children:"تعداد"}),\n     e.jsx("button",{type:"button",disabled:!canEdit',
'e.jsx("button",{type:"button",disabled:!canEdit',
'detail quantity label removed');
 fs.writeFileSync(bundlePath,bundle);
}
const htmlPath='dist/web/index.html';
let html=fs.readFileSync(htmlPath,'utf8');
const tag='<link rel="stylesheet" href="/photobridge-r1181-lab-photo-controls.css?v=r1181">';
if(!html.includes(tag))html=html.replace('</head>',tag+'\n</head>');
html=html.replace(/(photobridge-r1137-lab-local-intake\.(?:css|js)\?v=)[^"']+/g,'$1r1181');
html=html.replace(/(index-UIRefine-v655-r84\.js\?v=[^"']+)/g,v=>v.includes('photo=r1181')?v:v+'&photo=r1181');
fs.writeFileSync(htmlPath,html);
for(const file of [intakePath,bundlePath])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1181-lab-photo-controls.cjs'],{stdio:'inherit'});
