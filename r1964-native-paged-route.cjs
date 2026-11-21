'use strict';
function isPagedOrderRequest(req,url){return req?.method==='GET'&&url?.pathname==='/api/lab/orders'&&url.searchParams.get('paged')==='1'}
function validServerPage(bytes){
 try{
  const data=JSON.parse(Buffer.isBuffer(bytes)?bytes.toString('utf8'):String(bytes));
  if(!data||!Array.isArray(data.orders)||!data.counts||typeof data.counts!=='object')return false;
  const nat=n=>(typeof n==='number'&&Number.isSafeInteger(n)&&n>=0)||(typeof n==='string'&&/^\d+$/.test(n)&&Number.isSafeInteger(Number(n)));
  if(!['flow','ready','completed'].every(key=>nat(data.counts[key])))return false;
  if(!nat(data.total)||!nat(data.page)||!nat(data.pages)||!nat(data.pageSize))return false;
  if(Number(data.page)<1||Number(data.pages)<1||Number(data.page)>Number(data.pages)||Number(data.pageSize)!==10||data.orders.length>10)return false;
  if(data.stage&&!['flow','ready','completed'].includes(data.stage))return false;
  return true;
 }catch{return false}
}
module.exports={isPagedOrderRequest,validServerPage};
