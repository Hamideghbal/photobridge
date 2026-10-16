'use strict';
const crypto=require('node:crypto');
const money=x=>Number.isSafeInteger(x)&&x>=0&&x<=1e12;
const uuid=()=>crypto.randomUUID();
const error=(message,status=400)=>Object.assign(Error(message),{status});
const isFrame=shop=>['frame','chassis','frame_chassis'].includes(String(shop?.business_category||''));
function install(Store){
 if(Store.prototype._frameManualSalesR1263)return;
 Store.prototype._frameManualSalesR1263=true;
 const originalApply=Store.prototype.apply,originalMutate=Store.prototype.mutate;
 Store.prototype.apply=function(snapshot,op){
  if(op.action!=='saleBatch.create')return originalApply.call(this,snapshot,op);
  if(op.entity!=='saleOrders'||!Array.isArray(op.payload?.lines))return;
  const list=snapshot.entities.saleOrders||(snapshot.entities.saleOrders=[]),p=op.payload;
  for(const line of p.lines){
   if(list.some(x=>String(x.id)===String(line.orderId)))continue;
   list.push({id:line.orderId,shop_id:snapshot.shopId,sale_item_id:line.saleItemId,
     buyer_name:p.buyerName,buyer_mobile:p.buyerMobile||null,quantity:line.quantity,
     unit_price:line.expectedUnitPrice,total_amount:line.expectedUnitPrice*line.quantity,
     status:'confirmed',payment_status:'unpaid',notes:'سفارش حضوری | '+p.invoiceRef+(p.notes?' | '+p.notes:''),
     invoice_number:p.invoiceRef,created_at:op.createdAt,updated_at:op.createdAt,_offline:true});
  }
 };
 Store.prototype.mutate=function(method,path,p){
  if(method!=='POST'||path!=='/api/rental/manual-sale-orders')return originalMutate.call(this,method,path,p);
  const snapshot=this.view(),shop=snapshot?.entities?.shop?.[0]||snapshot?.meta?.shop;
  if(!snapshot||!isFrame(shop)||shop.sale_enabled===false)throw error('manual_sale_not_allowed',403);
  const buyerName=String(p?.buyerName||'').trim(),buyerMobile=String(p?.buyerMobile||'').replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[\s-]/g,'').trim(),
        notes=String(p?.notes||'').trim();
  if(buyerName.length<2||buyerName.length>140||(buyerMobile&&!/^09\d{9}$/.test(buyerMobile)))throw error('invalid_manual_buyer');
  if(!Array.isArray(p?.items)||p.items.length<1||p.items.length>30)throw error('invalid_manual_lines');
  const seen=new Set(),lines=[];let total=0;
  for(const entry of p.items){
   const saleItemId=String(entry.saleItemId||''),quantity=Number(entry.quantity);
   if(seen.has(saleItemId)||!Number.isSafeInteger(quantity)||quantity<1||quantity>99)throw error('invalid_manual_lines');
   seen.add(saleItemId);
   const item=(snapshot.entities.saleItems||[]).find(x=>String(x.id)===saleItemId);
   if(!item||item.deleted_at||item.active===false)throw error('manual_item_unavailable',409);
   const price=Number(item.sale_price);
   if(!money(price)||!money(price*quantity))throw error('invalid_manual_amount');
   total+=price*quantity;
   if(!money(total))throw error('invalid_manual_amount');
   lines.push({orderId:uuid(),saleItemId,quantity,expectedUnitPrice:price,title:String(item.title||item.model||'کالا')});
  }
  const id=uuid(),invoiceRef='OFF-'+id.replace(/-/g,'').slice(0,12).toUpperCase();
  const payload={buyerName,buyerMobile,notes:notes.slice(0,500),lines,invoiceRef,expectedTotal:total};
  this.enqueue('saleOrders',id,'saleBatch.create',payload);
  return {ok:true,queued:true,id,invoiceRef,totalAmount:total,buyerName,buyerMobile,
    lines:lines.map(x=>({title:x.title,quantity:x.quantity,unitPrice:x.expectedUnitPrice,total:x.expectedUnitPrice*x.quantity}))};
 };
}
module.exports={install,isFrame};
