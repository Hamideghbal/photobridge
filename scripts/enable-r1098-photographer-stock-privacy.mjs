// R1098: photographer stock privacy + owner-only shortage permission + store scroll recovery.
import fs from 'node:fs';

const serverPath='dist/api/server.js';
let server=fs.readFileSync(serverPath,'utf8');
const marker='/* PB_R1098_PHOTOGRAPHER_STOCK_PRIVACY */';

function replaceOnce(src,old,next,label){
 const count=src.split(old).length-1;
 if(count!==1)throw new Error('[R1098] '+label+' anchor count '+count);
 return src.replace(old,next);
}
function replaceInRange(src,startAnchor,endAnchor,old,next,label){
 const start=src.indexOf(startAnchor),end=src.indexOf(endAnchor,start+startAnchor.length);
 if(start<0||end<0)throw new Error('[R1098] '+label+' route range missing');
 const chunk=src.slice(start,end),count=chunk.split(old).length-1;
 if(count!==1)throw new Error('[R1098] '+label+' anchor count '+count);
 return src.slice(0,start)+chunk.replace(old,next)+src.slice(end);
}

if(!server.includes(marker)){
 server=replaceOnce(
  server,
  "const stockHeld=deferredApproval&&shop.customer_rental_stock_mode==='strict'&&!allowShortage;",
  "const stockHeld=false; // R1098: customer requests never reserve/consume shortage-mode stock.",
  'customer hold disabled'
 );
 server=replaceOnce(
  server,
  "if ((!deferredApproval||stockHeld) && !allowShortage && !availability.available)",
  "if (!allowShortage && !availability.available)",
  'customer shortage validation'
 );
 server=replaceOnce(
  server,
  "createdBy: a.userId, allowShortage: true });",
  "createdBy: a.userId, allowShortage: shop.customer_rental_stock_mode==='flexible' });",
  'manual store shortage permission'
 );
 server=replaceOnce(
  server,
  "allowShortage:body.allowShortage===true",
  "allowShortage:shop.customer_rental_stock_mode==='flexible'&&body.allowShortage===true",
  'store edit shortage permission'
 );

 server=replaceOnce(
  server,
  "const items = q.rows.map(equipmentItemPublic);",
  "const items = q.rows.map(equipmentItemPublic).map(({stock_total,...item})=>item);",
  'rental catalog stock privacy'
 );
 server=replaceOnce(
  server,
  "items:q.rows.map(equipmentItemPublic),shop:{id:shopId,name:sq.rows[0]?.name||null,walletCheckoutEnabled:Boolean(sq.rows[0]?.sales_wallet_checkout_enabled)}",
  "items:q.rows.map(equipmentItemPublic).map(({stock_total,...item})=>item),shop:{id:shopId,name:sq.rows[0]?.name||null,walletCheckoutEnabled:Boolean(sq.rows[0]?.sales_wallet_checkout_enabled)}",
  'sale catalog stock privacy'
 );

 const availabilityOld=`        let out = await equipmentRentalAvailability(pool, b);
        if(!out.error)out=await equipmentRentalApplyDiscount(pool,out,a.userId);
        return sendJson(res, out.error ? 400 : 200, out);`;
 const availabilityNew=`        let out = await equipmentRentalAvailability(pool, b);
        if(!out.error)out=await equipmentRentalApplyDiscount(pool,out,a.userId);
        if(out.error)return sendJson(res,400,{error:out.error});
        const safeItems=(out.items||[]).map(row=>({
            itemId:String(row.itemId||''),title:String(row.title||'تجهیز'),requested:Number(row.requested||1),
            valid:row.valid!==false,
            isAvailable:row.valid!==false&&Number(row.shortage||0)<=0,
            hasAnyAvailability:row.valid!==false&&Number(row.available||0)>0,
            dailyPrice:Number(row.dailyPrice||0),depositAmount:Number(row.depositAmount||0),subtotal:Number(row.subtotal||0)
        }));
        return sendJson(res,200,{
            rentalDays:Number(out.rentalDays||0),totalAmount:Number(out.totalAmount||0),grossAmount:Number(out.grossAmount??out.totalAmount??0),
            discountPercent:Number(out.discountPercent||0),discountAmount:Number(out.discountAmount||0),discountReason:out.discountReason||null,
            depositAmount:Number(out.depositAmount||0),available:safeItems.every(row=>row.isAvailable),items:safeItems
        });`;
 server=replaceOnce(server,availabilityOld,availabilityNew,'customer availability privacy');

 server=replaceInRange(
  server,
  "if (req.method === 'POST' && url.pathname === '/api/customer/equipment-rental/bookings') {",
  "const customerRentalPayment = url.pathname.match",
  "if (created.error) { await c.query('ROLLBACK'); return sendJson(res, created.error === 'equipment_unavailable' ? 409 : 400, created); }",
  "if (created.error) { await c.query('ROLLBACK'); return sendJson(res, created.error === 'equipment_unavailable' ? 409 : 400, {error:created.error}); }",
  'customer booking error privacy'
 );
 server=replaceOnce(
  server,
  "if(availability.error||!availability.available){await c.query('ROLLBACK');return sendJson(res,409,{error:'equipment_unavailable',availability});}",
  "if(availability.error||!availability.available){await c.query('ROLLBACK');return sendJson(res,409,{error:'equipment_unavailable'});}",
  'customer payment error privacy'
 );
 server=server.replace(
  "async function equipmentRentalCreateBooking(db, {",
  marker+"\nasync function equipmentRentalCreateBooking(db, {"
 );
 fs.writeFileSync(serverPath,server,'utf8');
 console.log('[R1098] customer inventory counts hidden; shortage mode restricted to store staff');
}

const bookPath='dist/api/equipment-rental-book.html';
let book=fs.readFileSync(bookPath,'utf8');
book=book.replaceAll('/photobridge-r1095-customer-stock.js?v=1097','/photobridge-r1095-customer-stock.js?v=1098');
book=book.replaceAll('/photobridge-r1057-daily-rental-availability.js?v=r1097','/photobridge-r1057-daily-rental-availability.js?v=r1098');
book=book.replaceAll('<small>موجودی ${fa(i.stock_total)}</small>','');
book=book.replaceAll('if(!i||Number(i.stock_total||0)<1)return false;x.quantity=Math.min(x.quantity,Number(i.stock_total||1));return true','if(!i)return false;x.quantity=Math.min(x.quantity,99);return true');
book=book.replaceAll('Math.max(1,Math.min(Number(item.stock_total||1),Number(input?.value||1)))','Math.max(1,Math.min(99,Number(input?.value||1)))');
book=book.replaceAll('found.quantity=Math.min(Number(item.stock_total||1),found.quantity+qty)','found.quantity=Math.min(99,found.quantity+qty)');
book=book.replaceAll('Math.max(1,Math.min(Number(item.stock_total||1),row.quantity+Number(delta||0)))','Math.max(1,Math.min(99,row.quantity+Number(delta||0)))');
book=book.replaceAll('max="${Math.max(1,Number(i.stock_total||1))}"','max="99"');
if(book.includes('stock_total'))throw new Error('[R1098] photographer sale HTML still references exact stock_total');
fs.writeFileSync(bookPath,book,'utf8');

const portalPath='dist/api/equipment-rental-portal.html';
let portal=fs.readFileSync(portalPath,'utf8');
portal=portal.replaceAll('/photobridge-r1095-owner-stock.js?v=1097','/photobridge-r1095-owner-stock.js?v=1098');
portal=portal.replaceAll('/photobridge-r1057-daily-rental-availability.js?v=r1097','/photobridge-r1057-daily-rental-availability.js?v=r1098');
const scrollAsset='/photobridge-r1098-owner-scroll.js?v=1098';
portal=portal.replaceAll('<script defer src="'+scrollAsset+'"></script>','');
const at=portal.lastIndexOf('</body>');
if(at<0)throw new Error('[R1098] store portal closing body missing');
portal=portal.slice(0,at)+'<script defer src="'+scrollAsset+'"></script>\n'+portal.slice(at);
if(portal.split(scrollAsset).length-1!==1)throw new Error('[R1098] owner scroll asset duplicate');
fs.writeFileSync(portalPath,portal,'utf8');

console.log('[R1098] photographer sale stock counts removed and store scroll recovery attached');
