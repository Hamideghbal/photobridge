// R1097 — fresh, shop-scoped counts for work that actually needs attention.
// Unlike /api/rental/overview this endpoint only returns counts; it runs on the
// existing authenticated store session, not across shops or photographer accounts.
import fs from 'node:fs';
const path='dist/api/server.js';
let source=fs.readFileSync(path,'utf8');
const marker='/* PB_R1097_SHOP_ATTENTION */';
const anchor="if (req.method === 'GET' && url.pathname === '/api/rental/live')";
if(!source.includes(marker)){
 if(source.split(anchor).length!==2)throw Error('[R1097] cannot find rental live endpoint anchor');
 const route=[
  marker,
  "if(req.method==='GET'&&url.pathname==='/api/rental/attention-counts'){",
  " const shop=await equipmentRentalCurrentShop(a);",
  " if(!shop)return sendJson(res,401,{error:'rental_auth_required'});",
  " await ensureEquipmentRentalReturnShortageSchema();",
  " const [booking,sale,collab,shortage,missing]=await Promise.all([",
  "  pool.query(`SELECT",
  "   count(*) FILTER (WHERE status='pending_approval')::int pending,",
  "   count(*) FILTER (WHERE status='reserved' AND rental_start<=(now() AT TIME ZONE 'Asia/Tehran')::date)::int handover_due,",
  "   count(*) FILTER (WHERE status='picked_up' AND rental_end<=(now() AT TIME ZONE 'Asia/Tehran')::date)::int return_due",
  "   FROM equipment_rental_bookings WHERE shop_id=$1`,[shop.id]),",
  "  pool.query(`SELECT count(*)::int total FROM equipment_sale_orders WHERE shop_id=$1 AND status='pending'`,[shop.id]),",
  "  pool.query(`SELECT count(*)::int total FROM equipment_rental_collaboration_requests WHERE shop_id=$1 AND status='pending'`,[shop.id]),",
  "  pool.query(`SELECT count(*)::int total FROM equipment_rental_booking_shortages WHERE shop_id=$1",
  "   AND ((COALESCE(status,'pending')<>'provided' AND resolved_at IS NULL AND booking_cancelled_at IS NULL)",
  "   OR (booking_cancelled_at IS NOT NULL AND external_cancellation_acknowledged_at IS NULL))`,[shop.id]),",
  "  pool.query(`SELECT count(*)::int total FROM equipment_rental_return_shortages WHERE shop_id=$1 AND status='missing' AND resolved_at IS NULL`,[shop.id])",
  " ]);",
  " res.setHeader('Cache-Control','no-store');",
  " return sendJson(res,200,{shopId:shop.id,counts:{pendingBookings:Number(booking.rows[0]?.pending||0),",
  " handoverDue:Number(booking.rows[0]?.handover_due||0),returnDue:Number(booking.rows[0]?.return_due||0),",
  " saleOrders:Number(sale.rows[0]?.total||0),collaborations:Number(collab.rows[0]?.total||0),",
  " rentalShortages:Number(shortage.rows[0]?.total||0),returnShortages:Number(missing.rows[0]?.total||0)}});",
  "}",
  ""
 ].join('\n');
 source=source.replace(anchor,route+anchor);
}
if(source.split(marker).length!==2)throw Error('[R1097] attention route duplicate');
fs.writeFileSync(path,source,'utf8');
console.log('[R1097] pending store actions served as shop-scoped, cache-disabled counts');
