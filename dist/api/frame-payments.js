import crypto from 'node:crypto';
import {isProductionShop} from './frame-production.js';

const fail=(message,status=409)=>{throw Object.assign(new Error(message),{status});};
const digits=value=>String(value||'').replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
export const frameBankDetails=shop=>({cardNumber:shop?.payment_card_number||'',iban:shop?.payment_iban||'',accountHolder:shop?.payment_account_holder||''});
export function normalizeFrameBank(input){
 const card=digits(input.cardNumber).replace(/[\s-]/g,''),iban=digits(input.iban).replace(/\s/g,'').toUpperCase().replace(/^IR/,'');
 if(card&&!/^\d{16}$/.test(card))fail('invalid_card_number',400);
 if(iban&&!/^\d{24}$/.test(iban))fail('invalid_iban',400);
 if(iban){let remainder=0;for(const n of iban.slice(2)+'1827'+iban.slice(0,2))remainder=(remainder*10+Number(n))%97;if(remainder!==1)fail('invalid_iban',400);}
 const accountHolder=String(input.accountHolder||'').trim();if(accountHolder.length>150)fail('invalid_account_holder',400);
 if((card||iban)&&!accountHolder)fail('account_holder_required',400);
 return {cardNumber:card,iban:iban?'IR'+iban:'',accountHolder};
}
export async function normalizeFrameReceipt(body,sharp){
 const value=String(body.image||'');const match=value.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
 if(!match||match[2].length>8*1024*1024)fail('invalid_receipt_image',400);
 const source=Buffer.from(match[2],'base64');if(!source.length||source.length>6*1024*1024)fail('receipt_too_large',400);
 try{return await sharp(source,{limitInputPixels:24_000_000,animated:false}).rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).flatten({background:'#fff'}).jpeg({quality:90}).toBuffer();}catch{fail('invalid_receipt_image',400);}
}
export async function reviewFramePayment(db,{paymentId,shopId,userId,action,note=''}){
 if(!['approve','reject'].includes(action))fail('invalid_receipt_review',400);
 const payment=(await db.query('SELECT * FROM equipment_frame_payments WHERE id=$1 AND shop_id=$2 FOR UPDATE',[paymentId,shopId])).rows[0];
 if(!payment)fail('payment_not_found',404);
 if(payment.status==='approved'&&action==='approve')return payment;
 if(payment.status!=='pending'||!payment.receipt_object_key)fail('receipt_not_pending');
 const orders=(await db.query('SELECT * FROM equipment_sale_orders WHERE frame_payment_id=$1 ORDER BY id FOR UPDATE',[paymentId])).rows;
 if(action==='approve'&&(!orders.length||orders.some(o=>o.shop_id!==shopId||o.buyer_user_id!==payment.buyer_user_id||o.status==='cancelled'||o.payment_status!=='unpaid')))fail('payment_group_changed');
 const total=orders.reduce((n,o)=>n+Number(o.total_amount),0);if(action==='approve'&&Math.abs(total-Number(payment.total_amount))>.001)fail('payment_group_changed');
 if(action==='approve'){
  for(const order of orders){
   await db.query("UPDATE equipment_sale_orders SET payment_status='paid',paid_at=COALESCE(paid_at,now()),updated_at=now() WHERE id=$1",[order.id]);
   // Record money received even before the order is accepted. Later production
   // confirmation adds the charge, with the same unique key preventing duplication.
   await db.query(`INSERT INTO equipment_rental_accounting_entries(shop_id,photographer_id,sale_order_id,entry_type,direction,amount,description,created_by) VALUES($1,$2,$3,'payment','credit',$4,'پرداخت بانکی قاب و شاسی · تأیید رسید',$5) ON CONFLICT(sale_order_id,entry_type,direction) WHERE sale_order_id IS NOT NULL DO NOTHING`,[shopId,payment.buyer_user_id,order.id,order.total_amount,userId]);
  }
 }
 return (await db.query("UPDATE equipment_frame_payments SET status=$2,reviewed_by=$3,reviewed_at=now(),review_note=$4,updated_at=now() WHERE id=$1 RETURNING *",[paymentId,action==='approve'?'approved':'rejected',userId,String(note||'').trim().slice(0,500)||null])).rows[0];
}

export async function handleFramePayments(req,res,url,a,d){
 const settings=url.pathname==='/api/rental/frame-payment-settings';
 const activity=url.pathname==='/api/rental/frame-activity';
 const match=url.pathname.match(/^\/api\/(customer\/equipment-rental|rental)\/frame-payments\/([0-9a-f-]{36})(?:\/(receipt|review))?$/i);
 if(!settings&&!match&&!activity)return false;
 const reply=(status,data)=>{d.sendJson(res,status,data);return true;};
 try{
  let shop=null;const owner=settings||activity||match?.[1]==='rental';
  if(owner){shop=await d.currentShop(a);if(!shop)return reply(401,{error:'rental_auth_required'});if(!isProductionShop(shop))return reply(404,{error:'production_shop_unavailable'});}
  else if(!a||a.labRole!=='customer')return reply(401,{error:'photographer_auth_required'});
  if(activity){
   if(req.method!=='GET')return reply(405,{error:'method_not_allowed'});
   // A small, scoped snapshot for the store-side order/receipt alert.
   const rows=(await d.pool.query(`SELECT o.id,o.frame_payment_id,o.buyer_name,p.created_at AS created_at,
         o.status,o.production_stage,p.status AS receipt_status,p.submitted_at AS receipt_submitted_at
         FROM equipment_sale_orders o
         LEFT JOIN equipment_frame_payments p ON p.id=o.frame_payment_id
         WHERE o.shop_id=$1 AND o.frame_payment_id IS NOT NULL
           AND p.created_at>=now()-interval '30 days'
         ORDER BY p.created_at DESC LIMIT 75`,[shop.id])).rows;
   return reply(200,{orders:rows.map(o=>({id:o.id,paymentId:o.frame_payment_id,
     photographerName:o.buyer_name||'عکاس',createdAt:o.created_at,
     status:o.status,stage:o.production_stage,
     receiptStatus:o.receipt_status,receiptSubmittedAt:o.receipt_submitted_at}))});
  }
  if(settings){
   if(req.method==='GET')return reply(200,{paymentSettings:frameBankDetails(shop)});
   if(req.method!=='PUT')return reply(405,{error:'method_not_allowed'});
   const bank=normalizeFrameBank(await d.bodyJson(req,10000));
   await d.pool.query('UPDATE equipment_rental_shops SET payment_card_number=$2,payment_iban=$3,payment_account_holder=$4,sales_wallet_checkout_enabled=false,updated_at=now() WHERE id=$1',[shop.id,bank.cardNumber||null,bank.iban||null,bank.accountHolder||null]);
   await d.audit(a.userId,undefined,'equipment_frame.bank_settings','equipment_rental_shop',shop.id,{hasCard:Boolean(bank.cardNumber),hasIban:Boolean(bank.iban)});
   return reply(200,{ok:true,paymentSettings:bank});
  }
  const id=match[2],part=match[3]||'',field=owner?'shop_id':'buyer_user_id',actor=owner?shop.id:a.userId;
  const payment=(await d.pool.query(`SELECT * FROM equipment_frame_payments WHERE id=$1 AND ${field}=$2`,[id,actor])).rows[0];
  if(!payment)return reply(404,{error:'payment_not_found'});
  if(req.method==='GET'&&part==='receipt'){
   if(!payment.receipt_object_key)return reply(404,{error:'receipt_not_found'});
   const buffer=await d.readObject(payment.receipt_object_key);res.writeHead(200,{'Content-Type':'image/jpeg','Content-Length':buffer.length,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline; filename="payment-receipt.jpg"'});res.end(buffer);return true;
  }
  if(req.method==='GET'&&!part){
   const saved=(await d.pool.query('SELECT payment_card_number,payment_iban,payment_account_holder FROM equipment_rental_shops WHERE id=$1',[payment.shop_id])).rows[0];
   const bank=payment.bank_details?.cardNumber||payment.bank_details?.iban?payment.bank_details:frameBankDetails(saved);
   return reply(200,{payment:{id,status:payment.status,totalAmount:Number(payment.total_amount),reviewNote:payment.review_note,submittedAt:payment.submitted_at,hasReceipt:Boolean(payment.receipt_object_key)},paymentSettings:bank});
  }
  if(req.method==='POST'&&part==='review'&&owner){
   const b=await d.bodyJson(req,10000),db=await d.pool.connect();let out;
   try{await db.query('BEGIN');out=await reviewFramePayment(db,{paymentId:id,shopId:shop.id,userId:a.userId,action:b.action,note:b.note});await d.audit(a.userId,undefined,'equipment_frame.receipt_'+b.action,'equipment_frame_payment',id,{shopId:shop.id});await db.query('COMMIT');}catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}
   void d.notifyCustomer(payment.buyer_user_id,'equipment_sale_payment',{paymentId:id,status:out.status});return reply(200,{ok:true,status:out.status});
  }
  if(req.method==='POST'&&part==='receipt'&&!owner){
   const body=await d.bodyJson(req,9*1024*1024),buffer=await normalizeFrameReceipt(body,d.sharp),db=await d.pool.connect();let key=null,oldKey=null;
   try{
    await db.query('BEGIN');const current=(await db.query('SELECT * FROM equipment_frame_payments WHERE id=$1 AND buyer_user_id=$2 FOR UPDATE',[id,a.userId])).rows[0];
    if(!current||!['awaiting_receipt','rejected'].includes(current.status))fail('receipt_not_replaceable');
    const orders=(await db.query('SELECT id,status,payment_status FROM equipment_sale_orders WHERE frame_payment_id=$1 ORDER BY id FOR UPDATE',[id])).rows;
    if(!orders.length||orders.some(o=>o.status==='cancelled'||o.payment_status==='paid'||o.payment_status==='refunded'))fail('payment_group_changed');
    const saved=(await db.query('SELECT payment_card_number,payment_iban,payment_account_holder FROM equipment_rental_shops WHERE id=$1',[current.shop_id])).rows[0];
    const bank=current.bank_details?.cardNumber||current.bank_details?.iban?current.bank_details:frameBankDetails(saved);if(!bank.cardNumber&&!bank.iban)fail('bank_details_unavailable');
    key=await d.storeReceipt(current.shop_id,id,crypto.randomUUID(),buffer);oldKey=current.receipt_object_key;
    await db.query("UPDATE equipment_frame_payments SET status='pending',receipt_object_key=$2,receipt_name=$3,receipt_bytes=$4,bank_details=$5::jsonb,submitted_at=now(),reviewed_by=NULL,reviewed_at=NULL,review_note=NULL,updated_at=now() WHERE id=$1",[id,key,String(body.name||'رسید پرداخت').slice(0,160),buffer.length,JSON.stringify(bank)]);
    await db.query('COMMIT');
   }catch(e){await db.query('ROLLBACK');if(key)void d.deleteObject(key).catch(()=>{});throw e;}finally{db.release();}
   if(oldKey)void d.deleteObject(oldKey).catch(()=>{});
   await d.audit(a.userId,undefined,'equipment_frame.receipt_submit','equipment_frame_payment',id,{shopId:payment.shop_id});
   void d.notifyShop(payment.shop_id,'equipment_sale_payment_receipt',{paymentId:id,photographerId:a.userId});return reply(201,{ok:true,status:'pending'});
  }
  return reply(405,{error:'method_not_allowed'});
 }catch(e){if(e.status)return reply(e.status,{error:e.message});throw e;}
}
