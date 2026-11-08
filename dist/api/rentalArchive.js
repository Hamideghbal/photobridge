// Store archive: read-only, shop-scoped history, with server-side search and paging.
export async function serveStoreArchive({pool,res,shopId,searchParams,sendJson}) {
  const page=Math.max(1,Math.min(10000,Number.parseInt(searchParams.get('page')||'1',10)||1));
  const size=40;
  const search=String(searchParams.get('search')||'').trim().slice(0,100);
  const kind=['all','rental','sale'].includes(searchParams.get('kind'))?searchParams.get('kind'):'all';
  const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?v:null;
  const from=validDate(searchParams.get('from')),to=validDate(searchParams.get('to'));
  const sql=[
    "WITH records AS (",
    " SELECT 'rental'::text AS kind,b.id::text AS id,b.status::text AS status,",
    " COALESCE(pp.studio_name,u.name,b.customer_name,'عکاس')::text AS customer_name,COALESCE(u.mobile,b.customer_mobile,'')::text AS customer_mobile,",
    " COALESCE((SELECT string_agg(equipment_rental_display_name(i.category,i.brand,i.model,i.title,i.shop_id)||' ×'||bi.quantity::text,'، ' ORDER BY i.title) FROM equipment_rental_booking_items bi JOIN equipment_rental_items i ON i.id=bi.item_id WHERE bi.booking_id=b.id),'')::text AS item_titles,",
    " COALESCE((SELECT sum(bi.quantity) FROM equipment_rental_booking_items bi WHERE bi.booking_id=b.id),0)::int AS item_count,",
    " COALESCE(b.total_amount,0)::bigint AS total_amount,COALESCE(b.deposit_amount,0)::bigint AS deposit_amount,",
    " b.created_at,b.updated_at AS closed_at,b.rental_start::text AS start_date,b.rental_end::text AS end_date",
    " FROM equipment_rental_bookings b LEFT JOIN users u ON u.id=b.photographer_id LEFT JOIN photographer_profiles pp ON pp.user_id=u.id",
    " WHERE b.shop_id=$1 AND b.status='returned'",
    " UNION ALL",
    " SELECT 'sale'::text AS kind,o.id::text AS id,o.status::text AS status,",
    " COALESCE(pp.studio_name,u.name,o.buyer_name,'مشتری')::text AS customer_name,COALESCE(u.mobile,o.buyer_mobile,'')::text AS customer_mobile,",
    " equipment_rental_display_name(i.category,i.brand,i.model,i.title,i.shop_id)::text AS item_titles,",
    " COALESCE(o.quantity,0)::int AS item_count,COALESCE(o.total_amount,0)::bigint AS total_amount,0::bigint AS deposit_amount,",
    " o.created_at,o.updated_at AS closed_at,NULL::text AS start_date,NULL::text AS end_date",
    " FROM equipment_sale_orders o JOIN equipment_sale_items i ON i.id=o.sale_item_id",
    " LEFT JOIN users u ON u.id=o.buyer_user_id LEFT JOIN photographer_profiles pp ON pp.user_id=u.id",
    " WHERE o.shop_id=$1 AND (o.status='completed' OR o.production_stage='delivered')",
    "), filtered AS (",
    " SELECT * FROM records WHERE ($2::text='' OR customer_name ILIKE '%'||$2||'%' OR customer_mobile ILIKE '%'||$2||'%' OR item_titles ILIKE '%'||$2||'%' OR id ILIKE '%'||$2||'%')",
    " AND ($3::date IS NULL OR closed_at::date >= $3::date)",
    " AND ($4::date IS NULL OR closed_at::date <= $4::date)",
    " AND ($5::text='all' OR kind=$5::text)",
    ") SELECT *,COUNT(*) OVER()::int AS total_count FROM filtered",
    " ORDER BY closed_at DESC,created_at DESC,id DESC LIMIT $6 OFFSET $7"
  ].join('\n');
  const out=await pool.query(sql,[shopId,search,from,to,kind,size,(page-1)*size]);
  return sendJson(res,200,{orders:out.rows.map(({total_count,...row})=>row),total:Number(out.rows[0]?.total_count||0),page,pageSize:size});
}
