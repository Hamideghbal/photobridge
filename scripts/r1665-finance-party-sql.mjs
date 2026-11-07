/* R1672: insert thermal-invoice party fields in the invoice SELECT only.
 * Never depend on its customer_name expression: finance/accounting stages
 * may replace that expression with a more descriptive display-name policy.
 */
export function withThermalInvoicePartyFields(source) {
 const fn='async function financeDocumentsForCustomer(';
 const fnAt=source.indexOf(fn);
 if(fnAt<0||source.indexOf(fn,fnAt+fn.length)!==-1)
  throw Error('R1665 finance documents function count not 1');
 const invAt=source.indexOf('const invQ',fnAt);
 const fromAt=source.indexOf('FROM invoices i',invAt);
 if(invAt<0||fromAt<0||fromAt-invAt>5000||invAt-fnAt>6000)
  throw Error('R1665 invoice SELECT boundary unavailable');
 let projection=source.slice(invAt,fromAt);
 if(!/SELECT\s+i\.\*/.test(projection)||!projection.includes('customer_name')||
    !source.slice(fromAt,fromAt+500).includes('JOIN orders o'))
  throw Error('R1665 invoice party projection shape unexpected');
 // Order-number projection can be rewritten by earlier finance stages. Use
 // the invoice SELECT head, whose scope and table joins were checked above.
 const selectAnchor=/\bSELECT\s+i\.\*\s*,/g;
 const selectCount=[...projection.matchAll(selectAnchor)].length;
 if(selectCount!==1)throw Error('R1665 invoice select anchor count '+selectCount);
 const mobilePresent=/\bcustomer_mobile\b/.test(projection);
 const kindPresent=/\bcustomer_kind\b/.test(projection);
 if(mobilePresent&&kindPresent)return source;
 const additions=[];
 if(!mobilePresent)additions.push('COALESCE(o.walkin_customer_mobile,u.mobile) customer_mobile');
 if(!kindPresent)additions.push("CASE WHEN o.source IN ('walkin','manual_invoice') OR EXISTS (SELECT 1 FROM lab_memberships pb_member WHERE pb_member.lab_id=o.lab_id AND pb_member.user_id=o.customer_id AND pb_member.role='customer' AND pb_member.active=true) OR NULLIF(BTRIM(o.walkin_customer_name),'') IS NOT NULL THEN 'customer' ELSE 'coworker' END customer_kind");
 projection=projection.replace(selectAnchor,match=>match+additions.join(',')+',');
 return source.slice(0,invAt)+projection+source.slice(fromAt);
}
