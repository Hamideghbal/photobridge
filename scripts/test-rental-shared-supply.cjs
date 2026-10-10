const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {PGlite}=require(process.env.PHOTOBRIDGE_TEST_PGLITE_MODULE||'@electric-sql/pglite');
const source=fs.readFileSync(path.join(__dirname,'../dist/api/server.js'),'utf8');
const uuid=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
const shop=uuid(1),item=uuid(2),a=uuid(3),b=uuid(4),asset=uuid(5),supply=uuid(6),otherShop=uuid(7),c=uuid(8);
test('external cancellation acknowledgement cannot close equipment still held by a customer',async()=>{
 const from=source.indexOf("        if(Object.prototype.hasOwnProperty.call(b,'externalCancellationAcknowledged'))"),to=source.indexOf("        if(!['pending','provided'].includes(status))",from);
 assert(from>=0&&to>from);
 for(const held of [true,false]){
  let queries=0;
  const ctx=vm.createContext({b:{externalCancellationAcknowledged:true},rentalShortageRoute:['',supply],shop:{id:shop},a:{userId:null},pool:{query:async()=>{queries++;return {rowCount:1,rows:[{id:supply}]}}},equipmentRentalSupplyPool:async()=>({holders:held?[{shortageId:supply}]:[]}),audit:async()=>{},res:{},sendJson:(_,code,body)=>({code,body})});
  const result=await vm.runInContext('(async()=>{'+source.slice(from,to)+'})()',ctx);
  assert.equal(result.code,held?409:200);assert.equal(queries,held?0:1);
  if(held)assert.equal(result.body.error,'external_supply_in_use');
 }
});
test('PostgreSQL: swap shared external/owned units, preserve holders and reject duplicate/out-of-range supply',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`CREATE TABLE users(id uuid PRIMARY KEY,name text,mobile text);CREATE TABLE photographer_profiles(user_id uuid,studio_name text);
   CREATE TABLE equipment_rental_items(id uuid PRIMARY KEY,shop_id uuid,title text,category text,brand text,model text,created_at timestamp);
   CREATE FUNCTION equipment_rental_display_name(text,text,text,text,uuid) RETURNS text LANGUAGE SQL AS 'SELECT $4';
   CREATE TABLE equipment_rental_bookings(id uuid PRIMARY KEY,shop_id uuid,status text,rental_start date,rental_end date,photographer_id uuid,customer_name text,customer_mobile text,handover_serials jsonb DEFAULT '[]',handover_serials_recorded_at timestamp,handover_serials_recorded_by uuid,commitment_generated_at timestamp,updated_at timestamp);
   CREATE TABLE equipment_rental_booking_items(id uuid,booking_id uuid,item_id uuid,quantity integer);
   CREATE TABLE equipment_rental_booking_shortages(id uuid PRIMARY KEY,shop_id uuid,booking_id uuid,item_id uuid,shortage_qty integer,rental_start date,rental_end date,status text,resolved_at timestamp,resolved_by uuid,booking_cancelled_at timestamp,updated_at timestamp);
   CREATE TABLE equipment_rental_return_shortages(booking_id uuid,item_id uuid,status text,resolved_at timestamp,missing_qty integer,missing_asset_codes jsonb);
   CREATE TABLE audit_log(id bigserial PRIMARY KEY,action text,entity_type text,entity_id text,data jsonb);
   CREATE TABLE equipment_rental_assets(id uuid PRIMARY KEY,shop_id uuid,item_id uuid,active boolean,system_code text,serial_number text);
   CREATE TABLE equipment_rental_booking_assets(id uuid PRIMARY KEY,shop_id uuid,booking_id uuid,item_id uuid,asset_id uuid,handed_out_at timestamp,returned_at timestamp);
   INSERT INTO equipment_rental_items VALUES('${item}','${shop}','Camera',null,null,null,now());
   INSERT INTO equipment_rental_bookings(id,shop_id,status,rental_start,rental_end,customer_name) VALUES('${a}','${shop}','reserved','2030-10-12','2030-10-12','Customer A'),('${b}','${shop}','reserved','2030-10-12','2030-10-12','Customer B'),('${c}','${shop}','reserved','2030-10-12','2030-10-13','Customer C');
   INSERT INTO equipment_rental_booking_items VALUES('${uuid(20)}','${a}','${item}',1),('${uuid(21)}','${b}','${item}',1),('${uuid(22)}','${c}','${item}',1);
   INSERT INTO equipment_rental_booking_shortages(id,shop_id,booking_id,item_id,shortage_qty,rental_start,rental_end,status,resolved_at) VALUES('${supply}','${shop}','${a}','${item}',1,'2030-10-12','2030-10-12','provided',now());
   INSERT INTO equipment_rental_assets VALUES('${asset}','${shop}','${item}',true,'CAM-1','serial');`);
  await db.exec(`ALTER TABLE equipment_rental_assets ADD COLUMN deleted_at timestamptz;
   ALTER TABLE equipment_rental_bookings ADD COLUMN payment_status text,ADD COLUMN gross_amount bigint,ADD COLUMN discount_amount bigint,ADD COLUMN discount_percent integer,ADD COLUMN invoice_adjustment_amount bigint,ADD COLUMN invoice_adjustment_note text,ADD COLUMN return_kind text,ADD COLUMN returned_at timestamp;
   ALTER TABLE equipment_rental_booking_items ADD COLUMN rental_days integer DEFAULT 1,ADD COLUMN daily_price bigint DEFAULT 100,ADD COLUMN subtotal bigint DEFAULT 100;
   CREATE TABLE equipment_rental_invoices(id uuid PRIMARY KEY,invoice_number text,booking_id uuid,shop_id uuid,photographer_id uuid,total_amount bigint,deposit_amount bigint,issued_at timestamp);`);
  const ctx=vm.createContext({crypto,Map,Set,Date,JSON,Number,String,Math,equipmentRentalDate:v=>v instanceof Date?v.toISOString().slice(0,10):v?String(v).slice(0,10):null});
  vm.runInContext(source.slice(source.indexOf('async function equipmentRentalAttachShortageDates('),source.indexOf('async function equipmentRentalOverview(')),ctx);
  vm.runInContext(source.slice(source.indexOf('async function equipmentRentalHandoverInvoice('),source.indexOf('async function equipmentRentalAccountingOverview(')),ctx);
  const booking=id=>db.query('SELECT * FROM equipment_rental_bookings WHERE id=$1',[id]).then(r=>r.rows[0]);
  let pool=await ctx.equipmentRentalSupplyPool(db,shop,await booking(b));assert.equal(pool.sources[0].availableQuantity,1);
  pool=await ctx.equipmentRentalSupplyPool(db,shop,await booking(c));assert.equal(pool.sources[0].availableQuantity,0);
  const hand=async(id,owned,external)=>{
   await db.exec('BEGIN');const result=await ctx.equipmentRentalCommitHandover(db,{shopId:shop,bookingId:id,actorId:null,assetCodes:owned,externalSupplyCodes:external});
   await db.exec(result.error?'ROLLBACK':'COMMIT');return result;
  };
  // A ready one-day supply is compulsory for either one-day customer, even
  // when it was originally planned for the other customer.
  assert.equal(ctx.equipmentRentalRequiredExternalQuantity(await booking(c),item,1,pool.sources),0,'multi-day bookings do not require one-day supply');
  const ready=await ctx.equipmentRentalSupplyPool(db,shop,await booking(b));
  assert.equal(ctx.equipmentRentalRequiredExternalQuantity(await booking(b),item,1,ready.sources),1);
  assert.equal((await hand(b,['CAM-1'],[])).error,'single_day_external_supply_required');
  assert.equal((await hand(a,['CAM-1'],[])).error,'single_day_external_supply_required');
  assert.equal((await booking(a)).status,'reserved');
  assert.equal((await db.query('SELECT * FROM equipment_rental_booking_assets')).rows.length,0);
  await db.query("INSERT INTO equipment_rental_booking_shortages(id,shop_id,booking_id,item_id,shortage_qty,rental_start,rental_end,status) VALUES($1,$2,$3,$4,1,'2030-10-12','2030-10-12','pending')",[uuid(77),shop,a,item]);
  assert.equal((await hand(b,[],[{itemId:item,shortageId:uuid(77),code:''}])).error,'single_day_external_supply_required','pending supply cannot bypass ready supply priority');
  await db.query('DELETE FROM equipment_rental_booking_shortages WHERE id=$1',[uuid(77)]);
  // The owned unit remains available to the multi-day booking.
  await db.exec('BEGIN');const multi=await ctx.equipmentRentalCommitHandover(db,{shopId:shop,bookingId:c,actorId:null,assetCodes:['CAM-1'],externalSupplyCodes:[]});assert.equal(multi.assetCount,1);await db.exec('ROLLBACK');
  assert.equal(ctx.equipmentRentalRequiredExternalQuantity(await booking(b),item,3,[{itemId:item,supplied:true,availableQuantity:2,startDate:'2030-10-12',endDate:'2030-10-12'},{itemId:item,supplied:false,availableQuantity:10},{itemId:'other',supplied:true,availableQuantity:9}]),2,'pending supply and unrelated items do not count');
  assert.equal((await hand(c,[],[{itemId:item,shortageId:supply,code:'free text'}])).error,'external_supply_unavailable');
  // The source was planned for A; B receives it, then A takes the owned camera.
  await db.query("UPDATE equipment_rental_booking_shortages SET status='pending',resolved_at=NULL WHERE id=$1",[supply]);
  pool=await ctx.equipmentRentalSupplyPool(db,shop,await booking(b));assert.equal(pool.sources[0].availableQuantity,1);assert.equal(pool.sources[0].supplied,false);
  assert.equal((await hand(b,[],[{itemId:item,shortageId:supply,code:'any identifier'}])).externalSupplyCount,1);
  assert.equal((await db.query('SELECT status FROM equipment_rental_booking_shortages WHERE id=$1',[supply])).rows[0].status,'provided');
  assert.equal((await hand(a,['CAM-1'],[])).assetCount,1);
  await db.query("INSERT INTO equipment_rental_invoices VALUES($1,'42',$2,$3,NULL,100,0,now())",[uuid(90),b,shop]);
  const invoice=await ctx.equipmentRentalHandoverInvoice(db,shop,b);assert.equal(invoice.photographer_name,'Customer B');assert.equal(invoice.invoice_number,'42');assert.equal(invoice.items[0].title,'Camera');assert.equal(invoice.items[0].quantity,1);assert.equal(Number(invoice.items[0].subtotal),100);assert.equal(invoice.rental_start,'2030-10-12');
  assert.equal(await ctx.equipmentRentalHandoverInvoice(db,otherShop,b),null);
  pool=await ctx.equipmentRentalSupplyPool(db,shop,null);assert.equal(pool.holders[0].customerName,'Customer B');assert.equal(pool.holders[0].code,'any identifier');assert.equal(pool.sources[0].availableQuantity,0);
  const owned=await ctx.equipmentRentalAssetsSnapshot(db,shop);assert.equal(owned[0].customer_name,'Customer A');assert.equal(owned[0].current_booking_id,a);
  await db.query("UPDATE equipment_rental_bookings SET rental_end='2030-10-12' WHERE id=$1",[c]);
  assert.equal((await hand(c,[],[{itemId:item,shortageId:supply,code:''}])).error,'external_supply_unavailable');
  assert.equal((await hand(c,['CAM-1'],[])).error,'asset_already_out');
  assert.equal((await hand(b,[],[{itemId:item,shortageId:supply,code:''}])).error,'invalid_rental_transition');
  assert.equal((await ctx.equipmentRentalSupplyPool(db,otherShop,await booking(c))).sources.length,0);
  // Unreturned external equipment remains unavailable even after partial return.
  await db.query("UPDATE equipment_rental_bookings SET status='returned' WHERE id=$1",[b]);
  await db.query("INSERT INTO equipment_rental_return_shortages VALUES($1,$2,'missing',NULL,1,'[]')",[b,item]);
  pool=await ctx.equipmentRentalSupplyPool(db,shop,await booking(c));assert.equal(pool.sources[0].availableQuantity,0);
  await db.query("UPDATE equipment_rental_return_shortages SET resolved_at=now()");
  pool=await ctx.equipmentRentalSupplyPool(db,shop,await booking(c));assert.equal(pool.sources[0].availableQuantity,1);
  // Rollback leaves neither possession nor status changes behind.
  await db.exec('BEGIN');const rolled=await ctx.equipmentRentalCommitHandover(db,{shopId:shop,bookingId:c,actorId:null,assetCodes:[],externalSupplyCodes:[{itemId:item,shortageId:supply,code:''}]});assert.equal(rolled.externalSupplyCount,1);await db.exec('ROLLBACK');assert.equal((await booking(c)).status,'reserved');
  // Two-day ready supply covers a two-day booking, but never a longer booking.
  await db.query("UPDATE equipment_rental_booking_shortages SET rental_end='2030-10-13' WHERE id=$1",[supply]);
  await db.query("UPDATE equipment_rental_bookings SET rental_end='2030-10-13' WHERE id=$1",[c]);
  await db.query("UPDATE equipment_rental_booking_assets SET returned_at=now() WHERE booking_id=$1",[a]);
  const next=uuid(99),longer=uuid(98);
  await db.query("INSERT INTO equipment_rental_bookings(id,shop_id,status,rental_start,rental_end,customer_name) VALUES($1,$2,'reserved','2030-10-12','2030-10-13','Next'),($3,$2,'reserved','2030-10-12','2030-10-14','Longer')",[next,shop,longer]);
  await db.query('INSERT INTO equipment_rental_booking_items VALUES($1,$2,$3,1,2,100,200),($4,$5,$3,1,3,100,300)',[uuid(100),next,item,uuid(101),longer]);
  pool=await ctx.equipmentRentalSupplyPool(db,shop,await booking(longer));assert.equal(pool.sources[0].availableQuantity,0);
  assert.equal(ctx.equipmentRentalRequiredExternalQuantity(await booking(longer),item,1,pool.sources),0);
  pool=await ctx.equipmentRentalSupplyPool(db,shop,await booking(c));assert.equal(pool.sources[0].availableQuantity,1);
  assert.equal((await hand(c,['CAM-1'],[])).error,'single_day_external_supply_required');
  assert.equal((await booking(c)).status,'reserved');
  assert.equal((await hand(c,[],[{itemId:item,shortageId:supply,code:''}])).externalSupplyCount,1);
  pool=await ctx.equipmentRentalSupplyPool(db,shop,await booking(next));assert.equal(pool.sources[0].availableQuantity,0);
  assert.equal((await hand(next,['CAM-1'],[])).assetCount,1,'owned inventory unlocks after matching external units are exhausted');
 }finally{await db.close()}
});
