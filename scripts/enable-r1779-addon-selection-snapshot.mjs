/* R1779: preserve chassis/frame model+color selections on uploaded files. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
function patch(original){
 let server=original;
 const once=(s,a,b,where)=>{const n=s.split(a).length-1;if(n!==1)throw Error('[R1779] '+where+': anchor count '+n);return s.replace(a,b)};
 server=once(server,"import {createGalleryMessaging} from './gallery-messaging.js';",
  "import {snapshotPrintAddons} from './print-addon-selection.js';\nimport {createGalleryMessaging} from './gallery-messaging.js';",'import');
 const helper=[
  '/* PB1779 ORDER-IMMUTABLE ADDON SNAPSHOT */',
  'async function pb1779Snapshot(labId,body,sizeId,audience){',
  ' if(!body?.chassis&&!body?.frame)return {};',
  " const q=await pool.query('SELECT ui_preferences FROM labs WHERE id=$1',[labId]);",
  ' const catalog=normalizePrintCatalog(q.rows[0]?.ui_preferences?.printTariffCatalog);',
  ' return snapshotPrintAddons(catalog,body,{sizeId,audience});',
  '}',''
 ].join('\n');
 server=once(server,'async function financeDocumentsForCustomer(c, labId, customerId) {',
  helper+'async function financeDocumentsForCustomer(c, labId, customerId) {','snapshot helper');
 const section=(first,last,fn,label)=>{
  const start=server.indexOf(first),end=server.indexOf(last,start+first.length);
  if(start<0||end<start)throw Error('[R1779] '+label+' boundary');
  const prev=server.slice(start,end),next=fn(prev);
  if(prev===next)throw Error('[R1779] '+label+' unchanged');
  server=server.slice(0,start)+next+server.slice(end);
 };
 section("const publicWalkinPresign = url.pathname.match(","const publicWalkinLocal = url.pathname.match(",s=>{
  s=once(s,"        const price = await pool.query(`SELECT",
   "        let pb1779AddonSelection;\n        try{pb1779AddonSelection=await pb1779Snapshot(order.lab_id,b,sizeId,'walkin');}\n        catch(e){return sendJson(res,e?.status||400,{error:e?.message||'invalid_addon_model'});}\n        const price = await pool.query(`SELECT",'walkin model');
  s=once(s,"chassis,frame,crop_handling,original_state) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'pending')",
   "chassis,frame,crop_handling,addon_selection,original_state) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb,'pending')",'walkin insert');
  s=once(s,"Boolean(b.frame), cropHandling]);",
   "Boolean(b.frame), cropHandling, JSON.stringify(pb1779AddonSelection)]);",'walkin params');
  return s;
 },'walkin route');
 section("if (req.method === 'POST' && url.pathname === '/api/customer/uploads/presign') {","const localUpload = url.pathname.match(",s=>{
  s=once(s,"            await pool.query(`INSERT INTO order_files(",
   "            let pb1779AddonSelection;\n            try{pb1779AddonSelection=albumMode?{}:await pb1779Snapshot(labId,b,sizeId,'colleague');}\n            catch(e){return sendJson(res,e?.status||400,{error:e?.message||'invalid_addon_model'});}\n            await pool.query(`INSERT INTO order_files(",'photographer model');
  s=once(s,"chassis,frame,crop_handling,print_copies,original_state)\n        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'pending')",
   "chassis,frame,crop_handling,print_copies,addon_selection,original_state)\n        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,'pending')",'photographer insert');
  s=once(s,"cropHandling, albumMode ? 1 : printCopies]);",
   "cropHandling, albumMode ? 1 : printCopies, JSON.stringify(pb1779AddonSelection)]);",'photographer params');
  return s;
 },'photographer route');
 server=once(server,"f.print_size_id,f.print_type,f.chassis,f.frame,f.crop_handling,f.original_state,f.created_at",
  "f.print_size_id,f.print_type,f.chassis,f.frame,f.addon_selection,f.crop_handling,f.original_state,f.created_at",'lab file details');
 server=once(server,"f.print_size_id,f.print_type,f.chassis,f.frame,f.crop_handling,f.original_state,s.label size_label",
  "f.print_size_id,f.print_type,f.chassis,f.frame,f.addon_selection,f.crop_handling,f.original_state,s.label size_label",'customer file details');
 return server;
}
const file='dist/api/server.js';
const original=fs.readFileSync(file,'utf8');
const updated=patch(original);
fs.writeFileSync(file,updated);
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('[R1779] lab and walk-in model snapshots attached to uploaded files.');
