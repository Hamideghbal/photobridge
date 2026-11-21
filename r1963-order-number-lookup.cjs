'use strict';
async function lookup(request,awaiting,attempt=0){
 const numbers=[...new Set(awaiting.map(x=>String(x.number||'')).filter(x=>/^\d{1,12}$/.test(x)))];
 const legacy=async()=>{const r=await request('/api/lab/orders',{signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error('order_list_http_'+r.status);return r.json();};
 if(!numbers.length||numbers.length>4||attempt>=2)return legacy();
 const urls=numbers.flatMap(n=>['print','album'].map(mode=>'/api/lab/orders?paged=1&mode='+mode+'&stage=flow&page=1&q='+encodeURIComponent(n)));
 const out=await Promise.allSettled(urls.map(async url=>{const r=await request(url,{signal:AbortSignal.timeout(6000)});if(!r.ok)throw Error('paged_http_'+r.status);const body=await r.json();if(!Array.isArray(body.orders))throw Error('invalid_paged_orders');return body.orders;}));
 const good=out.filter(x=>x.status==='fulfilled').flatMap(x=>x.value);
 if(!good.length)return legacy();
 const ids=new Map();for(const row of good)if(row?.id)ids.set(row.id,row);
 return {orders:[...ids.values()]};
}
module.exports={lookup};
