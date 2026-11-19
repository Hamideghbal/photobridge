'use strict';
function imageUrl(value){
 if(typeof value!=='string'||value.length>4096)return null;
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}
}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function latinDigits(value){
 return String(value??'').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776))
   .replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632));
}
function orderNumber(value){
 const digits=latinDigits(value).replace(/^#/,'').trim();
 return /^\d{1,12}$/.test(digits)?digits.replace(/^0+(?=\d)/,''):null;
}
function orderNotice(n){
 const meta=n?.metadata&&typeof n.metadata==='object'?n.metadata:{};
 const key=String(n?.event_key||n?.eventKey||meta.event_key||'').toLowerCase();
 const title=String(n?.title||''),message=latinDigits(n?.message||n?.body||'');
 const event=['order_submitted','archive_order_recovered','order_payment_approved','order_created','new_order','order_received','photo_order_created','photo_order_submitted'].includes(key);
 // Older server notifications may contain only title + "سفارش #894 ...".
 // Do not interpret a generic digit, invoice, chat or archived message as a new order.
 const visible=/سفارش\s*جدید|new\s+order/i.test(title)||
  /سفارش\s*(?:شماره\s*)?[#№]?\s*\d{1,12}\s*(?:از\s+.+)?\s*(?:ثبت\s+شد|ارسال\s+شد|دریافت\s+شد)/i.test(message);
 if(!event&&!visible)return null;
 const rawId=String(meta.orderId||meta.order_id||n.order_id||n.orderId||'');
 const id=UUID.test(rawId)?rawId:null;
 const textMatch=message.match(/سفارش\s*(?:شماره\s*)?[#№]?\s*(\d{1,12})(?=\D|$)/);
 const number=orderNumber(meta.orderNumber||meta.order_number||n.order_number||n.orderNumber||textMatch?.[1]);
 return id||number?{orderId:id,orderNumber:number,createdAt:n.created_at||n.createdAt||null}:null;
}
function alertContent(n){
 const meta=n.metadata&&typeof n.metadata==='object'?n.metadata:{};
 const order=orderNotice(n);
 const image=imageUrl(n.image_url||n.imageUrl||meta.image_url||meta.imageUrl||meta.attachmentUrl);
 return {...(order?{orderAlert:true,...order}:{}),
  created_at:n.created_at||null,id:String(n.id),title:String(n.title||'اعلان جدید'),
  message:String(n.message||''),...(image?{image}:{}),
  ...(n.attachment_key?{hasAttachment:true}:{})};
}
module.exports={imageUrl,alertContent,orderNotice,latinDigits};
