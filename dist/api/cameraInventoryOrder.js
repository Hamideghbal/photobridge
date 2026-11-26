// Camera-store inventory ordering and whole-item removal; preserve financial history.
const validId = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function cameraInventoryShop(shop){return Boolean(shop && !['frame','chassis','frame_chassis'].includes(shop.business_category));}
export function moveInventory(ids,id,target,before){
  if(!ids.includes(id)||!ids.includes(target)||id===target) throw Object.assign(new Error('inventory_item_not_found'),{status:409});
  const result=ids.filter(v=>v!==id);result.splice(result.indexOf(target)+(before?0:1),0,id);return result;
}
let ready;
export function ensureCameraInventoryOrder(pool){
  if(!ready)ready=(async()=>{
    for(const table of ['equipment_rental_items','equipment_sale_items'])await pool.query('ALTER TABLE '+table+' ADD COLUMN IF NOT EXISTS camera_display_order integer');
  })().catch(e=>{ready=null;throw e});
  return ready;
}
export async function cameraInventoryChange(pool,shop,b){
  const fail=(error,status=409)=>{throw Object.assign(new Error(error),{status})};
  if(!cameraInventoryShop(shop))fail('camera_inventory_only',403);
  if(!['items','sales'].includes(b?.scope)||!validId(b.id)||!['move','delete'].includes(b.action))fail('invalid_inventory_action',400);
  if(b.action==='move'&&(!validId(b.target)||typeof b.before!=='boolean'||b.id===b.target))fail('invalid_inventory_action',400);
  await ensureCameraInventoryOrder(pool);
  const rental=b.scope==='items',table=rental?'equipment_rental_items':'equipment_sale_items',db=await pool.connect();
  try{
    await db.query('BEGIN');
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',['equipment-rental:'+shop.id]);
    if(b.action==='move'){
      const rows=(await db.query("SELECT id FROM "+table+" WHERE shop_id=$1 AND deleted_at IS NULL AND (sku IS NULL OR sku NOT ILIKE 'SOFIA-DEMO-%') ORDER BY camera_display_order NULLS LAST,active DESC,created_at DESC,id FOR UPDATE",[shop.id])).rows;
      const ids=moveInventory(rows.map(x=>x.id),b.id,b.target,b.before);
      await db.query('UPDATE '+table+' AS i SET camera_display_order=o.pos FROM unnest($2::uuid[]) WITH ORDINALITY AS o(id,pos) WHERE i.shop_id=$1 AND i.id=o.id',[shop.id,ids]);
      await db.query('COMMIT');return {ok:true,ids};
    }
    const item=(await db.query('SELECT id FROM '+table+' WHERE shop_id=$1 AND id=$2 AND deleted_at IS NULL FOR UPDATE',[shop.id,b.id])).rows[0];
    if(!item)fail('inventory_item_not_found',404);
    if(rental){
      const busy=await db.query("SELECT 1 FROM equipment_rental_booking_items bi JOIN equipment_rental_bookings b ON b.id=bi.booking_id WHERE b.shop_id=$1 AND bi.item_id=$2 AND b.status IN ('pending_approval','payment_pending','reserved','picked_up') LIMIT 1",[shop.id,b.id]);
      const held=await db.query('SELECT 1 FROM equipment_rental_booking_assets WHERE shop_id=$1 AND item_id=$2 AND returned_at IS NULL LIMIT 1',[shop.id,b.id]);
      if(busy.rowCount||held.rowCount)fail('inventory_item_in_use');
      await db.query('UPDATE equipment_rental_assets SET active=false,deleted_at=now(),updated_at=now() WHERE shop_id=$1 AND item_id=$2 AND deleted_at IS NULL',[shop.id,b.id]);
    }else{
      const busy=await db.query("SELECT 1 FROM equipment_sale_orders WHERE shop_id=$1 AND sale_item_id=$2 AND status IN ('pending','confirmed') LIMIT 1",[shop.id,b.id]);
      if(busy.rowCount)fail('inventory_item_in_use');
    }
    await db.query('UPDATE '+table+' SET active=false,deleted_at=now(),updated_at=now()'+(rental?',stock_total=0':'')+' WHERE shop_id=$1 AND id=$2',[shop.id,b.id]);
    await db.query('COMMIT');return {ok:true};
  }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}finally{db.release()}
}
