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
