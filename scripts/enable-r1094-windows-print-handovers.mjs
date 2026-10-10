// R1094: shop-scoped fresh mobile handover feed and native printer-compatible HTML.
import fs from 'node:fs';
const file='dist/api/server.js';
let src=fs.readFileSync(file,'utf8');
const marker='/* PB_R1094_WINDOWS_PRINT_HANDOVERS */';
const anchor='const commitmentRoute=url.pathname.match(';
if(!src.includes(marker)){
 if(src.split(anchor).length!==2)throw Error('R1094 commitment route changed');
 const endpoint=[
  marker,
  "if(req.method==='GET'&&url.pathname==='/api/rental/print-handovers'){",
  " const shop=await equipmentRentalCurrentShop(a);",
  " if(!shop)return sendJson(res,401,{error:'rental_auth_required'});",
  " await ensureEquipmentRentalAssetTrackingSchema();",
  " const q=await pool.query(`SELECT id,shop_id,status,handover_serials_recorded_at,updated_at,",
  " COALESCE(customer_name,'') customer_name",
  " FROM equipment_rental_bookings",
  " WHERE shop_id=$1 AND status='picked_up' AND handover_serials_recorded_at IS NOT NULL",
  " AND handover_serials_recorded_at >= now()-interval '48 hours'",
  " ORDER BY handover_serials_recorded_at DESC LIMIT 150`,[shop.id]);",
  " res.setHeader('Cache-Control','no-store');",
  " return sendJson(res,200,{shopId:shop.id,bookings:q.rows});",
  "}",
  ""
 ].join('\n');
 src=src.replace(anchor,endpoint+anchor);
}
const old='<title>برگه واگذاری تجهیزات تصویربرداری به صورت امانی</title>';
const next='<title>تعهدنامه واگذاری تجهیزات تصویربرداری به صورت امانی</title>';
if(src.includes(old))src=src.replace(old,next);
else if(!src.includes(next))throw Error('R1094 commitment title changed');
if(src.split(marker).length!==2||src.split(next).length!==2)throw Error('R1094 duplicate marker');
fs.writeFileSync(file,src,'utf8');
console.log('[PB R1094] authenticated recent mobile handovers feed and Windows print-compatible document');
