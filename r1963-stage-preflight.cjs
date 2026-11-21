'use strict';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Read-only detail overlaps subscription check; original invoice and write gates remain mandatory.
function prefetch({req,url,request,offline,body}){
 if(offline||!req||!url||!request||!['PATCH','PUT','POST'].includes(req.method))return null;
 const m=url.pathname.match(/^\/api\/lab\/orders\/([0-9a-f-]{36})(?:\/album-stage)?$/i);
 if(!m||!UUID.test(m[1]))return null;
 let value={};try{value=JSON.parse(Buffer.isBuffer(body)?body.toString('utf8'):String(body||'{}'));}catch{return null}
 if(!new Set(['printing','reviewing','needs_fix','designing','ready_print','printed','binding','ready','completed']).has(value.stage||value.status))return null;
 const orderId=m[1],path='/api/lab/orders/'+orderId;
 const promise=request(path,{method:'GET',signal:AbortSignal.timeout(5000)}).then(response=>({ok:response.ok,response})).catch(()=>({ok:false}));
 return {orderId,url:path,promise};
}
module.exports={prefetch};
