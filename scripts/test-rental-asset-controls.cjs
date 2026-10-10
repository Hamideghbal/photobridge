const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {PGlite}=require(process.env.PHOTOBRIDGE_TEST_PGLITE_MODULE||'@electric-sql/pglite');
const id=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
test('physical units protect bookings, preserve history, support zero stock and additions only',async()=>{
 const db=new PGlite();
 const query=async(q,p)=>{const r=await db.query(q,p);return {...r,rowCount:r.rows.length||r.affectedRows||0}};const pool={query,connect:async()=>({query,release(){}})};
 const {changeRentalAsset,increaseRentalAssetStock}=await import('../dist/api/rentalAssetControls.js');
 try{
  await db.exec(`CREATE SEQUENCE equipment_rental_asset_code_seq START 10000001;
   CREATE TABLE equipment_rental_items(id uuid PRIMARY KEY,shop_id uuid,stock_total integer CHECK(stock_total>=1),active boolean DEFAULT true,deleted_at timestamp,updated_at timestamp);
   CREATE TABLE equipment_rental_assets(id uuid PRIMARY KEY,shop_id uuid,item_id uuid REFERENCES equipment_rental_items(id),system_code text UNIQUE,active boolean DEFAULT true,updated_at timestamp);
   CREATE TABLE equipment_rental_bookings(id uuid PRIMARY KEY,shop_id uuid,rental_start date,rental_end date,status text,handover_serials jsonb);
   CREATE TABLE equipment_rental_booking_items(booking_id uuid REFERENCES equipment_rental_bookings(id),item_id uuid,quantity integer);
   CREATE TABLE equipment_rental_booking_assets(shop_id uuid,asset_id uuid REFERENCES equipment_rental_assets(id) ON DELETE RESTRICT,returned_at timestamp);
   CREATE TABLE equipment_rental_accounting_entries(booking_id uuid,entry_type text);
   INSERT INTO equipment_rental_items(id,shop_id,stock_total) VALUES('${id(2)}','${id(1)}',2);
   INSERT INTO equipment_rental_assets(id,shop_id,item_id,system_code) VALUES('${id(3)}','${id(1)}','${id(2)}','CAM-1'),('${id(4)}','${id(1)}','${id(2)}','CAM-2');`);
  // Schema migration is exercised only inside this disposable database.
  await db.exec(fs.readFileSync(path.join(__dirname,'../migrations/175_equipment_rental_individual_asset_controls.sql'),'utf8'));
  const args={shopId:id(1),assetId:id(3)};
  await assert.rejects(changeRentalAsset(pool,{...args,shopId:id(9),remove:true}),{error:'asset_not_found'});
  await db.exec(`INSERT INTO equipment_rental_bookings VALUES('${id(5)}','${id(1)}','2030-10-12','2030-10-13','reserved','[]');INSERT INTO equipment_rental_booking_items VALUES('${id(5)}','${id(2)}',2);`);
  await assert.rejects(changeRentalAsset(pool,{...args,active:false}),{error:'asset_reserved'});
  assert.equal((await db.query('SELECT stock_total FROM equipment_rental_items')).rows[0].stock_total,2);
  await db.exec(`UPDATE equipment_rental_bookings SET status='cancelled';INSERT INTO equipment_rental_booking_assets VALUES('${id(1)}','${id(3)}',NULL)`);
  await assert.rejects(changeRentalAsset(pool,{...args,remove:true}),{error:'asset_in_booking'});
  await db.exec('UPDATE equipment_rental_booking_assets SET returned_at=now()');
  let out=await changeRentalAsset(pool,{...args,active:false});assert.equal(out.stockTotal,1);
  out=await changeRentalAsset(pool,{...args,active:true});assert.equal(out.stockTotal,2);
  out=await changeRentalAsset(pool,{...args,remove:true});assert.equal(out.stockTotal,1);assert(out.asset.deleted_at);
  assert.equal((await db.query('SELECT count(*)::int n FROM equipment_rental_booking_assets')).rows[0].n,1);
  await assert.rejects(changeRentalAsset(pool,{...args,active:true}),{error:'asset_not_found'});
  out=await changeRentalAsset(pool,{shopId:id(1),assetId:id(4),active:false});assert.equal(out.stockTotal,0);
  assert.equal((await db.query('SELECT active FROM equipment_rental_items')).rows[0].active,false);
  const source=fs.readFileSync(path.join(__dirname,'../dist/api/server.js'),'utf8');
  const start=source.indexOf('    const items=await db.query(',source.indexOf('async function ensureEquipmentRentalAssetTrackingSchema'));
  const end=source.indexOf('\n}\n\nasync function equipmentRentalShopOverview',start);
  const context=vm.createContext({pool,crypto,Number,Math});vm.runInContext('async function backfill(db=pool){'+source.slice(start,end)+'}',context);
  await context.backfill();assert.equal((await db.query('SELECT count(*)::int n FROM equipment_rental_assets')).rows[0].n,2); // zero stock must not resurrect a disabled/deleted unit
  const c=await pool.connect();await c.query('BEGIN');
  await assert.rejects(increaseRentalAssetStock(c,id(1),id(2),-1),{error:'invalid_asset_quantity'});await c.query('ROLLBACK');
  await c.query('BEGIN');await increaseRentalAssetStock(c,id(1),id(2),2);await c.query('UPDATE equipment_rental_items SET stock_total=2,active=true');await c.query('COMMIT');
  assert.equal((await db.query('SELECT count(*)::int n FROM equipment_rental_assets WHERE active=true AND deleted_at IS NULL')).rows[0].n,2);
  await c.query('BEGIN');await assert.rejects(increaseRentalAssetStock(c,id(1),id(2),1),{error:'asset_quantity_decrease_requires_unit_delete'});await c.query('ROLLBACK');
  await c.query('BEGIN');const before=(await c.query('SELECT count(*)::int n FROM equipment_rental_assets')).rows[0].n;await increaseRentalAssetStock(c,id(1),id(2),3);await c.query('ROLLBACK');assert.equal((await c.query('SELECT count(*)::int n FROM equipment_rental_assets')).rows[0].n,before);
  await context.backfill();assert.equal((await c.query('SELECT count(*)::int n FROM equipment_rental_assets')).rows[0].n,before);
 }finally{await db.close()}
});
