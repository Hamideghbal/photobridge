import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// Shared group-card presentation for lab print details; albums remain untouched.
function pb1180Methods(){
 function pb1180Editable(){
  return !!(y&&y.order)&&["sent","received","downloaded","needs_fix"].includes(String(y.order.status||""))&&!Y&&!N;
 }
 function pb1180GroupData(){
  const groups=new Map();
  for(const file of y.files||[]){
   const key=String(file.print_size_id||file.size_label||"unknown");
   if(!groups.has(key))groups.set(key,{key,label:file.size_label||"سایز نامشخص",items:[],copies:0});
   const group=groups.get(key);group.items.push(file);group.copies+=Math.max(1,Number(file.print_copies||1));
  }
  return [...groups.values()];
 }
 async function pb1180Patch(file,delta){
  if(!pb1180Editable())return;
  const copies=delta.printCopies===undefined?Number(file.print_copies||1):Number(delta.printCopies);
  if(!Number.isInteger(copies)||copies<1||copies>99){alert("تعداد چاپ هر عکس باید بین ۱ تا ۹۹ باشد.");return;}
  const change={printSizeId:String(delta.printSizeId||file.print_size_id||""),printType:String(delta.printType||file.print_type||""),chassis:!!file.chassis,frame:!!file.frame,printCopies:copies};
  if(change.printSizeId===String(file.print_size_id||"")&&change.printType===String(file.print_type||"")&&copies===Number(file.print_copies||1))return;
  let original=null;
  if(y.order.downloaded_at&&ai())try{original=await tl(y,file)}catch{}
  Re(!0);
  try{
   const response=await Me("/api/lab/order-files/"+file.id+"/print-settings",{method:"PATCH",body:JSON.stringify(change)});
   let localWarning=!1;
   if(original&&response.file&&response.file.original_name!==file.original_name){
    try{
     const updated={...file,...response.file},target=await el(y,updated);
     await jc(target.dir,updated.original_name,original.file);
     await original.target.dir.removeEntry(Ya(file.original_name,"file"));
    }catch{localWarning=!0;}
   }
   _pbDetailCache.current.delete(String(y.order.id));
   await Tt(y.order,!1);await ye();
   if(localWarning)alert("تغییر ثبت شد اما نام یا محل فایل روی هارد هماهنگ نشد؛ پوشه سفارش را قبل از چاپ بررسی کن.");
  }catch(error){
   const code=String((error&&error.data&&error.data.error)||error.message||"");
   alert(code==="order_print_settings_locked"?"چاپ شروع شده و امکان تغییر تعداد یا کاغذ نیست.":code==="stock_unavailable"?"موجودی شاسی یا قاب برای این تعداد کافی نیست.":code==="invalid_print_copies"?"تعداد مجاز ۱ تا ۹۹ است.":code==="print_price_unavailable"?"برای کاغذ انتخاب‌شده تعرفه ثبت نشده است.":"ویرایش عکس ذخیره نشد؛ دوباره تلاش کن.");
   _pbDetailCache.current.delete(String(y.order.id));await Tt(y.order,!1).catch(()=>{});
  }finally{Re(!1);}
 }
 function pb1180Summary(){
  return e.jsx("div",{className:"pb1180SizeStats",children:pb1180GroupData().map(group=>e.jsxs("span",{className:"pb1180Stat",children:[e.jsx("b",{children:group.label}),e.jsx("small",{children:V(group.items.length)+" عکس · "+V(group.copies)+" چاپ"})]},group.key))});
 }
 function pb1180RenderGroups(){
  const canEdit=pb1180Editable();
  return e.jsx("div",{className:"pb1180DetailGroups",children:pb1180GroupData().map(group=>e.jsxs("section",{className:"pb1139Group pb1180DetailGroup",children:[
   e.jsxs("div",{className:"pb1139GroupHead",children:[
    e.jsx("b",{children:group.label}),
    e.jsx("span",{children:V(group.items.length)+" عکس · "+V(group.copies)+" چاپ"}),
    e.jsx("button",{type:"button",className:"pb1180Fold",onClick:()=>pb1180SetFolded(previous=>({...previous,[group.key]:!previous[group.key]})),"aria-expanded":!pb1180Folded[group.key],"aria-label":pb1180Folded[group.key]?"باز کردن گروه":"بستن گروه",children:pb1180Folded[group.key]?"▾":"▴"})
   ]}),
   !pb1180Folded[group.key]&&e.jsx("div",{className:"pb1139GroupPhotos pb1180GroupPhotos",children:group.items.map(file=>e.jsxs("figure",{className:"pb1180Photo",children:[
    e.jsx("div",{className:"pb1180Thumb",children:e.jsx(qu,{file,detail:y,onOpen:()=>re(y.files.findIndex(item=>item.id===file.id))})}),
    e.jsx("figcaption",{title:file.original_name,children:file.original_name}),
    e.jsxs("div",{className:"pb1180PhotoTools",children:[
     e.jsx("select",{className:"pb1180Paper",value:file.print_type||"luster",disabled:!canEdit,"aria-label":"نوع کاغذ چاپ",onChange:event=>pb1180Patch(file,{printType:event.target.value}),children:[["luster","لاستر"],["silk","سیلک"],["metallic","متالیک"]].map(option=>e.jsx("option",{value:option[0],children:option[1]},option[0]))}),
     e.jsx("button",{type:"button",className:"pb1180Settings",onClick:()=>Ot(file),disabled:!canEdit,title:"تغییر سایز، کاغذ، شاسی یا قاب",children:"⚙"}),
     y.order.recovered_from_order_id&&canEdit&&e.jsx("button",{type:"button",className:"pb1180Remove",onClick:()=>Je(file),title:"حذف عکس از سفارش چاپ مجدد",children:"×"})
    ]}),
    e.jsxs("div",{className:"pb1180Quantity",children:[
     e.jsx("span",{children:"تعداد"}),
     e.jsx("button",{type:"button",disabled:!canEdit||Number(file.print_copies||1)<=1,onClick:()=>pb1180Patch(file,{printCopies:Number(file.print_copies||1)-1}),children:"−"}),
     e.jsx("input",{type:"number",min:1,max:99,step:1,defaultValue:Number(file.print_copies||1),disabled:!canEdit,key:String(file.id)+":"+String(file.print_copies||1),"aria-label":"تعداد چاپ",onBlur:event=>{const val=Number(event.target.value);if(val!==Number(file.print_copies||1))pb1180Patch(file,{printCopies:val});},onKeyDown:event=>{if(event.key==="Enter")event.currentTarget.blur();}}),
     e.jsx("button",{type:"button",disabled:!canEdit||Number(file.print_copies||1)>=99,onClick:()=>pb1180Patch(file,{printCopies:Number(file.print_copies||1)+1}),children:"＋"})
    ]})
   ]},file.id))})
  ]},group.key))});
 }
}
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';
let src=fs.readFileSync(bundle,'utf8');
function one(old,replacement){
 const n=src.split(old).length-1;
 if(n!==1)throw Error('R1180 unsafe bundle anchor ('+n+'): '+old.slice(0,120));
 src=src.replace(old,replacement);
}
if(!src.includes('pb1180RenderGroups')){
 const body=pb1180Methods.toString().split('{').slice(1).join('{').replace(/}\s*$/,'');
 one('[v,$]=x.useState("cards"),[X,re]=','[v,$]=x.useState("cards"),[pb1180Folded,pb1180SetFolded]=x.useState({}),[X,re]=');
 one(';if(h)return e.jsxs("section",{className:"orderDetailPage "',';/* PB1180 grouped lab order photo details */'+body+';if(h)return e.jsxs("section",{className:"orderDetailPage "');
 one('e.jsxs("small",{children:[V(y.files.length)," فایل"]})]}),e.jsxs("div",{className:"labFilesDetailActions"','e.jsxs("small",{children:[V(y.files.length)," فایل"]})]}),y.order.mode==="print"&&pb1180Summary(),e.jsxs("div",{className:"labFilesDetailActions"');
 one('e.jsxs("div",{className:"labFileViewToggle",children:[','y.order.mode==="album"&&e.jsxs("div",{className:"labFileViewToggle",children:[');
 one('y.files.length?v==="compact"?','y.files.length?y.order.mode==="print"?pb1180RenderGroups():v==="compact"?');
 one('le.status!=="ready"&&le.status!=="completed"&&e.jsx("button",{className:"miniFixBtn",onClick:()=>le.mode==="print"?Tt(le):(()=>{J(le),ae("")})(),children:"اصلاح"}),','');
 fs.writeFileSync(bundle,src);
}
const intakePath='dist/web/photobridge-r1137-lab-local-intake.js';
let intake=fs.readFileSync(intakePath,'utf8');
const old="const paper=field(actions,'کاغذ عکس',select(paperOptions));paper.value=item.paper;";
const next="const paper=select(paperOptions);paper.className='pb1180IntakePaper';paper.setAttribute('aria-label','نوع کاغذ عکس');actions.append(paper);paper.value=item.paper;";
if(!intake.includes('pb1180IntakePaper')){
 if(intake.split(old).length!==2)throw Error('R1180 intake paper anchor changed');
 intake=intake.replace(old,next);fs.writeFileSync(intakePath,intake);
}
const htmlPath='dist/web/index.html';let html=fs.readFileSync(htmlPath,'utf8');
const cssLink='<link rel="stylesheet" href="/photobridge-r1180-lab-order-details.css?v=r1180">';
if(!html.includes(cssLink))html=html.replace('</head>',cssLink+'\n</head>');
html=html.replace(/(photobridge-r1137-lab-local-intake\.(?:css|js)\?v=)[^"']+/g,'$1r1180');
html=html.replace(/(index-UIRefine-v655-r84\.js\?v=[^"']+)/g,value=>value.includes('details=r1180')?value:value+'&details=r1180');
fs.writeFileSync(htmlPath,html);
execFileSync(process.execPath,['--check',bundle],{stdio:'inherit'});
execFileSync(process.execPath,['--check',intakePath],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1180-lab-order-details.cjs'],{stdio:'inherit'});
