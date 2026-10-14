import crypto from 'node:crypto';
export const isProductionShop=shop=>['frame','chassis','frame_chassis'].includes(shop?.business_category);
const fail=(error,status=409)=>{throw Object.assign(new Error(error),{status});};
export function productionTransition(order,action){
 const stage=order.production_stage;
 const allowed={awaiting_approval:{confirm:'in_production',cancel:'cancelled'},in_production:{ready:'ready',cancel:'cancelled'},ready:{deliver:'delivered',cancel:'cancelled'}};
 if(action==='schedule'&&['awaiting_approval','in_production','ready'].includes(stage))return stage;
 const next=allowed[stage]?.[action];if(!next)fail('invalid_production_transition');return next;
}
export function productionSchedule(input,order={}){
 const date=(value)=>{if(value===null||value==='')return null;const x=String(value||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(x)||!Number.isFinite(new Date(x+'T00:00:00Z').getTime())||new Date(x+'T00:00:00Z').toISOString().slice(0,10)!==x)fail('invalid_production_date',400);return x;};
 const saved=value=>value instanceof Date?value.toISOString().slice(0,10):String(value||'').slice(0,10)||null;
 const ready=input.expectedReadyDate===undefined?saved(order.expected_ready_date):date(input.expectedReadyDate);
 const delivery=input.expectedDeliveryDate===undefined?saved(order.expected_delivery_date):date(input.expectedDeliveryDate);
 if(ready&&delivery&&delivery<ready)fail('delivery_before_ready',400);
 return {ready,delivery};
}
export function normalizeProductionOptions(body){
 const out={};for(const key of ['types','models','thicknesses','sizes','colors']){
 const values=body[key];if(!Array.isArray(values)||values.length>100)fail('invalid_production_options',400);
 out[key]=[...new Set(values.map(v=>String(v).trim()).filter(Boolean))];if(out[key].some(v=>v.length>100))fail('invalid_production_options',400);
 }return out;
}
export async function frameLedger(db,order,reverse=false){
 if(!order.buyer_user_id)return;
 const amount=Number(order.total_amount||0);if(!amount)return;
 const add=async(type,direction,description)=>db.query(`INSERT INTO equipment_rental_accounting_entries(shop_id,photographer_id,sale_order_id,entry_type,direction,amount,description,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$2) ON CONFLICT(sale_order_id,entry_type,direction) WHERE sale_order_id IS NOT NULL DO NOTHING`,[order.shop_id,order.buyer_user_id,order.id,type,direction,amount,description]);
 if(reverse){await add('sale_reversal','credit','لغو سفارش قاب و شاسی · '+order.id.slice(0,8));if(order.payment_status==='paid')await add('sale_refund','debit','برگشت وجه سفارش قاب و شاسی · '+order.id.slice(0,8));}
 else{await add('sale_charge','debit','سفارش تولید قاب و شاسی · '+order.id.slice(0,8));if(order.payment_status==='paid')await add('payment','credit','پرداخت آنلاین قاب و شاسی · '+order.id.slice(0,8));}
}
export async function createProductionOrders(db,{shop,userId,items,body,price,pay}){
 if(!isProductionShop(shop)||shop.sale_enabled===false)fail('production_shop_unavailable',404);
 if(!['pickup','courier'].includes(body.deliveryMethod))fail('delivery_method_required',400);
 // Delivery location comes from the authenticated photographer profile, never from checkout input.
 if(!Array.isArray(items)||!items.length||items.length>100)fail('invalid_sale_cart',400);
 const sorted=[...new Set(items.map(x=>String(x.itemId||'')))].sort();if(sorted.some(x=>! /^[0-9a-f-]{36}$/i.test(x)))fail('invalid_sale_cart',400);
 const q=await db.query(`SELECT * FROM equipment_sale_items WHERE shop_id=$1 AND id=ANY($2::uuid[]) AND active=true AND deleted_at IS NULL ORDER BY id FOR UPDATE`,[shop.id,sorted]);
 if(q.rowCount!==sorted.length)fail('sale_cart_changed');
 const byId=new Map(q.rows.map(x=>[String(x.id),x])),quantities=new Map();
 for(const x of items){const quantity=Number(x.quantity);if(!Number.isInteger(quantity)||quantity<1||quantity>99)fail('invalid_quantity',400);quantities.set(String(x.itemId),(quantities.get(String(x.itemId))||0)+quantity);}
 if([...quantities.values()].some(n=>n>99))fail('invalid_quantity',400);
 const lines=[];for(const id of sorted){const item=byId.get(id),quantity=quantities.get(id),p=await price(db,shop,userId,Number(item.sale_price)*quantity);lines.push({item,quantity,p});}
 const u=(await db.query(`SELECT u.name,u.mobile,COALESCE(pp.studio_name,u.name) studio_name,COALESCE(NULLIF(BTRIM(pp.location_address),''),NULLIF(BTRIM(u.location_address),'')) saved_delivery_address,COALESCE(pp.location_lat,u.location_lat) saved_lat,COALESCE(pp.location_lng,u.location_lng) saved_lng FROM users u LEFT JOIN photographer_profiles pp ON pp.user_id=u.id WHERE u.id=$1 AND u.active=true`,[userId])).rows[0];if(!u)fail('photographer_auth_required',401);
 const address=body.deliveryMethod==='courier'?String(u.saved_delivery_address||'').trim().slice(0,1000):'';
 if(body.deliveryMethod==='courier'&&!address)fail('photographer_delivery_address_unavailable',400);
 const deliveryLocation=(Number.isFinite(Number(u.saved_lat))&&Number.isFinite(Number(u.saved_lng))&&u.saved_lat!==null&&u.saved_lng!==null)?{lat:Number(u.saved_lat),lng:Number(u.saved_lng)}:null;
 const terms=(await db.query("SELECT settlement_mode FROM equipment_rental_shop_memberships WHERE shop_id=$1 AND user_id=$2 AND role='photographer' AND active=true",[shop.id,userId])).rows[0];
 const total=lines.reduce((n,x)=>n+x.p.totalAmount,0),wallet=terms?terms.settlement_mode==='prepaid':Boolean(shop.sales_wallet_checkout_enabled),cartId=crypto.randomUUID();let payment={};
 if(wallet)payment=await pay(db,{orderId:cartId,shopId:shop.id,buyerUserId:userId,amount:total,itemTitle:'سفارش قاب و شاسی',quantity:lines.reduce((n,x)=>n+x.quantity,0)});
 await db.query(`INSERT INTO equipment_rental_shop_memberships(shop_id,user_id,role,active,updated_at) VALUES($1,$2,'photographer',false,now()) ON CONFLICT(shop_id,user_id,role) DO NOTHING`,[shop.id,userId]);
 const orders=[];for(const {item,quantity,p} of lines){
 const id=crypto.randomUUID();const row=(await db.query(`INSERT INTO equipment_sale_orders(id,shop_id,sale_item_id,buyer_user_id,buyer_name,buyer_mobile,quantity,unit_price,total_amount,status,payment_status,buyer_wallet_transaction_id,shop_wallet_transaction_id,paid_at,notes,created_by,gross_amount,discount_percent,discount_amount,discount_reason,production_stage,delivery_method,delivery_address,production_specs) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10,$11,$12,$13,$14,$4,$15,$16,$17,$18,'awaiting_approval',$19,$20,$21::jsonb) RETURNING *`,[id,shop.id,item.id,userId,u.studio_name,u.mobile,quantity,item.sale_price,p.totalAmount,wallet?'paid':'unpaid',payment.buyerTx?.id||null,payment.shopTx?.id||null,wallet?new Date():null,String(body.notes||'').trim().slice(0,2000)||null,p.grossAmount,p.discountPercent,p.discountAmount,p.discountReason,body.deliveryMethod,address||null,JSON.stringify({...item.variant_specs,title:item.title,...(body.deliveryMethod==='courier'&&deliveryLocation?{deliveryLocation}:{})})])).rows[0];orders.push(row);
 }return {ok:true,cartId,orderIds:orders.map(x=>x.id),checkoutMode:wallet?'wallet':'ledger',status:'pending',paymentStatus:wallet?'paid':'unpaid',totalAmount:total,walletBalance:wallet?payment.buyerBalanceAfter:null};
}
