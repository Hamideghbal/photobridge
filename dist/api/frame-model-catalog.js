import crypto from 'node:crypto';
import {isProductionShop} from './frame-production.js';
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export function frameModelVersion(rows){return JSON.stringify(rows.filter(x=>!x.variant_specs?.archived).map(x=>[String(x.id),x.updated_at?new Date(x.updated_at).toISOString():'',String(x.variant_specs?.modelRevision||''),Number(x.sale_price||0),x.active!==false]).sort((a,b)=>a[0].localeCompare(b[0])));}
export async function saveFrameModel(db,{shop,body,modelId=null,frameVariant,galleryNormalize,normalizeDigits}){
 if(!isProductionShop(shop))fail('production_shop_unavailable',404);
 const material=String(body.material||'').trim(),model=String(body.model||'').trim(),description=String(body.description||'').trim();
 if(!material||material.length>80||!model||model.length>100||description.length>3000)fail('frame_base_required');
 if(!Array.isArray(body.variants)||!body.variants.length||body.variants.length>50)fail('frame_variants_required');
 if(modelId&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelId))fail('frame_model_not_found',404);const id=modelId||crypto.randomUUID();
 await db.query('BEGIN');try{
 await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[shop.id+':frame-model:'+id]);
 const existing=modelId?(await db.query("SELECT * FROM equipment_sale_items WHERE shop_id=$1 AND deleted_at IS NULL AND (variant_specs->>'baseId'=$2 OR id=$2::uuid) ORDER BY id FOR UPDATE",[shop.id,id])).rows:[];
 if(modelId&&!existing.length)fail('frame_model_not_found',404);
 if(modelId&&body.version!==frameModelVersion(existing))fail('frame_model_changed',409);
 const old=new Map(existing.map(x=>[String(x.id),x])),seen=new Set(),ids=new Set(),variants=[];
 const kind=shop.business_category==='chassis'?'chassis':shop.business_category==='frame'?'frame':body.kind;
 if(!['frame','chassis'].includes(kind))fail('frame_kind_required');
 const modelRevision=crypto.randomUUID();
 for(const input of body.variants){
 if(!input||typeof input!=='object'||Array.isArray(input))fail('frame_variant_specs_required');if(input.active!==undefined&&typeof input.active!=='boolean')fail('frame_variant_specs_required');
 const current=input.id?old.get(String(input.id)):null;if(input.id&&!current)fail('frame_variant_not_found',404);if(current&&ids.has(current.id))fail('frame_variant_duplicate');if(current)ids.add(current.id);
 const b={model,variantMaterial:material,variantColor:input.color,variantWidthCm:input.widthCm??'',variantHeightCm:input.heightCm??'',variantDiameterCm:input.diameterCm??'',variantThicknessMm:input.thicknessMm??''};
 const v=frameVariant(shop,b);if(v.error)fail(v.error);
 const raw=normalizeDigits(String(input.price??'')).replace(/[٬,\s]/g,'');const price=Number(raw);if(!raw||!Number.isSafeInteger(price)||price<0)fail('frame_variant_price_required');
 const signature=JSON.stringify([v.specs.color,v.specs.widthCm,v.specs.heightCm,v.specs.diameterCm,v.specs.thicknessMm]);if(seen.has(signature))fail('frame_variant_duplicate');seen.add(signature);
 const gallery=input.galleryImages===undefined?(current?.gallery_images||[]):galleryNormalize(input.galleryImages,shop.id);if(!Array.isArray(gallery)||gallery.length>8)fail('frame_variant_image_invalid');
 variants.push({id:current?.id||crypto.randomUUID(),current,price,active:input.active!==false,gallery,variant:{...v,specs:{...v.specs,baseId:id,modelRevision}}});
 }
 // Omitted combinations become unavailable; keep rows referenced by historical orders.
 for(const item of existing)if(!ids.has(item.id))await db.query("UPDATE equipment_sale_items SET active=false,variant_specs=jsonb_set(variant_specs,'{archived}','true'::jsonb),updated_at=now() WHERE id=$1 AND shop_id=$2",[item.id,shop.id]);
 const saved=[];for(const v of variants){const image=v.gallery.find(x=>x.objectKey)||null;const values=[v.id,shop.id,kind+'_custom',v.variant.model,v.price,v.active,description||null,image?.objectKey||null,image?.name||null,image?.contentType||null,image?.bytes||null,JSON.stringify(v.gallery),JSON.stringify(v.variant.specs)];
 const row=(await db.query(`INSERT INTO equipment_sale_items(id,shop_id,category,title,model,sale_price,stock_total,active,description,image_object_key,image_name,image_content_type,image_bytes,gallery_images,variant_specs) VALUES($1,$2,$3,$4,$4,$5,1,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb) ON CONFLICT(id) DO UPDATE SET category=EXCLUDED.category,title=EXCLUDED.title,model=EXCLUDED.model,sale_price=EXCLUDED.sale_price,active=EXCLUDED.active,description=EXCLUDED.description,image_object_key=EXCLUDED.image_object_key,image_name=EXCLUDED.image_name,image_content_type=EXCLUDED.image_content_type,image_bytes=EXCLUDED.image_bytes,gallery_images=EXCLUDED.gallery_images,variant_specs=EXCLUDED.variant_specs,updated_at=now() WHERE equipment_sale_items.shop_id=EXCLUDED.shop_id RETURNING *`,values)).rows[0];if(!row)fail('frame_variant_not_found',404);saved.push(row);
 }
 await db.query('COMMIT');return {id,items:saved};
 }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e;}
}
