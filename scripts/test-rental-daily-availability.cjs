// PostgreSQL smoke test, with an isolated in-memory database and no migrations.
// Install PGlite outside the checkout and set PHOTOBRIDGE_TEST_PGLITE_MODULE.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {PGlite}=require(process.env.PHOTOBRIDGE_TEST_PGLITE_MODULE||'@electric-sql/pglite');
const source=fs.readFileSync(path.join(__dirname,'../dist/api/server.js'),'utf8');
const slice=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const shop='00000000-0000-0000-0000-000000000001',item='00000000-0000-0000-0000-000000000002',first='00000000-0000-0000-0000-000000000003',third='00000000-0000-0000-0000-000000000004',newBooking='00000000-0000-0000-0000-000000000005';
test('real PostgreSQL: per-day availability and transactional exact shortage snapshots',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`CREATE TABLE equipment_rental_shops(id uuid PRIMARY KEY,name text,active boolean);
   CREATE TABLE equipment_rental_items(id uuid PRIMARY KEY,shop_id uuid,title text,category text,brand text,model text,daily_price integer,deposit_amount integer,stock_total integer,active boolean,deleted_at timestamp,sku text);
   CREATE TABLE equipment_rental_bookings(id uuid PRIMARY KEY,rental_start date,rental_end date,status text,handover_serials jsonb DEFAULT '[]');
   CREATE TABLE equipment_rental_booking_items(booking_id uuid,item_id uuid,quantity integer);
   CREATE TABLE equipment_rental_accounting_entries(booking_id uuid,entry_type text);
   CREATE TABLE equipment_rental_booking_shortages(id uuid PRIMARY KEY,shop_id uuid,booking_id uuid,item_id uuid,shortage_qty integer,rental_start date,rental_end date,status text,resolved_at timestamp,resolved_by uuid,updated_at timestamp,UNIQUE(booking_id,item_id));
   CREATE TABLE audit_log(id bigserial PRIMARY KEY,actor_id uuid,action text,entity_type text,entity_id text,data jsonb);
   INSERT INTO equipment_rental_shops VALUES('${shop}','Seven',true);
   INSERT INTO equipment_rental_items VALUES('${item}','${shop}','Camera',null,null,null,100,50,2,true,null,null);
   INSERT INTO equipment_rental_bookings(id,rental_start,rental_end,status) VALUES('${first}','2030-10-12','2030-10-12','reserved'),('${third}','2030-10-14','2030-10-14','payment_pending');
   INSERT INTO equipment_rental_booking_items VALUES('${first}','${item}',2),('${third}','${item}',1);`);
  const ctx=vm.createContext({crypto,console,Map,Date,Math,Number,JSON,ensureEquipmentRentalV727Schema:async()=>{},equipmentRentalTodayTehran:()=> '2030-10-10',equipmentRentalDate:v=>String(v).slice(0,10),equipmentRentalDays:(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/86400000)+1});
  vm.runInContext(slice('function equipmentRentalItemsInput(', 'async function equipmentRentalOverview('),ctx);
  const args={shopId:shop,startDate:'2030-10-12',endDate:'2030-10-14',items:[{itemId:item,quantity:1}]};
  let out=await ctx.equipmentRentalAvailability(db,args);
  assert.deepEqual(JSON.parse(JSON.stringify(out.items[0].dailyAvailability)).map(d=>[d.date,d.available,d.shortage]),[['2030-10-12',0,1],['2030-10-13',2,0],['2030-10-14',1,0]]);
  assert.equal(out.totalAmount,300);assert.equal(out.depositAmount,50);
  // Non-overlapping reservations must not be summed as if simultaneous.
  await db.query('UPDATE equipment_rental_booking_items SET quantity=1');
  out=await ctx.equipmentRentalAvailability(db,args);assert.equal(out.available,true);assert.equal(out.items[0].available,1);
  await db.query('UPDATE equipment_rental_booking_items SET quantity=2 WHERE booking_id=$1',[first]);
  out=await ctx.equipmentRentalAvailability(db,{...args,items:[{itemId:item,quantity:2}]});
  await db.exec('BEGIN');await ctx.equipmentRentalSaveDailyShortage(db,{shopId:shop,bookingId:newBooking,row:out.items[0]});await db.exec('COMMIT');
  const rows=(await db.query('SELECT * FROM equipment_rental_booking_shortages')).rows;
  await ctx.equipmentRentalAttachShortageDates(db,rows);
  assert.deepEqual(rows[0].shortage_days,[{date:'2030-10-12',quantity:2},{date:'2030-10-14',quantity:1}]);
  assert.equal(rows[0].shortage_qty,2); // peak units, not the sum of different days
  // Stock changes later must not rewrite the sourcing snapshot.
  await db.query('UPDATE equipment_rental_items SET stock_total=20');
  await ctx.equipmentRentalAttachShortageDates(db,rows);assert.equal(rows[0].shortage_days.length,2);
  await db.exec('BEGIN');await ctx.equipmentRentalSaveDailyShortage(db,{shopId:shop,bookingId:newBooking,row:{...out.items[0],dailyAvailability:[{date:'2030-10-13',shortage:1}]}});await db.exec('ROLLBACK');
  await ctx.equipmentRentalAttachShortageDates(db,rows);assert.equal(rows[0].shortage_days[0].date,'2030-10-12');
  await db.query('UPDATE equipment_rental_items SET stock_total=2');
  out=await ctx.equipmentRentalAvailability(db,{...args,excludeBookingId:first});assert.equal(out.available,true);
  await db.query("INSERT INTO equipment_rental_accounting_entries VALUES($1,'booking_reversal')",[first]);
  out=await ctx.equipmentRentalAvailability(db,args);assert.equal(out.available,true);
  await db.query("UPDATE equipment_rental_bookings SET status='cancelled'");
  out=await ctx.equipmentRentalAvailability(db,args);assert.equal(out.items[0].reserved,0);
  // A newly created reservation immediately reduces that day's remaining units.
  await db.query("INSERT INTO equipment_rental_bookings(id,rental_start,rental_end,status) VALUES($1,'2030-10-13','2030-10-14','reserved')",[newBooking]);
  await db.query('INSERT INTO equipment_rental_booking_items VALUES($1,$2,1)',[newBooking,item]);
  out=await ctx.equipmentRentalAvailability(db,args);
  assert.deepEqual(JSON.parse(JSON.stringify(out.items[0].dailyAvailability)).map(d=>[d.date,d.available]),[['2030-10-12',2],['2030-10-13',1],['2030-10-14',1]]);
  await db.query("UPDATE equipment_rental_bookings SET status='cancelled' WHERE id=$1",[newBooking]);
  out=await ctx.equipmentRentalAvailability(db,args);assert.equal(out.items[0].available,2);
  const unknown=await ctx.equipmentRentalAvailability(db,{...args,items:[{itemId:newBooking,quantity:1}]});assert.equal(unknown.items[0].valid,false);
  const invalid=await ctx.equipmentRentalAvailability(db,{...args,endDate:'2031-10-14'});assert.equal(invalid.error,'invalid_rental_dates');
 }finally{await db.close()}
});
