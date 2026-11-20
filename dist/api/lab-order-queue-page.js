'use strict';
// R1921: 10-row SQL-side pagination, no full-queue load. No database migration.
// Legacy receipts/invoices and all order files remain immutable when an order is
// hidden from the lab's *working queue*. Status is never rewritten by hiding.
const HIDE='lab_queue_hidden',RESTORE='lab_queue_visible';
const visible="COALESCE((SELECT e.status FROM order_status_events e WHERE e.order_id=o.id AND e.lab_id=o.lab_id AND e.status IN ('lab_queue_hidden','lab_queue_visible') ORDER BY e.id DESC LIMIT 1),'lab_queue_visible')<>'lab_queue_hidden'";
const common=`o.lab_id=$1 AND o.mode=$2 AND o.status NOT IN ('uploading','cancelled') AND COALESCE(o.source,'')<>'manual_invoice' AND ${visible} AND ($3='' OR o.number::text ILIKE '%'||$3||'%' OR COALESCE(o.walkin_customer_name,u.name,'') ILIKE '%'||$3||'%' OR COALESCE(o.walkin_customer_mobile,u.mobile,'') ILIKE '%'||$3||'%' OR EXISTS(SELECT 1 FROM invoices si WHERE si.order_id=o.id AND si.lab_id=o.lab_id AND si.number::text ILIKE '%'||$3||'%'))`;
const stage=`($5='ready' AND o.status='ready' OR $5='completed' AND o.status='completed' OR $5='flow' AND o.status NOT IN ('ready','completed'))`;
const pageSql=`WITH paged AS (
 SELECT o.* FROM orders o JOIN users u ON u.id=o.customer_id
 WHERE ${common} AND (${stage})
 ORDER BY o.created_at DESC,o.id DESC LIMIT 10 OFFSET $4
)
SELECT o.*,COALESCE(o.walkin_customer_name,u.name) customer_name,u.email customer_email,COALESCE(o.walkin_customer_mobile,u.mobile) customer_mobile,u.location_lat,u.location_lng,
        (SELECT count(*)::int FROM order_files f WHERE f.order_id=o.id) file_count,
        (SELECT coalesce(sum(f.bytes),0)::bigint FROM order_files f WHERE f.order_id=o.id) total_bytes,
        (SELECT count(*)::int FROM order_files f WHERE f.order_id=o.id AND f.crop_handling='lab') crop_delegated_count,
        (CASE WHEN o.mode='album' THEN
          CASE WHEN (o.album_data->'pricing'->>'manualRequired')='true' THEN
            CASE WHEN NULLIF(o.album_data->'pricing'->>'manualAlbumPrice','') IS NOT NULL THEN 0 ELSE
              (CASE WHEN COALESCE((NULLIF(o.album_data->'pricing'->>'manualPrintRequired',''))::boolean,true) AND NULLIF(o.album_data->'pricing'->>'manualPrintPrice','') IS NULL THEN 1 ELSE 0 END)
              + (CASE WHEN COALESCE((NULLIF(o.album_data->'pricing'->>'manualBindingRequired',''))::boolean,COALESCE((o.album_data->'size'->>'custom')::boolean,false)) AND NULLIF(o.album_data->'pricing'->>'manualBindingPrice','') IS NULL THEN 1 ELSE 0 END)
              + (CASE WHEN COALESCE((NULLIF(o.album_data->'pricing'->>'manualCoverRequired',''))::boolean,COALESCE((o.album_data->'size'->>'custom')::boolean,false)) AND NULLIF(o.album_data->'pricing'->>'manualCoverPrice','') IS NULL THEN 1 ELSE 0 END)
            END ELSE 0 END
        ELSE
          (SELECT count(DISTINCT (f.print_size_id||'|'||COALESCE(f.print_type,'')))::int
            FROM order_files f
            LEFT JOIN lab_prices p ON p.lab_id=f.lab_id AND p.size_id=f.print_size_id
            LEFT JOIN walkin_prices wp ON wp.lab_id=f.lab_id AND wp.size_id=f.print_size_id
            LEFT JOIN order_invoice_price_overrides op ON op.order_id=f.order_id AND op.lab_id=f.lab_id AND op.size_id=f.print_size_id AND op.print_type=f.print_type
            WHERE f.order_id=o.id AND f.original_state<>'deleted'
              AND (CASE f.print_type
                WHEN 'luster' THEN CASE WHEN o.source='walkin' THEN wp.luster ELSE p.luster END
                WHEN 'silk' THEN CASE WHEN o.source='walkin' THEN wp.silk ELSE p.silk END
                WHEN 'metallic' THEN CASE WHEN o.source='walkin' THEN wp.metallic ELSE p.metallic END
                ELSE NULL END) IS NULL
              AND op.unit_price IS NULL)
        END) invoice_pricing_missing_count,
        i.id invoice_id,i.number invoice_number,i.total invoice_total,i.issued_at invoice_issued_at,i.pdf_ready invoice_pdf_ready,
        r.id receipt_id,r.status receipt_status,r.original_name receipt_name,r.submitted_at receipt_submitted_at,r.review_note receipt_review_note,
        cs.id courier_shipment_id,cs.provider courier_provider,cs.provider_ref_id courier_ref_id,cs.provider_order_id courier_order_id,cs.delivery_category courier_delivery_category,cs.quoted_price courier_quoted_price,cs.status courier_status,cs.payer courier_payer,cs.driver_name courier_driver_name,cs.driver_phone courier_driver_phone,cs.vehicle_plate courier_vehicle_plate,cs.photographer_alert_ack_at courier_alert_ack_at,cs.updated_at courier_updated_at,
        COALESCE((SELECT json_agg(json_build_object('status',e.status,'note',e.note,'created_at',e.created_at) ORDER BY e.created_at)
          FROM order_status_events e WHERE e.order_id=o.id),'[]'::json) status_history
        FROM paged o JOIN users u ON u.id=o.customer_id
        LEFT JOIN invoices i ON i.order_id=o.id
        LEFT JOIN order_payment_receipts r ON r.order_id=o.id
        LEFT JOIN order_courier_shipments cs ON cs.order_id=o.id AND cs.provider='snappbox'
        ORDER BY o.created_at DESC,o.id DESC`;
const countSql=`SELECT
 count(*) FILTER (WHERE o.status='ready')::int AS ready,
 count(*) FILTER (WHERE o.status='completed')::int AS completed,
 count(*) FILTER (WHERE o.status NOT IN ('ready','completed'))::int AS flow
 FROM orders o JOIN users u ON u.id=o.customer_id WHERE ${common}`;
function pageParams(url){
 const mode=url.searchParams.get('mode')==='album'?'album':'print',tab=['flow','ready','completed'].includes(url.searchParams.get('tab'))?url.searchParams.get('tab'):'flow';
 const raw=Number(url.searchParams.get('page')||'1');
 const page=Number.isSafeInteger(raw)?Math.min(100000,Math.max(1,raw)):1;
 return{mode,tab,page,q:String(url.searchParams.get('q')||'').trim().slice(0,100)};
}
async function pageLabOrders(pool,labId,url){
 const {mode,tab,q,page:requested}=pageParams(url);
 const counts=(await pool.query(countSql,[labId,mode,q])).rows[0]||{flow:0,ready:0,completed:0};
 const safeCounts={flow:Number(counts.flow||0),ready:Number(counts.ready||0),completed:Number(counts.completed||0)};
 const total=safeCounts[tab],pages=Math.max(1,Math.ceil(total/10)),page=Math.min(requested,pages);
 const result=await pool.query(pageSql,[labId,mode,q,(page-1)*10,tab]);
 return {orders:result.rows,page,pages,pageSize:10,total,counts:safeCounts,mode,tab};
}
async function setQueueHidden(pool,{labId,actorId,orderId,hidden}){
 const c=await pool.connect();try{
  await c.query('BEGIN');
  const o=await c.query(`SELECT id,customer_id,status FROM orders WHERE id=$1 AND lab_id=$2 AND status<>'uploading' FOR UPDATE`,[orderId,labId]);
  if(!o.rowCount){await c.query('ROLLBACK');return{status:404,error:'order_not_found'};}
  const ev=await c.query(`SELECT status FROM order_status_events WHERE order_id=$1 AND lab_id=$2 AND status IN ('lab_queue_hidden','lab_queue_visible') ORDER BY id DESC LIMIT 1`,[orderId,labId]);
  const wasHidden=ev.rows[0]?.status===HIDE;
  if(wasHidden!==hidden)await c.query(`INSERT INTO order_status_events(order_id,lab_id,customer_id,status,note,actor_id) VALUES($1,$2,$3,$4,$5,$6)`,[orderId,labId,o.rows[0].customer_id,hidden?HIDE:RESTORE,hidden?'فقط از صف کاری لابراتوار مخفی شد؛ سوابق و فاکتور محفوظ است.':'بازگرداندن به صف کاری لابراتوار',actorId]);
  await c.query('COMMIT');
  return{status:200,ok:true,hidden,orderId};
 }catch(error){await c.query('ROLLBACK').catch(()=>{});throw error;}finally{c.release();}
}
export{pageLabOrders,setQueueHidden,pageParams};
