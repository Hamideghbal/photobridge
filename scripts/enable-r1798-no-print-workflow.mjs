import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const one=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error('[R1798] '+label+' anchor '+n);return s.replace(a,b)};
const region=(s,a,b,fn,label)=>{const i=s.indexOf(a),j=i<0?-1:s.indexOf(b,i+a.length);if(i<0||j<=i)throw Error('[R1798] '+label+' bounds');return s.slice(0,i)+fn(s.slice(i,j))+s.slice(j)};
let server=read('dist/api/server.js');
server="import {noPrintOrderSql,isNoPrintOrder,noPrintStage,productInvoiceRequired} from './no-print-workflow.js';\n"+server;
for(const [start,end,label] of [
 ["if (req.method === 'GET' && url.pathname === '/api/lab/orders')", "if (req.method === 'GET' && url.pathname === '/api/lab/archive')",'lab list'],
 ["if (labOrder && req.method === 'GET')", "if (labOrder && req.method === 'DELETE')",'lab detail'],
 ["if (req.method === 'GET' && url.pathname === '/api/customer/orders')", "if (req.method === 'GET' && url.pathname === '/api/customer/archive')",'customer list']
])server=region(server,start,end,s=>{s=one(s,'SELECT o.*,','SELECT o.*,${noPrintOrderSql(\'o\')} no_print_order,',label);if(label==='lab list')s=one(s,'AND op.unit_price IS NULL)','AND op.unit_price IS NULL AND f.print_type<>\'none\')','no phantom paper-price requirement');return s},label);
server=one(server,'SELECT o.*,i.id invoice_id,COALESCE(i.offline_reference,i.number::text)','SELECT o.*,${noPrintOrderSql(\'o\')} no_print_order,i.id invoice_id,COALESCE(i.offline_reference,i.number::text)','customer detail workflow metadata');
server=one(server,'SELECT o.id,o.number,o.status,o.priority,o.created_at,COALESCE(o.walkin_customer_name,pp.studio_name,u.name) customer_name,','SELECT o.id,o.number,o.status,o.priority,o.created_at,${noPrintOrderSql(\'o\')} no_print_order,COALESCE(o.walkin_customer_name,pp.studio_name,u.name) customer_name,','dashboard workflow metadata');
server=region(server,"if (labOrder && req.method === 'PATCH')",'// PB1181 mark removed photos',s=>{
 s=one(s,"const status = String(b.status || '');","let status = String(b.status || '');",'mapped product stages');
 s=one(s,'const oldOrder = before.rows[0];',`const oldOrder = before.rows[0];
                const noPrint=await isNoPrintOrder(c,labId,oldOrder.id);
                if(noPrint){const stage=noPrintStage(status);if(stage.error){await c.query('ROLLBACK');return sendJson(res,409,stage)}status=stage.status;}`,'authoritative stage guard');
 s=one(s,'const order = q.rows[0];','const order = {...q.rows[0],no_print_order:noPrint};','product workflow response');
 s=one(s,'let invoiceUploadUrl = null;',`let invoiceUploadUrl = null;
                if(noPrint&&status==='received'&&productInvoiceRequired(oldOrder)){
                    const requirements=await orderInvoicePriceRequirements(c,labId,oldOrder.id);
                    if(!requirements.some(row=>!row.resolved))invoice=await createOrGetInvoice(c,labId,oldOrder.id);
                }`,'invoice without a photo-download requirement');
 s=one(s,"else if (status === 'printed') {","else if (status === 'printed'||noPrint&&status==='completed') {",'completed product retention');
 return s;
},'product stage transaction');
fs.writeFileSync('dist/api/server.js',server);execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const path=root+'/assets/index-UIRefine-v655-r84.js';let ui=read(path);
 ui=one(ui,'rn=(le,nt)=>{if(o==="album")','rn=(le,nt)=>{if(pb1798NoPrintOrder(le))return nt==="received"?["received","completed"].includes(le.status):nt==="completed"?le.status==="completed":false;if(o==="album")',root+' product stage progress');
 ui=one(ui,'en=(le,nt)=>o==="album"?','en=(le,nt)=>pb1798NoPrintOrder(le)?dn(le,[nt]):o==="album"?',root+' product dates');
 ui=one(ui,'la=(le,nt)=>(nt==="download"','la=(le,nt)=>pb1798NoPrintOrder(le)?(nt==="received"?!["received","completed","cancelled","awaiting_payment"].includes(le.status):nt==="completed"?le.status==="received"&&!pb1603InvoicePending(le):false):(nt==="download"',root+' product enabled stages');
 ui=one(ui,'aa=async(le,nt)=>{if(E||pb1578Pending)return;',`aa=async(le,nt)=>{if(E||pb1578Pending)return;if(pb1798NoPrintOrder(le)){C(le.id);try{await It(le,nt);P(nt==='received'?'سفارش بدون چاپ وارد بسته‌بندی شد.':'سفارش شاسی/قاب تحویل شد.')}catch(error){P(error?.data?.message||'تغییر مرحله انجام نشد.');if(error?.data?.error==='order_invoice_required')on(le,'none')}finally{C('')}return;}`,root+' direct product stage action');
 ui=one(ui,'children:mn.map(Jt=>','children:(pb1798NoPrintOrder(le)?[{key:"received",label:"بسته‌بندی"},{key:"completed",label:"تحویل"}]:mn).map(Jt=>',root+' product-only controls');
 ui=one(ui,'e.jsx("div",{className:"labActionTimeline",','pb1798NoPrintOrder(le)&&e.jsx("div",{className:"pb1798ProductBadge",children:"سفارش شاسی/قاب — بدون چاپ عکس"}),e.jsx("div",{className:"labActionTimeline",',root+' product work-order badge');
 ui=one(ui,"&&(!!order.downloaded_at||['downloaded','printing'","&&(pb1798NoPrintOrder(order)||!!order.downloaded_at||['downloaded','printing'",root+' product invoice button');
 ui=one(ui,'const pt=[{key:"sent",label:"ارسال به لابراتوار"','const pt=pb1798NoPrintOrder(De)?[{key:"sent",label:"ثبت سفارش کالا",statuses:["sent"]},{key:"received",label:"بسته‌بندی",statuses:["received"]},{key:"completed",label:"تحویل",statuses:["completed"]}]:[{key:"sent",label:"ارسال به لابراتوار"',root+' customer product timeline');
 ui=one(ui,'className:"pb1464OrderProgress",children:[e.jsx("small",{children:"وضعیت چاپ"}),ft(De)]','className:"pb1464OrderProgress"+(pb1798NoPrintOrder(De)?" pb1798ProductProgress":""),children:[e.jsx("small",{children:pb1798NoPrintOrder(De)?"وضعیت سفارش کالا":"وضعیت چاپ"}),ft(De)]',root+' visible product progress');
 for(const obj of ['le','De','y.order'])ui=ui.replaceAll('br['+obj+'.status]','pb1798OrderStatus('+obj+')');
 ui=one(ui,'className:"card orderFilesCard",children:[','className:"card orderFilesCard",children:[pb1798NoPrintOrder(y.order)&&e.jsx("div",{className:"pb1798ProductBadge",children:"فقط سفارش شاسی/قاب؛ تصویر برگه سفارش راهنماست و نباید چاپ شود."}),',root+' detail badge');
 ui=one(ui,"e.jsx('h2',{children:'دانلود خودکار و چاپ فاکتور'}),","e.jsx('h2',{children:'دانلود خودکار و چاپ فاکتور'}),e.jsx(PB1798ThermalColumnsPreview,{}),",root+' invoice-template settings');
 ui=region(ui,'function pbR1698ApprovedThermal(','function Vy(',s=>{
  s=one(s,'const items=typeof vh',"const noPrint=pb1798NoPrintInvoice(t);\n  const items=typeof vh",'distinct product receipt');
  s=one(s,'<div class="frame"><header', '<div class="frame">${noPrint?\'<section style="border-bottom:3px solid #000;padding:3mm;text-align:center;font-size:16px;font-weight:900"><b>سفارش شاسی / قاب</b><br>بدون چاپ عکس<br><small>فقط ساخت، بسته‌بندی و تحویل کالا<br>DO NOT PRINT PHOTO</small></section>\':\'\'}<header','product work-order heading');
  s=one(s,"${customer?'رسید مشتری':'رسید همکار'}","${noPrint?'رسید سفارش کالا':customer?'رسید مشتری':'رسید همکار'}",'product receipt identity');
  s=one(s,'class="frame">${noPrint?',`class="frame\${noPrint?' productOnly':''}">\${noPrint?`,'product receipt class');
  s=one(s,'.person{display:grid;gap:.6mm;','.productOnly .meta{flex-wrap:wrap;white-space:normal}.productOnly .meta .title{font-size:12px}\n  .person{display:grid;gap:.6mm;','product receipt metadata fit');
  return s;
 },root+' receipt');
 if(root.endsWith('lab-desktop-ui'))ui=one(ui,'async function pb1568ProcessOrder(lab,order,settings){','async function pb1568ProcessOrder(lab,order,settings){\n if(pb1798NoPrintOrder(order))return;',root+' skip automatic photo workflow');
 ui+='\n/* PB1798 NO PRINT WORKFLOW */\n'+read('scripts/r1798-no-print-ui.js.txt');
 fs.writeFileSync(path,ui);execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
 const htmlPath=root+'/index.html';let html=read(htmlPath);html=one(html,'</head>','<link rel="stylesheet" href="/photobridge-r1798-no-print.css?v=r1798"></head>',root+' style');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u+'&noPrint=r1798');fs.writeFileSync(htmlPath,html);
}
const native='dist/web/lab-desktop-ui',style='photobridge-r1798-no-print.css';fs.copyFileSync('dist/web/'+style,native+'/'+style);
const mf=native+'/manifest.json',m=JSON.parse(read(mf)),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
for(const name of ['assets/index-UIRefine-v655-r84.js','index.html',style]){const sha256=hash(fs.readFileSync(native+'/'+name)),entry=m.files.find(f=>f.name===name);if(entry)entry.sha256=sha256;else m.files.push({name,url:'/lab-desktop-ui/'+name,sha256})}
m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(mf,JSON.stringify(m));
console.log('[R1798] product-only packing/delivery workflow, thermal work-order identity and unit-price settings preview');
