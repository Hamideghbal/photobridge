// Optional, bounded first-page reads. The legacy endpoint remains unchanged
// unless pageSize is supplied. Authorization stays in the parent API handler.
import {noPrintOrderSql} from './no-print-workflow.js';
export const customerOrdersProjection=`__PB1848_DETAIL_SQL__`;
const DETAILS=customerOrdersProjection;
const LATEST=`SELECT id,status,mode,created_at FROM orders WHERE lab_id=$1 AND customer_id=$2 AND status NOT IN ('uploading','cancelled') AND COALESCE(source,'')<>'manual_invoice' ORDER BY created_at DESC,id DESC LIMIT 300`;
const MODE=`COALESCE(NULLIF(mode,''),'print')=$3`;
const VIEW=`CASE WHEN status='ready' THEN 'ready' WHEN status='needs_fix' THEN 'needs_fix' WHEN status='completed' THEN 'completed' ELSE 'flow' END=$4`;
export async function customerOrdersPage(pool,labId,userId,params){
 if(!params.has('pageSize'))return null;
 const limit=Number(params.get('pageSize')),offset=Number(params.get('offset')||0),view=params.get('view')||'flow',mode=params.get('mode')||'print';
 if(!Number.isInteger(limit)||limit<1||limit>100||!Number.isInteger(offset)||offset<0||offset>300||!['flow','ready','needs_fix','completed'].includes(view)||!['print','album'].includes(mode))return {status:400,body:{error:'invalid_orders_page'}};
 const args=[labId,userId,mode,view,limit,offset];
 const [orders,pay,summary]=await Promise.all([
  pool.query(`WITH latest AS (${LATEST}),page AS (SELECT id FROM latest WHERE ${MODE} AND ${VIEW} ORDER BY created_at DESC,id DESC LIMIT $5 OFFSET $6) ${DETAILS} WHERE o.id IN (SELECT id FROM page) ORDER BY o.created_at DESC,o.id DESC`,args),
  pool.query('SELECT payment_card_number,payment_iban,payment_account_holder FROM labs WHERE id=$1',[labId]),
  pool.query(`WITH latest AS (${LATEST}) SELECT count(*) FILTER (WHERE status NOT IN ('ready','needs_fix','completed'))::int flow,count(*) FILTER (WHERE status='ready')::int ready,count(*) FILTER (WHERE status='needs_fix')::int needs_fix,count(*) FILTER (WHERE status='completed')::int completed FROM latest WHERE ${MODE}`,[labId,userId,mode])
 ]);
 const counts=summary.rows[0],total=Number(counts[view]||0);
 return {status:200,body:{labId,orders:orders.rows,paymentSettings:pay.rows[0]||null,pagination:{limit,offset,hasMore:offset+limit<total,total,counts}}};
}
