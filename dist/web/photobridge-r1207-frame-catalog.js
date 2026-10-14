(function(root){'use strict';
const specs=i=>i.variant_specs||{};
const size=i=>{const s=specs(i);return s.diameterCm?'دایره، قطر '+s.diameterCm:s.widthCm&&s.heightCm?s.widthCm+'×'+s.heightCm:'';};
const label=i=>[specs(i).color,size(i),specs(i).thicknessMm?'قطر / ضخامت '+specs(i).thicknessMm+' میلی‌متر':''].filter(Boolean).join(' · ');
function groups(items){const map=new Map();for(const item of items||[]){const s=specs(item),id=s.baseId||item.id;let g=map.get(id);if(!g){g={id,model:s.baseModel||item.model||item.title,material:s.material||'',description:item.description||'',category:item.category,variants:[],rows:[]};map.set(id,g)}g.rows.push(item);if(!s.archived){if(!g.variants.length){g.model=s.baseModel||item.model||item.title;g.material=s.material||'';g.description=item.description||'';g.category=item.category;}g.variants.push(item);}}return [...map.values()];}
function version(items){return JSON.stringify(items.filter(x=>!x.variant_specs?.archived).map(x=>[String(x.id),x.updated_at?new Date(x.updated_at).toISOString():'',String(x.variant_specs?.modelRevision||''),Number(x.sale_price||0),x.active!==false]).sort((a,b)=>a[0].localeCompare(b[0])));}
function colorHex(value){const raw=String(value||'').trim();if(/^#[0-9a-f]{6}$/i.test(raw))return raw.toLowerCase();return ({'قرمز':'#ef4444','آبی':'#2563eb','ابي':'#2563eb','مشکی':'#000000','سفید':'#ffffff','سبز':'#16a34a','زرد':'#facc15','طلایی':'#d4af37','نقره‌ای':'#c0c0c0','قهوه‌ای':'#92400e','صورتی':'#ec4899','خاکستری':'#808080','کرم':'#fff4d1','بنفش':'#9333ea'})[raw]||'#808080';}
const pricingKey=i=>{const s=specs(i);return JSON.stringify([s.widthCm??null,s.heightCm??null,s.diameterCm??null,s.thicknessMm??null]);};
function modelColors(g){return [...new Set(g.variants.flatMap(i=>i.variant_specs?.modelColors||[i.variant_specs?.color]).filter(Boolean))];}
function pricingRows(g){const map=new Map();for(const item of g.variants){const key=pricingKey(item);let entry=map.get(key);if(!entry){entry={item,rows:[],conflict:false};map.set(key,entry);}entry.rows.push(item);if(Number(item.sale_price)!==Number(entry.item.sale_price))entry.conflict=true;}return [...map.values()];}
const api={groups,size,label,version,colorHex,pricingKey,modelColors,pricingRows};if(typeof module==='object'&&module.exports)module.exports=api;else root.PBFrameCatalog=api;
})(typeof window==='undefined'?globalThis:window);

