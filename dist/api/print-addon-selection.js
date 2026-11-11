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
export function snapshotPrintAddons(catalog,body){
 const input=body&&typeof body==='object'&&!Array.isArray(body)?body:{};
 const result={};
 if(selected(input.chassis)){
  const model=pick(catalog,'chassis',input.chassisModelId);
  result.chassis={id:model.id,name:String(model.name||'شاسی').slice(0,70)};
 }
 if(selected(input.frame)){
  const model=pick(catalog,'frame',input.frameModelId);
  const snapshot={id:model.id,name:String(model.name||'قاب').slice(0,70)};
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
