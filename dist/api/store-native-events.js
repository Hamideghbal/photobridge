const cameraCategories=['equipment_rental','equipment_sale','equipment_rental_sale'];
export const isCameraStore=shop=>Boolean(shop&&cameraCategories.includes(String(shop.business_category||'equipment_rental_sale')));
export async function ensureStoreNativeEvents(pool){
 const client=await pool.connect();
 try{await client.query('BEGIN');await client.query("SELECT pg_advisory_xact_lock(2095)");
 await client.query(`
 CREATE TABLE IF NOT EXISTS pb2095_store_events(
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
   kind text NOT NULL,entity_id uuid NOT NULL,customer text NOT NULL DEFAULT '',status text NOT NULL DEFAULT '',
   payment text NOT NULL DEFAULT '',detail text NOT NULL DEFAULT '',created_at timestamptz NOT NULL DEFAULT now()
 );
 CREATE INDEX IF NOT EXISTS pb2095_store_events_shop_idx ON pb2095_store_events(shop_id,created_at,id);
 CREATE TABLE IF NOT EXISTS pb2095_store_event_reads(
   event_id uuid NOT NULL REFERENCES pb2095_store_events(id) ON DELETE CASCADE,
   user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,read_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(event_id,user_id)
 );
 CREATE OR REPLACE FUNCTION pb2095_record_store_event() RETURNS trigger LANGUAGE plpgsql AS $$
 DECLARE n jsonb; o jsonb; k text; customer_name text; new_status text; new_payment text; detail_text text;
 BEGIN
   IF TG_OP='DELETE' THEN n=to_jsonb(OLD); ELSE n=to_jsonb(NEW); END IF;
   IF NOT EXISTS(SELECT 1 FROM equipment_rental_shops WHERE id=(n->>'shop_id')::uuid AND coalesce(business_category,'equipment_rental_sale') IN ('equipment_rental','equipment_sale','equipment_rental_sale')) THEN
     IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
   END IF;
   new_status=coalesce(n->>'status','');new_payment=coalesce(n->>'payment_status','');
   IF TG_OP='UPDATE' THEN
     o=to_jsonb(OLD);
     IF (n->>'status') IS NOT DISTINCT FROM (o->>'status')
       AND (n->>'payment_status') IS NOT DISTINCT FROM (o->>'payment_status')
       AND (n->>'rental_start') IS NOT DISTINCT FROM (o->>'rental_start')
       AND (n->>'rental_end') IS NOT DISTINCT FROM (o->>'rental_end') THEN RETURN NEW; END IF;
   END IF;
   k=CASE TG_TABLE_NAME WHEN 'equipment_rental_bookings' THEN 'booking' WHEN 'equipment_sale_orders' THEN 'sale' ELSE 'cooperation' END;
   customer_name=coalesce(nullif(n->>'customer_name',''),nullif(n->>'buyer_name',''),'');
   IF customer_name='' AND n->>'photographer_id' IS NOT NULL THEN SELECT coalesce(name,'') INTO customer_name FROM users WHERE id=(n->>'photographer_id')::uuid; END IF;
   detail_text=CASE WHEN k='booking' THEN concat_ws(' تا ',n->>'rental_start',n->>'rental_end') ELSE '' END;
   IF TG_OP='DELETE' THEN k=k||'_deleted';
   ELSIF TG_OP='INSERT' THEN k=k||'_new';
   ELSIF (n->>'status') IS DISTINCT FROM (o->>'status') THEN k=k||'_status';
   ELSIF (n->>'payment_status') IS DISTINCT FROM (o->>'payment_status') THEN k=k||'_payment';
   ELSE k=k||'_edited'; END IF;
   INSERT INTO pb2095_store_events(shop_id,kind,entity_id,customer,status,payment,detail)
   VALUES((n->>'shop_id')::uuid,k,(n->>'id')::uuid,left(coalesce(customer_name,''),150),left(new_status,60),left(new_payment,60),left(detail_text,150));
   IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
 END $$;
 `);
 for(const table of ['equipment_rental_bookings','equipment_sale_orders','equipment_rental_collaboration_requests']){
   await client.query('DROP TRIGGER IF EXISTS pb2095_store_event ON '+table);
   await client.query('CREATE TRIGGER pb2095_store_event AFTER INSERT OR UPDATE OR DELETE ON '+table+' FOR EACH ROW EXECUTE FUNCTION pb2095_record_store_event()');
 }
 await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
const state={pending_approval:'منتظر تأیید',payment_pending:'منتظر پرداخت',reserved:'رزرو قطعی',picked_up:'تحویل تجهیزات',returned:'عودت تجهیزات',rejected:'رد شده',cancelled:'لغو شده',pending:'منتظر تأیید',confirmed:'تأیید شده',completed:'تکمیل شده',approved:'تأیید همکاری',paid:'پرداخت شده',refunded:'مبلغ برگشت داده شد',unpaid:'پرداخت نشده'};
export function eventView(row){
 const [kind,action]=String(row.kind).split('_'),label={booking:'آفیش تجهیزات',sale:'سفارش فروش',cooperation:'درخواست همکاری'}[kind]||'رویداد فروشگاه';
 const title=action==='new'?label+' جدید':action==='deleted'?label+' حذف شد':action==='payment'?'وضعیت پرداخت '+label+' تغییر کرد':action==='edited'?label+' ویرایش شد':row.status==='cancelled'?label+' لغو شد':label+' · '+(state[row.status]||'تغییر وضعیت');
 return {id:String(row.id),title,message:[row.customer||'عکاس',action==='payment'?state[row.payment]:state[row.status],row.detail].filter(Boolean).join(' · '),target:{booking:'bookings',sale:'sales',cooperation:'photographers'}[kind],created_at:row.created_at};
}
export async function storeNativeNotificationRoute({req,url,res,a,pool,shopFor,sendJson,bodyJson}){
 const read=url.pathname==='/api/rental/notifications/desktop/read',list=url.pathname==='/api/rental/notifications/desktop';if(!read&&!list)return false;
 const shop=await shopFor(a);
 if(a?.adminStorePreview||a?.rentalRole!=='shop_admin'||!isCameraStore(shop)||!a?.userId){sendJson(res,403,{error:'forbidden'});return true}
 const member=await pool.query("SELECT 1 FROM equipment_rental_shop_memberships WHERE shop_id=$1 AND user_id=$2 AND role='shop_admin' AND active=true LIMIT 1",[shop.id,a.userId]);
 if(!member.rowCount){sendJson(res,403,{error:'forbidden'});return true}
 if(list&&req.method==='GET'){
   const limit=Math.max(1,Math.min(200,Math.floor(Number(url.searchParams.get('limit'))||200)));
   const q=await pool.query("SELECT e.* FROM pb2095_store_events e WHERE e.shop_id=$1 AND NOT EXISTS(SELECT 1 FROM pb2095_store_event_reads r WHERE r.event_id=e.id AND r.user_id=$2) ORDER BY e.created_at,e.id LIMIT $3",[shop.id,a.userId,limit]);
   sendJson(res,200,{shopId:String(shop.id),notifications:q.rows.map(eventView)});return true;
 }
 if(read&&req.method==='POST'){
   const b=await bodyJson(req,16000),ids=(Array.isArray(b.ids)?b.ids:[]).map(String).filter(id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)).slice(0,200);
   if(ids.length)await pool.query("INSERT INTO pb2095_store_event_reads(event_id,user_id) SELECT id,$2 FROM pb2095_store_events WHERE shop_id=$1 AND id=ANY($3::uuid[]) ON CONFLICT DO NOTHING",[shop.id,a.userId,ids]);
   sendJson(res,200,{ok:true});return true;
 }
 sendJson(res,405,{error:'method_not_allowed'});return true;
}
