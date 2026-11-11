/* R1774: add chassis/frame to read-only invoice presentation labels for native PDF. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/api/server.js';
let server=fs.readFileSync(path,'utf8');
const exactlyOnce=(source,needle,next,label)=>{
 const hits=source.split(needle).length-1;
 if(hits!==1)throw Error('[R1774] '+label+' anchor count '+hits);
 return source.replace(needle,next);
};
const helper="/* PB_R1774_THERMAL_ITEM_DESCRIPTION */\nfunction pb1774ThermalInvoiceItems(raw) {\n let items=raw;\n if(typeof items==='string'){try{items=JSON.parse(items)}catch{return raw}}\n if(!Array.isArray(items))return raw;\n const selected=value=>value===true||value===1||String(value||'').toLowerCase()==='true';\n const mark=(value,title,english)=>{\n  const text=String(value||'').trim();\n  return new RegExp(title+'|'+english,'i').test(text)?text:text+(text?' · ':'')+title;\n };\n return items.map(item=>{\n  if(!item||typeof item!=='object'||Array.isArray(item))return item;\n  const chassis=selected(item.chassis),frame=selected(item.frame);\n  if(!chassis&&!frame)return item;\n  const rawType=String(item.printTypeLabel||item.print_type_label||invoicePrintTypeLabel(item.printType||item.print_type||'')).trim();\n  const size=String(item.sizeLabel||item.size_label||'').trim();\n  let type=rawType;\n  let description=String(item.description||[size,rawType].filter(Boolean).join(' - ')).trim();\n  if(chassis){type=mark(type,'شاسی','chassis');description=mark(description,'شاسی','chassis')}\n  if(frame){type=mark(type,'قاب','frame');description=mark(description,'قاب','frame')}\n  return {...item,printTypeLabel:type,description};\n });\n}\n";

if(!server.includes('/* PB_R1774_THERMAL_ITEM_DESCRIPTION */')){
 server=exactlyOnce(server,
  'async function financeDocumentsForCustomer(c, labId, customerId) {',
  helper+'async function financeDocumentsForCustomer(c, labId, customerId) {',
  'helper');
 server=exactlyOnce(server,
  'const docs = [...invQ.rows.map((row) => ({ ...row, order_id:',
  'const docs = [...invQ.rows.map((row) => ({ ...row, items:pb1774ThermalInvoiceItems(row.items), order_id:',
  'lab finance list items');
 server=exactlyOnce(server,
  'return sendJson(res, 200, { order: oq.rows[0], files: fq.rows, invoice: iq.rows[0] || null, paymentReceipt: rq.rows[0] || null });',
  'return sendJson(res, 200, { order: oq.rows[0], files: fq.rows, invoice: iq.rows[0] ? {...iq.rows[0],items:pb1774ThermalInvoiceItems(iq.rows[0].items)} : null, paymentReceipt: rq.rows[0] || null });',
  'order invoice detail');
 fs.writeFileSync(path,server);
}
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
console.log('[R1774] Invoice item presentation updated without changing finance records.');
