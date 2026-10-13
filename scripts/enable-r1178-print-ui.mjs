import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
(function patchUI(fs){
let s=fs.readFileSync("dist/web/assets/index-UIRefine-v655-r84.js","utf8");
if(s.includes("pb1178CopiesEdit"))return;
const one=(a,b)=>{const n=s.split(a).length-1;if(n!==1)throw Error("R1178 bundle anchor "+n+": "+a.slice(0,100));s=s.replace(a,b)};
// Photo duplicates in the same selected size are quantities, not extra uploads.
one('const oe=await d(b);k(ee=>ee.map(Q=>Q.id===ue?{...Q,files:[...Q.files,...oe],open:!0}:Q))',
`const identifier=oe=>[oe.name,oe.size,oe.lastModified].join("\\u0000");
 const existing=E.current.find(Q=>Q.id===ue)?.files||[];
 const groups=new Map();
 for(const file of b){const key=identifier(file);const row=groups.get(key);if(row)row.count++;else groups.set(key,{file,count:1});}
 const fresh=[...groups.values()].filter(row=>!existing.some(old=>identifier(old.file)===identifier(row.file)));
 const oe=await d(fresh.map(row=>row.file));
 k(ee=>ee.map(Q=>{if(Q.id!==ue)return Q;const files=[...Q.files];
 for(const row of groups.values()){
   const old=files.find(item=>identifier(item.file)===identifier(row.file));
   if(old)files[files.indexOf(old)]={...old,printCopies:Math.min(99,pbPrintCopies(old)+row.count)};
   else {const candidate=oe.find(item=>identifier(item.file)===identifier(row.file));if(candidate)files.push({...candidate,printCopies:Math.min(99,row.count)});}
 }
 return {...Q,files,open:!0};}))`);
// Price list within each selected lab's photographer print workspace.
one('e.jsxs("button",{type:"button",className:"primary simplePrintPilotPrimaryAdd",disabled:W||c',
 'e.jsx("button",{type:"button",className:"pb1178LabPrices",disabled:W||c,onClick:()=>window.pb1178ShowLabPrices?.(t),children:"تعرفه‌های لابراتوار"}),e.jsxs("button",{type:"button",className:"primary simplePrintPilotPrimaryAdd",disabled:W||c');
// Lab order details: print count shows beside each photo in compact and card views.
one('e.jsxs("small",{children:[V(le.width),"×",V(le.height)," px · ",Vi(le.bytes)]})',
 'e.jsxs("small",{children:[V(le.width),"×",V(le.height)," px · ",Vi(le.bytes)]}),y.order.mode!=="album"&&e.jsx("button",{type:"button",className:"pb1178CopiesEdit",onClick:()=>Ot(le),children:"تعداد چاپ: "+V(le.print_copies||1)+" · اصلاح"})');
one('className:"labCardFileToolbarV344",children:[y.order.mode!=="album"&&le.chassis',
 'className:"labCardFileToolbarV344",children:[y.order.mode!=="album"&&e.jsx("button",{type:"button",className:"pb1178CopiesEdit",onClick:()=>Ot(le),children:"تعداد چاپ: "+V(le.print_copies||1)+" · اصلاح"}),y.order.mode!=="album"&&le.chassis');
// Initialize editable qty in settings dialog.
one('printType:String(le.print_type||"luster"),chassis:!!le.chassis,frame:!!le.frame})',
 'printType:String(le.print_type||"luster"),chassis:!!le.chassis,frame:!!le.frame,copies:Number(le.print_copies||1)})');
one('||!!le.chassis!=!!Ne.chassis||!!le.frame!=!!Ne.frame;let xt=null',
 '||!!le.chassis!=!!Ne.chassis||!!le.frame!=!!Ne.frame||Number(le.print_copies||1)!==Number(Ne.copies||1);let xt=null');
one('printSizeId:Ne.sizeId,printType:Ne.printType,chassis:!!Ne.chassis,frame:!!Ne.frame})',
 'printSizeId:Ne.sizeId,printType:Ne.printType,chassis:!!Ne.chassis,frame:!!Ne.frame,printCopies:Number(Ne.copies||1)})');
one('onChange:xt=>Ie(Mt=>({...Mt,printType:xt}))})]})]}),e.jsxs("div",{className:"labPrintSettingsAddons"',
 'onChange:xt=>Ie(Mt=>({...Mt,printType:xt}))})]}),e.jsxs("label",{className:"pb1178CopiesField",children:["تعداد چاپ",e.jsx("input",{type:"number",min:1,max:99,step:1,value:Ne.copies??D.print_copies??1,onChange:xt=>Ie(Mt=>({...Mt,copies:Number(xt.target.value)}))})]})]}),e.jsxs("div",{className:"labPrintSettingsAddons"');
fs.writeFileSync("dist/web/assets/index-UIRefine-v655-r84.js",s);
})(fs);
execFileSync(process.execPath,['--check','dist/web/assets/index-UIRefine-v655-r84.js'],{stdio:'inherit'});
