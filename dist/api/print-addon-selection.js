// R1779: immutable order-photo snapshot of chassis / frame model and frame color.
// Pure validation; selected names are resolved from the lab catalog, never from client text.
const err=code=>{throw Object.assign(new Error(code),{status:400})};
const selected=v=>v===true||v===1||v==='true'||v==='1';
const safe=id=>String(id||'').trim();
function pick(catalog,kind,modelId){
 const id=safe(modelId)||kind;
 const value=(catalog?.types||[]).find(v=>v.kind===kind&&v.id===id&&v.active!==false);
 if(!value)err('invalid_'+kind+'_model');
 return value;
}
export function snapshotPrintAddons(catalog,body,context={}){
 const input=body&&typeof body==='object'&&!Array.isArray(body)?body:{};
 const result={};
 // Prices are resolved on the server from the Lab's selected audience and size.
 // They travel with the order so later tariff edits cannot reprice a saved photo.
 const sizeId=String(context?.sizeId||'');
 const rates=context?.audience==='walkin'?catalog?.walkinRates:catalog?.rates;
 const priceFor=(model,kind)=>{
  if(!sizeId||model.legacy||model.id===kind)return {};
  const value=rates?.[sizeId]?.[model.id];
  if(value===undefined||value===null||value==='')err('addon_model_price_unavailable');
  const unitPrice=Number(value);
  if(!Number.isSafeInteger(unitPrice)||unitPrice<0||unitPrice>9000000000)err('addon_model_price_invalid');
  return {unitPrice};
 };
 if(selected(input.chassis)){
  const model=pick(catalog,'chassis',input.chassisModelId);
  result.chassis={id:model.id,name:String(model.name||'شاسی').slice(0,70),...priceFor(model,'chassis')};
 }
 if(selected(input.frame)){
  const model=pick(catalog,'frame',input.frameModelId);
  const snapshot={id:model.id,name:String(model.name||'قاب').slice(0,70),...priceFor(model,'frame')};
  const colors=Array.isArray(model.colors)?model.colors:[];
  if(colors.length){
   const available=colors.filter(c=>c.available!==false);
   if(!available.length)err('frame_color_unavailable');
   const colorId=safe(input.frameColorId)|| (available.length===1?available[0].id:'');
   const color=available.find(c=>c.id===colorId);
   if(!color)err('invalid_frame_color');
   snapshot.colorId=color.id;
   snapshot.colorName=String(color.name||'').slice(0,40);
  }else if(input.frameColorId){
   err('invalid_frame_color');
  }
  result.frame=snapshot;
 }
 return result;
}
