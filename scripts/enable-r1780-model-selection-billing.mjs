/* R1780: choose accurate per-model prices, preserve names and offer add-on-only photos. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/api/server.js';
let s=fs.readFileSync(file,'utf8');
const replace=(before,after,label)=>{const count=s.split(before).length-1;if(count!==1)throw Error('[R1780] '+label+' anchor '+count);s=s.replace(before,after)};
const section=(start,end,fn,label)=>{
 const a=s.indexOf(start),b=s.indexOf(end,a+start.length);
 if(a<0||b<0)throw Error('[R1780] '+label+' bounds');
 const old=s.slice(a,b),next=fn(old);
 if(next===old)throw Error('[R1780] '+label+' unchanged');
 s=s.slice(0,a)+next+s.slice(b);
};
const localOne=(src,old,next,label)=>{const n=src.split(old).length-1;if(n!==1)throw Error('[R1780] '+label+' anchor '+n);return src.replace(old,next)};
// Expose only the active lab's own catalog to the authenticated photographer.
replace("if (req.method === 'POST' && url.pathname === '/api/customer/uploads/presign') {",
 "if (req.method === 'GET' && url.pathname === '/api/customer/print-addon-catalog') {\n"+
 " const q=await pool.query('SELECT ui_preferences FROM labs WHERE id=$1',[labId]);\n"+
 " const catalog=normalizePrintCatalog(q.rows[0]?.ui_preferences?.printTariffCatalog);\n"+
 " return sendJson(res,200,{catalog});\n"+
 "}\n        if (req.method === 'POST' && url.pathname === '/api/customer/uploads/presign') {",
 'photographer catalog endpoint');
// Public walk-in catalog is scoped by a validated active lab slug.
section("const publicWalkinInfo = url.pathname.match(","const publicWalkinCreate = url.pathname.match(",part=>{
 part=localOne(part,"        return sendJson(res, 200, { lab:","        const addonQ=await pool.query('SELECT ui_preferences FROM labs WHERE id=$1',[lab.id]);\n        const addonCatalog=normalizePrintCatalog(addonQ.rows[0]?.ui_preferences?.printTariffCatalog);\n        return sendJson(res, 200, { addonCatalog, lab:",'public catalog');
 return part;
},'walkin public info');
// Photo-optional: a file can represent chassis/frame fabrication without paper printing.
// A boolean alone is insufficient: at least one add-on must be chosen.
section("const publicWalkinPresign = url.pathname.match(","const publicWalkinLocal = url.pathname.match(",part=>{
 part=localOne(part,
 "const sizeId = b.printSizeId ? String(b.printSizeId) : null, printType = ['luster', 'silk', 'metallic'].includes(String(b.printType)) ? String(b.printType) : null;",
 "const sizeId = b.printSizeId ? String(b.printSizeId) : null, withoutPrint=b.withoutPrint===true&&(b.chassis===true||b.frame===true),printType=withoutPrint?'none':['luster','silk','metallic'].includes(String(b.printType))?String(b.printType):null;",
 'walkin no paper');
 part=localOne(part,'SELECT ${printType} value,chassis,frame FROM walkin_prices',
 'SELECT ${printType===\'none\'?\'luster\':printType} value,chassis,frame FROM walkin_prices','walkin sql paper fallback');
 part=localOne(part,'if (!price.rowCount || price.rows[0].value == null)',
 'if (!price.rowCount && !withoutPrint || !withoutPrint && price.rows[0].value == null)','walkin paper price');
 part=localOne(part,'Boolean(b.chassis) && price.rows[0].chassis == null',
 'Boolean(b.chassis) && price.rows[0]?.chassis == null && pb1779AddonSelection?.chassis?.unitPrice == null','walkin chassis tariff');
 part=localOne(part,'Boolean(b.frame) && price.rows[0].frame == null',
 'Boolean(b.frame) && price.rows[0]?.frame == null && pb1779AddonSelection?.frame?.unitPrice == null','walkin frame tariff');
 return part;
},'walkin presign prices');
section("if (req.method === 'POST' && url.pathname === '/api/customer/uploads/presign') {","const localUpload = url.pathname.match(",part=>{
 part=localOne(part,
 "const printType = ['luster', 'silk', 'metallic'].includes(String(b.printType)) ? String(b.printType) : null;",
 "const withoutPrint=!albumMode&&b.withoutPrint===true&&(b.chassis===true||b.frame===true);\n            const printType=withoutPrint?'none':['luster','silk','metallic'].includes(String(b.printType))?String(b.printType):null;",
 'photographer no paper');
 return part;
},'photographer presign');
// A deliberate add-on-only order has no paper-price requirement. Do not raise
// invoice_pricing_required for its explicit printType "none".
section("const q = await c.query(`WITH priced AS (","function invoicePricingRequiredError(",part=>{
 return localOne(part,"WHERE base_price IS NULL","WHERE base_price IS NULL AND print_type<>'none'",'addon-only invoice requirements');
},'no-paper invoice pricing');
// Invoice must use saved model prices, not renamed/edited tariffs.
// Keep the original legacy fallback for previously recorded orders.
section("const fq = await c.query(`SELECT f.print_size_id,","const items = [...grouped.values()];",part=>{
 part=localOne(part,'f.chassis,f.frame,COALESCE(f.print_copies','f.chassis,f.frame,f.addon_selection,COALESCE(f.print_copies','invoice snapshot select');
 part=localOne(part,"const basePaper = f[String(f.print_type || '')];",
 "const addon=f.addon_selection&&typeof f.addon_selection==='object'?f.addon_selection:{};\n        const basePaper=f.print_type==='none'?0:f[String(f.print_type||'')];",
 'invoice selected media');
 part=localOne(part,'const chassis = Boolean(f.chassis) ? Number(f.chassis_price || 0) : 0;',
 'const chassis=Boolean(f.chassis)?Number(addon.chassis?.unitPrice ?? f.chassis_price ?? 0):0;','invoice chassis price');
 part=localOne(part,'const frame = Boolean(f.frame) ? Number(f.frame_price || 0) : 0;',
 'const frame=Boolean(f.frame)?Number(addon.frame?.unitPrice ?? f.frame_price ?? 0):0;','invoice frame price');
 part=localOne(part,"const key = `${f.print_size_id || ''}|${f.print_type || ''}|${Boolean(f.chassis)}|${Boolean(f.frame)}`;",
 "const key=[f.print_size_id||'',f.print_type||'',Boolean(f.chassis),Boolean(f.frame),addon.chassis?.id||'',addon.frame?.id||'',addon.frame?.colorId||'',unit].join('|');",
 'invoice grouping key');
 part=localOne(part,'chassis: Boolean(f.chassis), frame: Boolean(f.frame), unitPrice: unit, quantity: 0, lineTotal: 0',
 'chassis: Boolean(f.chassis), frame: Boolean(f.frame), chassisModelName:addon.chassis?.name||null,frameModelName:addon.frame?.name||null,frameColorName:addon.frame?.colorName||null,unitPrice: unit, quantity: 0, lineTotal: 0',
 'invoice selected model labels');
 return part;
},'invoice charges');
replace("function invoicePrintTypeLabel(type) { return { luster: 'لاستر', silk: 'سیلک', metallic: 'متالیک' }[type] || type || 'چاپ'; }",
 "function invoicePrintTypeLabel(type) { return { luster: 'لاستر', silk: 'سیلک', metallic: 'متالیک', none:'بدون چاپ عکس' }[type] || type || 'چاپ'; }",
 'no paper label');
replace("function accountingItemDescription(item) { return `${item?.sizeLabel || 'سایز'} · ${invoicePrintTypeLabel(item?.printType)}${item?.chassis ? ' · شاسی' : ''}${item?.frame ? ' · قاب' : ''}`; }",
 "function accountingItemDescription(item) { return [item?.sizeLabel||'سایز',invoicePrintTypeLabel(item?.printType),item?.chassis?(item.chassisModelName||'شاسی'):null,item?.frame?([item.frameModelName||'قاب',item.frameColorName].filter(Boolean).join(' ')):null].filter(Boolean).join(' · '); }",
 'accounting selected descriptions');
fs.writeFileSync(file,s);
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('[R1780] public/photographer models and immutable priced invoices, optional no-paper selection.');