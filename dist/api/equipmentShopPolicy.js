// Shared, independently configured sale and rental reach. The server is authoritative.
export function normalizeReach(input, fallback={mode:'all',provinces:[],cities:[]}){
  const x=input&&typeof input==='object'&&!Array.isArray(input)?input:fallback;
  const mode=['all','local','selected'].includes(x.mode)?x.mode:'all';
  const clean=list=>[...new Set((Array.isArray(list)?list:[]).map(v=>String(v||'').trim()).filter(Boolean))].slice(0,100);
  return {mode,provinces:clean(x.provinces),cities:clean(x.cities)};
}
export function reachAllows(shop,channel,location){
  if(!shop||shop.active===false||shop[`${channel}_enabled`]===false)return false;
  const reach=normalizeReach(shop[`${channel}_reach`]);
  if(reach.mode==='all')return true;
  const province=String(location?.province||'').trim(),city=String(location?.city||'').trim();
  if(!province)return false;
  if(reach.mode==='local')return province===String(shop.province||'').trim()&&city===String(shop.city||'').trim();
  return reach.cities.includes(`${province}/${city}`)||reach.provinces.includes(province);
}
export function discountedAmount(gross,permanent,birthday){
  const amount=Math.max(0,Math.round(Number(gross)||0));
  const pct=Math.max(0,Math.min(100,Math.max(Number(permanent)||0,Number(birthday)||0)));
  const discount=Math.min(amount,Math.round(amount*pct/100));
  return {grossAmount:amount,discountPercent:pct,discountAmount:discount,totalAmount:amount-discount,
    discountReason:pct?Number(birthday)>=Number(permanent)?'birthday':'permanent':null};
}
