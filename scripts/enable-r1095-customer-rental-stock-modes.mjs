// R1095 customer rental request stock modes (build-time, idempotent).
import fs from 'node:fs';
const path='dist/api/server.js';
let src=fs.readFileSync(path,'utf8');
const mark='/* PB_R1095_CUSTOMER_STOCK_MODES */';
if(!src.includes(mark)){
 const patch=(old,next,label)=>{
  if(src.split(old).length!==2)throw Error('[R1095] '+label+' anchor changed');
  src=src.replace(old,next);
 };
 patch("async function equipmentRentalCreateBooking(db, {","/* PB_R1095_CUSTOMER_STOCK_MODES */\nasync function equipmentRentalCreateBooking(db, {",'create');
 patch("const deferredApproval = initialStatus === 'pending_approval';","const deferredApproval = initialStatus === 'pending_approval';\n    const stockHeld=deferredApproval&&shop.customer_rental_stock_mode==='strict'&&!allowShortage;",'held');
 patch("if (!deferredApproval && !allowShortage && !availability.available)","if ((!deferredApproval||stockHeld) && !allowShortage && !availability.available)",'strict_validation');
 patch("deposit_amount,notes,created_by)\n      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)",
       "deposit_amount,notes,created_by,customer_stock_held)\n      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)",'booking_insert');
 patch("availability.depositAmount, notes || null, createdBy || null]);","availability.depositAmount, notes || null, createdBy || null,stockHeld]);",'booking_values');
 patch("AND (b.status IN ('payment_pending','reserved','picked_up') OR",
       "AND (b.status IN ('payment_pending','reserved','picked_up') OR (b.status='pending_approval' AND b.customer_stock_held=true) OR",'availability_holds');
 // Extend only the owner's shop PATCH query; no mass updates.
 patch("const saleEnabled=b.saleEnabled===undefined?shop.sale_enabled!==false:b.saleEnabled===true;",
       "const saleEnabled=b.saleEnabled===undefined?shop.sale_enabled!==false:b.saleEnabled===true;\n        const customerStockMode=b.customerStockMode===undefined?String(shop.customer_rental_stock_mode||'flexible'):String(b.customerStockMode||'');\n        if(!['flexible','strict'].includes(customerStockMode))return sendJson(res,400,{error:'invalid_customer_stock_mode'});",'setting_validate');
 patch("sale_birthday_sms_enabled=$29,updated_at=now() WHERE id=$1",
       "sale_birthday_sms_enabled=$29,customer_rental_stock_mode=$30,updated_at=now() WHERE id=$1",'setting_sql');
 patch("saleBirthdaySms]);\n        await audit(a.userId, undefined, 'equipment_rental.shop_update'",
       "saleBirthdaySms,customerStockMode]);\n        await audit(a.userId, undefined, 'equipment_rental.shop_update'",'setting_params');
 // Photographer chooses a shop from its actual authoritative mode.
 patch("s.birthday_sms_enabled,s.rental_enabled,s.sale_enabled,s.rental_reach",
       "s.birthday_sms_enabled,s.rental_enabled,s.sale_enabled,s.customer_rental_stock_mode,s.rental_reach",'customer_shop_directory');
 patch("depositPolicy: shop.deposit_policy }, items",
       "depositPolicy: shop.deposit_policy,customerStockMode:shop.customer_rental_stock_mode||'flexible' }, items",'customer_items_shop');
 // Prevent attempts to side-step strict-mode stock checks via optimistic 'availability'.
 // The booking creation path already serializes per shop with advisory locks.
}
if(src.split(mark).length!==2)throw Error('[R1095] customer stock mode marker missing/duplicate');
fs.writeFileSync(path,src,'utf8');
console.log('[R1095] customer booking modes, reservation holds and shop preferences activated');
