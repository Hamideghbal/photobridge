import fs from 'node:fs';
import pg from 'pg';
const db=new pg.Client({
 host:'127.0.0.1',port:5432,user:'postgres',
 password:'photobridge_test',database:'photobridge_test'
});
const check=(x,m)=>{if(!x)throw new Error('[R1095 migration smoke] '+m)};
await db.connect();
try{
 await db.query('CREATE TABLE equipment_rental_bookings(id uuid PRIMARY KEY,shop_id integer NOT NULL,status text NOT NULL,rental_start date NOT NULL,rental_end date NOT NULL)');
 const sql=fs.readFileSync('migrations/176_equipment_customer_rental_stock_modes.sql','utf8');
 await db.query(sql);await db.query(sql);
 const defaultMode=(await db.query('SELECT customer_rental_stock_mode FROM equipment_rental_shops WHERE id=1')).rows[0]?.customer_rental_stock_mode;
 check(defaultMode==='flexible','old shops must stay flexible');
 await db.query("UPDATE equipment_rental_shops SET customer_rental_stock_mode='strict' WHERE id=1");
 const mode=(await db.query('SELECT customer_rental_stock_mode FROM equipment_rental_shops WHERE id=1')).rows[0].customer_rental_stock_mode;
 check(mode==='strict','settings update must persist');
 let invalid=false;
 try{await db.query("UPDATE equipment_rental_shops SET customer_rental_stock_mode='unknown' WHERE id=1")}catch(e){invalid=e.code==='23514'}
 check(invalid,'invalid mode must be rejected by database');
 await db.query("INSERT INTO equipment_rental_bookings(id,shop_id,status,rental_start,rental_end) VALUES('00000000-0000-4000-8000-000000000001',1,'pending_approval','2026-11-01','2026-11-03')");
 check((await db.query('SELECT customer_stock_held FROM equipment_rental_bookings')).rows[0].customer_stock_held===false,'old pending requests must not consume inventory');
 await db.query("UPDATE equipment_rental_bookings SET customer_stock_held=true WHERE id='00000000-0000-4000-8000-000000000001'");
 const held=await db.query("SELECT count(*)::int n FROM equipment_rental_bookings WHERE shop_id=1 AND status='pending_approval' AND customer_stock_held=true AND rental_start<='2026-11-02' AND rental_end>='2026-11-02'");
 check(held.rows[0].n===1,'strict pending request should hold stock');
 await db.query("UPDATE equipment_rental_bookings SET status='rejected' WHERE shop_id=1");
 const released=await db.query("SELECT count(*)::int n FROM equipment_rental_bookings WHERE shop_id=1 AND status='pending_approval' AND customer_stock_held=true");
 check(released.rows[0].n===0,'rejected request must release its hold');
 console.log('[R1095] migration idempotency/default, strict persistence, DB constraint, hold and release passed');
}finally{await db.end()}
