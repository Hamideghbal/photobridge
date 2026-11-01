'use strict';
const marker='/* PB1531 website-only invoice revision */';
function patchSiteReadyInvoice(source){
 if(source.includes(marker))return source;
 const start=source.indexOf('un=async le=>'),album=source.indexOf(',Cn=async(le,nt)=>',start),end=source.indexOf(',aa=async(le,nt)=>',album);
 if(start<0||album<0||end<0)throw Error('r1531_ready_handlers_missing');
 let print=source.slice(start,album),albums=source.slice(album,end);
 const once=(value,old,next,label)=>{if(value.split(old).length!==2)throw Error('r1531_incompatible_'+label);return value.replace(old,next)};
 const fresh='const pb1531Current=(await Me("/api/lab/orders/"+le.id)).order;if(!pb1531Current?.id||pb1531Current.id!==le.id)throw Error("order_not_found");';
 print=once(print,'try{if(nt){','try{'+marker+fresh+'if(nt){','print fresh order');
 const readyPayload='JSON.stringify({status:"ready",expectedRevision:pb1531Current.document_revision,expectedUpdatedAt:pb1531Current.updated_at})';
 print=once(print,'if(nt){await Me(`/api/lab/orders/${le.id}`,{method:"PATCH",body:JSON.stringify({status:"ready"})})',
   'if(nt){pb1531Current.status==="ready"||await Me(`/api/lab/orders/${le.id}`,{method:"PATCH",body:'+readyPayload+'})','no invoice idempotence');
 print=once(print,'const Zt=await Me(`/api/lab/orders/${le.id}`,{method:"PATCH",body:JSON.stringify({status:"ready"})});',
   'const Zt=pb1531Current.status==="ready"&&pb1531Current.invoice_id?{order:pb1531Current,invoice:((await Me("/api/lab/invoices")).invoices||[]).find(r=>r.id===pb1531Current.invoice_id)||null}:await Me(`/api/lab/orders/${le.id}`,{method:"PATCH",body:'+readyPayload+'});','existing invoice idempotence');
 // R1520 already adds revision from the stale queue card to album calls. Normalize
 // that generated form before installing the website's current-detail revision.
 albums=albums.replace('JSON.stringify({stage:nt,expectedUpdatedAt:le.updated_at,expectedRevision:le.document_revision})','JSON.stringify({stage:nt})');
 // Album stage uses a distinct API and must supply the same revision precondition.
 albums=once(albums,'try{const Zt=await Me(`/api/lab/orders/${le.id}/album-stage`,{method:"PUT",body:JSON.stringify({stage:nt})});',
 'try{const pb1531Current=(await Me("/api/lab/orders/"+le.id)).order;if(!pb1531Current?.id||pb1531Current.id!==le.id)throw Error("order_not_found");const Zt=nt==="ready"&&pb1531Current.status==="ready"&&pb1531Current.invoice_id?{order:pb1531Current,invoice:((await Me("/api/lab/invoices")).invoices||[]).find(r=>r.id===pb1531Current.invoice_id)||null}:await Me(`/api/lab/orders/${le.id}/album-stage`,{method:"PUT",body:JSON.stringify({stage:nt,expectedRevision:pb1531Current.document_revision,expectedUpdatedAt:pb1531Current.updated_at})});',
 'album ready revision');
 return source.slice(0,start)+print+albums+source.slice(end);
}
module.exports={marker,patchSiteReadyInvoice};
