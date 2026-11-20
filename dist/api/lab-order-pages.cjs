'use strict';
// R1921 lab-only server-side queue paging. Never enumerate every completed order
// or perform full history joins for more than the ten selected order ids.
const PAGE_SIZE=10;
const VALID_TABS=new Set(['flow','ready','completed']);
function conditions(tab,search){
 const state=tab==='ready'?"o.status='ready'":tab==='completed'?"o.status='completed'":"o.status NOT IN ('uploading','cancelled','ready','completed')";
 return `o.lab_id=$1 AND COALESCE(o.source,'')<>'manual_invoice' AND COALESCE(o.mode,'print')=$2 AND ${state}
 AND NOT EXISTS (SELECT 1 FROM lab_hidden_order_cards h WHERE h.lab_id=o.lab_id AND h.order_id=o.id)
 AND ($3='' OR CAST(o.number AS text) ILIKE '%'||$3||'%' OR COALESCE(o.walkin_customer_name,u.name,'') ILIKE '%'||$3||'%' OR COALESCE(o.walkin_customer_mobile,u.mobile,'') ILIKE '%'||$3||'%' OR EXISTS(SELECT 1 FROM invoices i2 WHERE i2.order_id=o.id AND i2.lab_id=$1 AND CAST(i2.number AS text) ILIKE '%'||$3||'%'))`;
}
const detailedSql=`SELECT o.*,COALESCE(o.walkin_customer_name,u.name) customer_name,u.email customer_email,COALESCE(o.walkin_customer_mobile,u.mobile) customer_mobile,u.location_lat,u.location_lng,
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
        FROM orders o JOIN users u ON u.id=o.customer_id
        LEFT JOIN invoices i ON i.order_id=o.id
        LEFT JOIN order_payment_receipts r ON r.order_id=o.id
        LEFT JOIN order_courier_shipments cs ON cs.order_id=o.id AND cs.provider='snappbox'
        WHERE o.lab_id=$1 AND o.id=ANY($2::uuid[])
        ORDER BY o.created_at DESC,o.id DESC`;
async function pageLabOrders(pool,labId,query){
 const tab=String(query.get('tab')||'flow');
 if(!VALID_TABS.has(tab))return{error:'invalid_tab',status:400};
 const mode=query.get('mode')==='album'?'album':'print';
 const search=String(query.get('q')||'').trim().slice(0,100);
 const n=Number(query.get('page')||1);
 if(!Number.isSafeInteger(n)||n<1||n>100000)return{error:'invalid_page',status:400};
 const where=conditions(tab,search),params=[labId,mode,search];
 const totalsSql=`SELECT count(*)::int AS total FROM orders o JOIN users u ON u.id=o.customer_id WHERE ${where}`;
 const total=Number((await pool.query(totalsSql,params)).rows[0]?.total||0);
 const pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
 const page=Math.min(n,pages);
 const ids=await pool.query(`SELECT o.id FROM orders o JOIN users u ON u.id=o.customer_id WHERE ${where} ORDER BY o.created_at DESC,o.id DESC LIMIT $4 OFFSET $5`,[...params,PAGE_SIZE,(page-1)*PAGE_SIZE]);
 if(!ids.rows.length)return{orders:[],total,page,pages,pageSize:PAGE_SIZE,tab,mode,search};
 const orderIds=ids.rows.map(row=>row.id);
 const details=await pool.query(detailedSql,[labId,orderIds]);
 return{orders:details.rows,total,page,pages,pageSize:PAGE_SIZE,tab,mode,search};
}
module.exports={pageLabOrders,conditions,PAGE_SIZE};
