(function(root){'use strict';
const specs=i=>i.variant_specs||{};
const size=i=>{const s=specs(i);return s.diameterCm?'دایره، قطر '+s.diameterCm:s.widthCm&&s.heightCm?s.widthCm+'×'+s.heightCm:'';};
const label=i=>[specs(i).color,size(i),specs(i).thicknessMm?'قطر / ضخامت '+specs(i).thicknessMm+' میلی‌متر':''].filter(Boolean).join(' · ');
function groups(items){const map=new Map();for(const item of items||[]){const s=specs(item),id=s.baseId||item.id;let g=map.get(id);if(!g){g={id,model:s.baseModel||item.model||item.title,material:s.material||'',description:item.description||'',category:item.category,variants:[],rows:[]};map.set(id,g)}g.rows.push(item);if(!s.archived){if(!g.variants.length){g.model=s.baseModel||item.model||item.title;g.material=s.material||'';g.description=item.description||'';g.category=item.category;}g.variants.push(item);}}return [...map.values()];}
function version(items){return JSON.stringify(items.filter(x=>!x.variant_specs?.archived).map(x=>[String(x.id),x.updated_at?new Date(x.updated_at).toISOString():'',String(x.variant_specs?.modelRevision||''),Number(x.sale_price||0),x.active!==false]).sort((a,b)=>a[0].localeCompare(b[0])));}
const api={groups,size,label,version};if(typeof module==='object'&&module.exports)module.exports=api;else root.PBFrameCatalog=api;
})(typeof window==='undefined'?globalThis:window);
