import crypto from 'node:crypto';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail=(code,status=409,detail={})=>{throw Object.assign(new Error(code),{syncStatus:status,detail})};
const iso=x=>x instanceof Date?x.toISOString():x?String(x):null;
const validMoney=x=>Number.isSafeInteger(x)&&x>=0&&x<=1e12;
const TABLES={items:'equipment_rental_items',saleItems:'equipment_sale_items',bookings:'equipment_rental_bookings',invoices:'equipment_rental_invoices',entries:'equipment_rental_accounting_entries',shortages:'equipment_rental_booking_shortages',saleOrders:'equipment_sale_orders'};
export function createStoreDesktopSync(d){
 const {pool,shopFor,sendJson,bodyJson}=d;
 return async function(req,res,url,a){
  if(!url.pathname.startsWith('/api/rental/desktop/'))return false;
  const shop=await shopFor(a);if(!shop){sendJson(res,401,{error:'rental_auth_required'});return true}
  if(req.method==='GET'&&url.pathname==='/api/rental/desktop/snapshot'){
   // One repeatable-read snapshot, including all history, never the portal's limited lists.
   const operationIds=String(url.searchParams.get('operations')||'').split(',').filter(x=>UUID.test(x)).slice(0,100);const meta=await d.overview(shop.id),c=await pool.connect();
   try{await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');const entities={};
    for(const [name,table]of Object.entries(TABLES)){
     // Keep inactive inventory editable, but never restore deleted items or historical
     // SOFIA-DEMO rows to a desktop snapshot. The main rental overview already applies
     // these filters; Windows must see the very same store inventory.
     const inventory=name==='items'||name==='saleItems';
     const sql=inventory
      ? `SELECT * FROM ${table} WHERE shop_id=$1 AND deleted_at IS NULL AND (sku IS NULL OR sku NOT ILIKE 'SOFIA-DEMO-%') ORDER BY id`
      : `SELECT * FROM ${table} WHERE shop_id=$1 ORDER BY id`;
     entities[name]=(await c.query(sql,[shop.id])).rows;
    }
    entities.bookingItems=(await c.query('SELECT i.* FROM equipment_rental_booking_items i JOIN equipment_rental_bookings b ON b.id=i.booking_id WHERE b.shop_id=$1 ORDER BY i.id',[shop.id])).rows;
    entities.photographers=(await c.query(`SELECT u.id,u.id user_id,COALESCE(p.studio_name,u.name) name,u.mobile,m.active,m.settlement_mode,m.permanent_discount_percent FROM equipment_rental_shop_memberships m JOIN users u ON u.id=m.user_id LEFT JOIN photographer_profiles p ON p.user_id=u.id WHERE m.shop_id=$1 AND m.role='photographer'`,[shop.id])).rows;
    entities.accountingMarks=(await c.query("SELECT document_id,recorded,recorded_at FROM external_accounting_marks WHERE owner_type='rental' AND owner_id=$1 AND document_type='invoice'",[shop.id])).rows;
    entities.shop=(await c.query('SELECT * FROM equipment_rental_shops WHERE id=$1',[shop.id])).rows;
    const receipts=operationIds.length?(await c.query('SELECT operation_id,payload_hash,result FROM equipment_store_desktop_operations WHERE shop_id=$1 AND operation_id=ANY($2::uuid[])',[shop.id,operationIds])).rows.map(x=>({operationId:x.operation_id,payloadHash:x.payload_hash,result:x.result})):[];await c.query('COMMIT');sendJson(res,200,{protocol:1,shopId:shop.id,serverTime:new Date().toISOString(),entities,meta,receipts});
   }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}return true;
  }
  if(req.method!=='POST'||url.pathname!=='/api/rental/desktop/operation'){sendJson(res,404,{error:'not_found'});return true}
  const op=await bodyJson(req,1000000);if(!UUID.test(String(op.id))||!UUID.test(String(op.deviceId))||!UUID.test(String(op.entityId))){sendJson(res,400,{error:'invalid_desktop_operation'});return true}
  const hash=crypto.createHash('sha256').update(JSON.stringify(op)).digest('hex'),c=await pool.connect();
  try{
   await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',['equipment-rental:'+shop.id]);
   const prior=(await c.query('SELECT payload_hash,result FROM equipment_store_desktop_operations WHERE shop_id=$1 AND operation_id=$2',[shop.id,op.id])).rows[0];
   if(prior){if(prior.payload_hash!==hash)fail('operation_id_reused',409);await c.query('COMMIT');sendJson(res,200,{...prior.result,replayed:true});return true}
   const idMap=Object.fromEntries((await c.query('SELECT local_id,server_id FROM equipment_store_desktop_ids WHERE shop_id=$1',[shop.id])).rows.map(x=>[x.local_id,x.server_id]));
   const map=x=>typeof x==='string'?(idMap[x]||x):Array.isArray(x)?x.map(map):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,map(v)])):x;
   const p=map(op.payload||{}),id=map(op.entityId),table=TABLES[op.entity],mapping={};let row=null;
   const actions={'booking.create':['bookings'],'booking.status':['bookings'],'entry.create':['entries'],'item.create':['items','saleItems'],'item.update':['items','saleItems'],'item.delete':['items','saleItems'],'shortage.update':['shortages']};if(!actions[op.action]?.includes(op.entity))fail('invalid_action_entity',400);
   if(!table)fail('unsupported_desktop_entity',400);
   if(!op.action.endsWith('.create')){
    row=(await c.query(`SELECT * FROM ${table} WHERE id=$1 AND shop_id=$2 FOR UPDATE`,[id,shop.id])).rows[0];if(!row)fail('record_not_found');
    let expected=op.baseRevision;
    if(op.baseOperation){const base=(await c.query('SELECT result FROM equipment_store_desktop_operations WHERE shop_id=$1 AND operation_id=$2',[shop.id,op.baseOperation])).rows[0];if(!base)fail('dependency_pending');expected=base.result.revision}
    if(expected===null||expected===undefined||String(row.desktop_revision)!==String(expected))fail('record_changed_on_server',409,{serverRecord:row});
   }
   if(op.action==='booking.create'){
    if(!Array.isArray(p.items)||!p.items.length||p.items.length>500)fail('invalid_items',400);
    if(p.photographerId){const member=await c.query("SELECT 1 FROM equipment_rental_shop_memberships WHERE shop_id=$1 AND user_id=$2 AND active=true AND role='photographer'",[shop.id,p.photographerId]);if(!member.rowCount)fail('photographer_not_member')}
    if(!p.photographerId&&p.photographerMobile){const person=await d.preRegister(c,shop.id,p.photographerMobile,p.customerName||'عکاس');if(person){p.photographerId=person.id;if(p.localPhotographerId){if(!UUID.test(p.localPhotographerId))fail('invalid_photographer',400);mapping[p.localPhotographerId]=person.id;await c.query('INSERT INTO equipment_store_desktop_ids(shop_id,local_id,server_id,entity) VALUES($1,$2,$3,$4)',[shop.id,p.localPhotographerId,person.id,'photographers'])}}}
    const out=await d.createBooking(c,{shopId:shop.id,photographerId:p.photographerId||null,customerName:p.customerName||'عکاس',customerMobile:p.photographerMobile||null,startDate:p.startDate,endDate:p.endDate,items:p.items,notes:p.notes||null,createdBy:a.userId,allowShortage:true});
    if(out.error)fail(out.error,409,{availability:out.availability});
    if(!validMoney(p.expectedTotal)||Number(out.totalAmount)!==p.expectedTotal)fail('booking_price_changed',409,{serverTotal:out.totalAmount,localTotal:p.expectedTotal});
    mapping[op.entityId]=out.id;await c.query('INSERT INTO equipment_store_desktop_ids(shop_id,local_id,server_id,entity) VALUES($1,$2,$3,$4)',[shop.id,op.entityId,out.id,'bookings']);
    row=(await c.query('SELECT * FROM equipment_rental_bookings WHERE id=$1',[out.id])).rows[0];
    const shortages=(await c.query('SELECT id,item_id FROM equipment_rental_booking_shortages WHERE booking_id=$1',[out.id])).rows;for(const local of p.shortages||[]){const remote=shortages.find(x=>x.item_id===local.item_id);if(remote&&UUID.test(local.id)){mapping[local.id]=remote.id;await c.query('INSERT INTO equipment_store_desktop_ids(shop_id,local_id,server_id,entity) VALUES($1,$2,$3,$4)',[shop.id,local.id,remote.id,'shortages'])}}
   }else if(op.action==='booking.status'){
    const next=p.status,allowed={picked_up:['reserved'],returned:['picked_up'],cancelled:['reserved','payment_pending','pending_approval'],rejected:['pending_approval']};
    if(!allowed[next]?.includes(row.status))fail('invalid_rental_transition');
    if(next==='cancelled'&&row.payment_status==='paid')await d.refund(c,row);
    if(next==='cancelled'||next==='rejected'){
     await d.clearDraft(c,id);if(next==='cancelled')await c.query("DELETE FROM equipment_rental_accounting_entries WHERE booking_id=$1 AND entry_type='payment'",[id]);await c.query("DELETE FROM equipment_rental_booking_shortages WHERE booking_id=$1 AND status<>'provided' AND resolved_at IS NULL",[id]);await c.query("UPDATE equipment_rental_booking_shortages SET booking_cancelled_at=now(),external_cancellation_acknowledged_at=NULL WHERE booking_id=$1",[id]);
    }
    let delta=0,note='';if(next==='returned'&&p.invoiceAdjustment){delta=p.invoiceAdjustment.amount;note=String(p.invoiceAdjustment.note||'').trim();if(!Number.isSafeInteger(delta)||Math.abs(delta)>1e12||!note||note.length>1000||Number(row.total_amount)+delta<0)fail('invalid_invoice_adjustment',400)}
    if(next==='returned'){
     await d.charge(c,id,a.userId);if(delta&&row.photographer_id)await c.query(`INSERT INTO equipment_rental_accounting_entries(shop_id,photographer_id,booking_id,entry_type,direction,amount,description,entry_date,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[shop.id,row.photographer_id,id,delta>0?'adjustment_debit':'adjustment_credit',delta>0?'debit':'credit',Math.abs(delta),'اصلاح برگشت: '+note,new Date(new Date(p.occurredAt).getTime()+12600000).toISOString().slice(0,10),a.userId]);
    }
    const occurred=new Date(p.occurredAt);if(!Number.isFinite(occurred.getTime())||occurred.getTime()>Date.now()+300000)fail('invalid_operation_time',400);
    const end=d.date(row.rental_end),day=new Date(end+'T12:00:00Z');day.setUTCDate(day.getUTCDate()+1);const deadline=new Date(day.toISOString().slice(0,10)+'T09:00:00+03:30'),kind=occurred>=deadline?'late':occurred.getTime()<deadline.getTime()-43200000?'early':'normal';
    row=(await c.query(`UPDATE equipment_rental_bookings SET status=$3,total_amount=total_amount+$4,invoice_adjustment_amount=CASE WHEN $3='returned' THEN $4 ELSE invoice_adjustment_amount END,invoice_adjustment_note=CASE WHEN $3='returned' THEN $5 ELSE invoice_adjustment_note END,returned_at=CASE WHEN $3='returned' THEN $6::timestamptz ELSE returned_at END,return_kind=CASE WHEN $3='returned' THEN $7 ELSE return_kind END,payment_status=CASE WHEN $3='cancelled' AND payment_status='paid' THEN 'refunded' WHEN $4>0 AND payment_status='paid' THEN 'not_required' ELSE payment_status END,updated_at=now() WHERE id=$1 AND shop_id=$2 RETURNING *`,[id,shop.id,next,delta,note||null,p.occurredAt,kind])).rows[0];
    if(['picked_up','returned'].includes(next))await d.invoice(c,id,a.userId);
   }else if(op.action==='entry.create'){
    const member=await c.query("SELECT 1 FROM equipment_rental_shop_memberships WHERE shop_id=$1 AND user_id=$2 AND role='photographer' AND active=true",[shop.id,p.photographerId]);if(!member.rowCount||!validMoney(p.amount)||p.amount===0)fail('invalid_accounting_entry',400);
    const types={payment:['payment','credit'],debit:['adjustment_debit','debit'],credit:['adjustment_credit','credit']},t=types[p.kind];if(!t)fail('invalid_accounting_kind',400);
    row=(await c.query(`INSERT INTO equipment_rental_accounting_entries(id,shop_id,photographer_id,entry_type,direction,amount,description,entry_date,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[id,shop.id,p.photographerId,...t,p.amount,String(p.note||'ثبت دستی').slice(0,1000),p.entryDate,a.userId])).rows[0];
   }else if(op.action==='item.create'||op.action==='item.update'){
    if(!['items','saleItems'].includes(op.entity))fail('invalid_entity',400);
    const fields=op.entity==='items'?['category','title','brand','model','daily_price','deposit_amount','stock_total','active','description','sku']:['category','title','brand','model','sale_price','stock_total','active','description','sku'];
    const values={};for(const key of fields)if(p[key]!==undefined)values[key]=p[key];
    if(!String(values.title||row?.title||'').trim())fail('item_title_required',400);for(const key of ['daily_price','deposit_amount','sale_price','stock_total'])if(key in values&&!validMoney(values[key]))fail('invalid_item_amount',400);
    if(op.entity==='items'&&values.stock_total===0)fail('invalid_item_stock',400);const keys=Object.keys(values),params=keys.map(k=>values[k]);if(op.action.endsWith('.create')){params.push(id,shop.id);row=(await c.query(`INSERT INTO ${table}(${keys.join(',')},id,shop_id) VALUES(${params.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING *`,params)).rows[0]}else{params.push(id,shop.id);row=(await c.query(`UPDATE ${table} SET ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')}${keys.length?',':''}updated_at=now() WHERE id=$${params.length-1} AND shop_id=$${params.length} RETURNING *`,params)).rows[0]}
   }else if(op.action==='item.delete'){row=(await c.query(`UPDATE ${table} SET active=false,deleted_at=now(),updated_at=now() WHERE id=$1 AND shop_id=$2 RETURNING *`,[id,shop.id])).rows[0];
   }else if(op.action==='shortage.update'){
    if(!['pending','provided'].includes(p.status))fail('invalid_shortage_status',400);
    row=(await c.query(`UPDATE equipment_rental_booking_shortages SET status=$3,resolution_note=$4,resolved_at=CASE WHEN $3='provided' THEN now() ELSE NULL END,resolved_by=CASE WHEN $3='provided' THEN $5::uuid ELSE NULL::uuid END,updated_at=now() WHERE id=$1 AND shop_id=$2 RETURNING *`,[id,shop.id,p.status,String(p.note||''),a.userId])).rows[0];
   }else fail('unsupported_offline_operation',400);
   const result={ok:true,id:row.id,updatedAt:iso(row.updated_at),revision:row.desktop_revision,mapping,entity:op.entity,record:row};
   await c.query('INSERT INTO equipment_store_desktop_operations(shop_id,operation_id,device_id,payload_hash,result) VALUES($1,$2,$3,$4,$5::jsonb)',[shop.id,op.id,op.deviceId,hash,JSON.stringify(result)]);
   await c.query('COMMIT');sendJson(res,200,result);
  }catch(e){await c.query('ROLLBACK');if(e.syncStatus)sendJson(res,e.syncStatus,{error:e.message,...e.detail});else throw e}finally{c.release()}return true;
 }
}
