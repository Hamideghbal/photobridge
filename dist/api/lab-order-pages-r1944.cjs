'use strict';
// R1944: only the ten selected IDs are enriched with file/invoice/history subqueries.
// Search and totals are database-backed, never limited to the latest 300 orders.
const allowedStages=new Set(['flow','ready','completed']);
function stageFilter(stage,alias='o'){
 if(stage==='ready')return alias+".status='ready'";
 if(stage==='completed')return alias+".status='completed'";
 return alias+".status NOT IN ('ready','completed')";
}
function params(url){
 const stage=String(url.searchParams.get('stage')||'flow');
 if(!allowedStages.has(stage))throw Object.assign(Error('invalid_stage'),{status:400});
 const mode=String(url.searchParams.get('mode')||'print');
 if(!['print','album'].includes(mode))throw Object.assign(Error('invalid_mode'),{status:400});
 const page=Math.max(1,Math.min(100000,Math.trunc(Number(url.searchParams.get('page')||1))||1));
 const search=String(url.searchParams.get('q')||'').trim().slice(0,100);
 return {stage,mode,page,search,limit:10,offset:(page-1)*10};
}
// This is read-only: no hidden-order table, no migration or invoice mutation.
const visible="o.lab_id=$1 AND COALESCE(o.mode,'print')=$2 AND o.status NOT IN ('uploading','cancelled') AND COALESCE(o.source,'')<>'manual_invoice'";
const searchSql="($3='' OR o.number::text ILIKE ('%'||$3||'%') OR COALESCE(u.name,'') ILIKE ('%'||$3||'%') OR COALESCE(o.walkin_customer_name,'') ILIKE ('%'||$3||'%') OR COALESCE(o.walkin_customer_mobile,u.mobile,'') ILIKE ('%'||$3||'%') OR EXISTS(SELECT 1 FROM invoices ii WHERE ii.order_id=o.id AND ii.lab_id=o.lab_id AND ii.number::text ILIKE ('%'||$3||'%') ) OR EXISTS(SELECT 1 FROM order_files ff WHERE ff.order_id=o.id AND COALESCE(ff.original_name,'') ILIKE ('%'||$3||'%')))";
const listSQL=`WITH page_ids AS MATERIALIZED (
 SELECT o.id FROM orders o JOIN users u ON u.id=o.customer_id
 WHERE ${visible} AND ${searchSql} AND ${stageFilter('__STAGE__')}
 ORDER BY o.created_at DESC,o.id DESC LIMIT $4 OFFSET $5
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
        FROM page_ids pg JOIN orders o ON o.id=pg.id JOIN users u ON u.id=o.customer_id
        LEFT JOIN invoices i ON i.order_id=o.id
        LEFT JOIN order_payment_receipts r ON r.order_id=o.id
        LEFT JOIN order_courier_shipments cs ON cs.order_id=o.id AND cs.provider='snappbox'
        WHERE o.lab_id=$1 AND o.status NOT IN ('uploading','cancelled') AND COALESCE(o.source,'')<>'manual_invoice'
        ORDER BY o.created_at DESC,o.id DESC`;
const countSQL=`SELECT
 count(*) FILTER(WHERE o.status NOT IN ('ready','completed'))::int AS flow,
 count(*) FILTER(WHERE o.status='ready')::int AS ready,
 count(*) FILTER(WHERE o.status='completed')::int AS completed
 FROM orders o JOIN users u ON u.id=o.customer_id
 WHERE ${visible} AND ${searchSql}`;
// R1944: count across all matching records; enrich ONLY the requested ten IDs.
async function listLabOrdersPage(pool,labId,url){
 const {stage,mode,page,search,limit}=params(url);
 const values=[labId,mode,search];
 const countsResult=await pool.query(countSQL,values);
 const counts=countsResult.rows[0]||{flow:0,ready:0,completed:0};
 const totals={flow:Number(counts.flow||0),ready:Number(counts.ready||0),completed:Number(counts.completed||0)};
 const total=totals[stage];
 const pages=Math.max(1,Math.ceil(total/limit));
 const selectedPage=Math.min(page,pages);
 const sql=listSQL.replace("o.status NOT IN ('ready','completed')",stageFilter(stage));
 const items=await pool.query(sql,[...values,limit,(selectedPage-1)*limit]);
 return {orders:items.rows,counts:totals,total,page:selectedPage,pageSize:limit,pages,stage,mode,query:search};
}
module.exports={listLabOrdersPage,params,stageFilter,PAGE_SIZE:10};
