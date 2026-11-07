export function withDirectCustomerIdentityFields(api){
 const specs=[
  ['async function financeDocumentsForCustomer(','const invQ','FROM invoices i','i'],
  ['async function createOrGetInvoice(','const existing','FROM invoices i','i'],
  ['async function createOrGetInvoice(','const oq','FROM orders o','o']
 ];
 for(const [fn,query,from,star] of specs){
  const fnAt=api.indexOf(fn);
  if(fnAt<0||api.indexOf(fn,fnAt+fn.length)!==-1)throw Error('R1674 missing or duplicated invoice function '+fn);
  const start=api.indexOf(query,fnAt),end=api.indexOf(from,start);
  if(start<0||end<0||end-start>4500||(start-fnAt>16000))throw Error('R1674 invalid invoice query '+query);
  let select=api.slice(start,end);
  const marker=new RegExp('\\bSELECT\\s+'+star+'\\.\\*\\s*,','g');
  if([...select.matchAll(marker)].length!==1)throw Error('R1674 SELECT projection invalid '+query);
  if(!select.includes('customer_name'))throw Error('R1674 customer name projection unavailable '+query);
  const sqlAfter=api.slice(end,end+500);
  if(!sqlAfter.includes('JOIN users u')||!sqlAfter.includes('JOIN orders o')&&star!=='o')
   throw Error('R1674 invoice query joins changed '+query);
  const parts=[];
  if(!/\bdirect_customer_name\b/.test(select))parts.push("NULLIF(BTRIM(o.walkin_customer_name),'') direct_customer_name");
  if(!/\bdirect_customer_mobile\b/.test(select))parts.push("COALESCE(NULLIF(BTRIM(o.walkin_customer_mobile),''),u.mobile) direct_customer_mobile");
  if(!/\bcustomer_mobile\b/.test(select))parts.push("COALESCE(o.walkin_customer_mobile,u.mobile) customer_mobile");
  if(!/\bcustomer_kind\b/.test(select))parts.push("CASE WHEN o.source IN ('walkin','manual_invoice') OR o.walkin_customer_name IS NOT NULL THEN 'customer' ELSE 'coworker' END customer_kind");
  if(!/\border_source\b/.test(select))parts.push('o.source order_source');
  if(parts.length){
   select=select.replace(marker,match=>match+parts.join(',')+',');
   api=api.slice(0,start)+select+api.slice(end);
  }
 }
 const returnTail='order_created_at: order.created_at }';
 const newTail='order_created_at: order.created_at, direct_customer_name: order.direct_customer_name, direct_customer_mobile: order.direct_customer_mobile, customer_mobile: order.customer_mobile, customer_kind: order.customer_kind, order_source: order.order_source }';
 const oldCount=api.split(returnTail).length-1,newCount=api.split(newTail).length-1;
 if(oldCount===2)api=api.split(returnTail).join(newTail);
 else if(oldCount!==0||newCount!==2)throw Error('R1674 invoice new-return contract '+oldCount+'/'+newCount);
 return api;
}


/* R1679: attach the laboratory's own public contact details to invoice rows.
 * pickup_address/phone are the saved laboratory contact fields; if no phone
 * is set there, use the active lab administrator's mobile. City/province are
 * a last-resort address label, never the photographer's address.
 */
export function withInvoiceLabContactFields(source) {
 const specs=[
  {fn:'async function financeDocumentsForCustomer(',query:'const invQ',from:'FROM invoices i',join:'JOIN labs l ON l.id=i.lab_id'},
  {fn:'async function createOrGetInvoice(',query:'const existing',from:'FROM invoices i',join:'JOIN labs l ON l.id=i.lab_id'},
  {fn:'async function createOrGetInvoice(',query:'const oq',from:'FROM orders o',join:'JOIN labs l ON l.id=o.lab_id'}
 ];
 let api=source;
 for(const spec of specs){
  const fnAt=api.indexOf(spec.fn);
  if(fnAt<0||api.indexOf(spec.fn,fnAt+spec.fn.length)!==-1)
   throw Error('R1679 invoice query function count '+spec.fn);
  const start=api.indexOf(spec.query,fnAt),from=api.indexOf(spec.from,start);
  if(start<0||from<0||from-start>6500||start-fnAt>18000)
   throw Error('R1679 invoice SELECT boundary '+spec.query);
  let projection=api.slice(start,from);
  if(!projection.includes('lab_phone')||!projection.includes('lab_address')){
   const anchor='l.name lab_name';
   if(projection.split(anchor).length-1!==1)
    throw Error('R1679 lab name projection count '+spec.query);
   projection=projection.replace(anchor,
    "l.name lab_name,COALESCE(NULLIF(BTRIM(ds.pickup_phone),''),NULLIF(BTRIM(lab_admin.mobile),''),'') lab_phone,COALESCE(NULLIF(BTRIM(ds.pickup_address),''),NULLIF(BTRIM(CONCAT_WS('، ',l.city,l.province)),''),'') lab_address");
   api=api.slice(0,start)+projection+api.slice(from);
  }
  const fromAt=api.indexOf(spec.from,start),whereAt=api.indexOf('WHERE ',fromAt);
  const joinAt=api.indexOf(spec.join,fromAt);
  if(joinAt<0||whereAt<0||joinAt>whereAt)
   throw Error('R1679 lab join boundary '+spec.query);
  const joinEnd=joinAt+spec.join.length;
  const joins=api.slice(joinEnd,whereAt);
  if(!joins.includes('LEFT JOIN lab_delivery_settings ds')){
   const extra=" LEFT JOIN lab_delivery_settings ds ON ds.lab_id=l.id LEFT JOIN LATERAL (SELECT admin_user.mobile FROM lab_memberships admin_membership JOIN users admin_user ON admin_user.id=admin_membership.user_id WHERE admin_membership.lab_id=l.id AND admin_membership.role='lab_admin' AND admin_membership.active=true ORDER BY admin_membership.created_at LIMIT 1) lab_admin ON true";
   api=api.slice(0,joinEnd)+extra+api.slice(joinEnd);
  }
 }
 return api;
}
