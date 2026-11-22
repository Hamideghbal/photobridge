// R1961 — photographer orders must read the current priced cover matrix, not a legacy-only projection.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/api/server.js';
let src=fs.readFileSync(path,'utf8');
const beginning='async function albumCatalogForLabOriginal(';
const helper=`function pb1961CoversFromPricedVariants(catalog,sizes,legacyRows,includeInactive=false) {
  const oldCovers=(legacyRows||[]).map(r=>({
    id:r.id,name:r.name,materialName:r.material_name||r.name||'جلد',modelName:r.model_name||'استاندارد',
    price:Number(r.price||0),sizeId:r.size_id||null,sizeLabel:r.size_label||'',imageData:r.image_data||'',
    previewPresetKey:r.preview_preset_key||'simple',active:Boolean(r.active),sortOrder:Number(r.sort_order||0),
    colors:(Array.isArray(r.colors)?r.colors:[]).map(c=>({...c,price:Number(c.price||0)}))
  }));
  const materials=new Map((catalog?.materials||[]).map(m=>[String(m.id),m]));
  const types=new Map((catalog?.types||[]).map(t=>[String(t.id),t]));
  const colors=new Map((catalog?.colors||[]).map(c=>[String(c.id),c]));
  const albumSizes=new Map((sizes||[]).map(s=>[String(s.id),s]));
  const modern=[];
  for(const v of catalog?.variants||[]){
    if(!includeInactive&&v.active===false)continue;
    const material=materials.get(String(v.materialId)),type=types.get(String(v.typeId));
    if(!material||!type||(!includeInactive&&(material.active===false||type.active===false)))continue;
    if(String(type.name||'')==='__PB_COLOR_PALETTE__')continue;
    const chosen=new Set((v.colorIds||[]).map(String));
    const group=new Map();
    for(const p of v.prices||[]){
      const size=albumSizes.get(String(p.sizeId)),color=colors.get(String(p.colorId));
      const n=Number(p.price);
      if(!size||!color||!Number.isFinite(n)||n<=0)continue;
      if(!includeInactive&&(size.active===false||color.active===false||!chosen.has(String(p.colorId))))continue;
      const id=String(p.sizeId),arr=group.get(id)||[];
      arr.push({id:'catalog-color:'+String(v.id)+':'+String(p.sizeId)+':'+String(color.id),name:color.name,colorValue:color.colorValue||'',price:n,
        active:color.active!==false,sortOrder:Number(color.sortOrder||0)});
      group.set(id,arr);
    }
    for(const [sizeId,rows] of group){
      if(!rows.length)continue;
      const size=albumSizes.get(sizeId);
      const materialName=String(material.name||'جلد'),modelName=String(type.name||'استاندارد');
      modern.push({id:'catalog:'+String(v.id)+':'+sizeId,
        name:modelName==='استاندارد'?materialName:materialName+' · '+modelName,
        materialName,modelName,price:Math.min(...rows.map(x=>x.price)),
        sizeId,sizeLabel:String(size.label||''),imageData:type.imageData||'',
        previewPresetKey:type.previewPresetKey||'simple',
        active:v.active!==false,sortOrder:Number(v.sortOrder||0),colors:rows});
    }
  }
  // When the new matrix is priced, it is authoritative: do not resurrect stale legacy cover models.
  return modern.length?modern:oldCovers;
}`;
if(src.split(beginning).length!==2)throw Error('[R1961] expected original album catalog function exactly once');
src=src.replace(beginning,helper+'\n'+beginning);
const start=src.indexOf(beginning),end=src.indexOf('\nasync function ',start+beginning.length);
const fragment=src.slice(start,end);
const at=fragment.indexOf('covers: pb1803RecoverPricedCovers(');
const stop=fragment.indexOf(', coverCatalog, extras:',at);
if(at<0||stop<=at)throw Error('[R1961] R1803 reader projection missing');
const updated=fragment.slice(0,at)+'covers: pb1961CoversFromPricedVariants(coverCatalog,sq.rows,cq.rows,includeInactive)'+fragment.slice(stop);
src=src.slice(0,start)+updated+src.slice(end);
// The laboratory save route used the legacy binding price as an eligibility gate.
// R1960 now synchronizes every active separately/combined priced binding size,
// including sizes whose legacy binding_price is zero. Saving must preserve them.
// Isolate the saver declaration itself: later patches may extend its pricing predicate.
const savePrefix='const b = await bodyJson(req, 12_000_000), albumBase = await albumCatalogForLab(labId, true), sizes = ';
const saveBegin=src.indexOf(savePrefix);
const saveEnd=saveBegin<0?-1:src.indexOf(', extras =',saveBegin+savePrefix.length);
if(saveBegin<0||saveEnd<=saveBegin||saveEnd-saveBegin>1000)throw Error('[R1961] lab album-settings size gate not uniquely found');
const priorFilter=src.slice(saveBegin+savePrefix.length,saveEnd);
if(!priorFilter.includes('bindingPrice')&&!priorFilter.includes('albumCombinedRates'))throw Error('[R1961] expected legacy size-price gate missing');
src=src.slice(0,saveBegin+savePrefix.length)+'(albumBase.sizes || []).filter((x) => x.active !== false)'+src.slice(saveEnd);
// R1805 already broadened the SQL map; preserve its existing active-only contract.
const existingDb='SELECT id,label FROM lab_album_sizes WHERE lab_id=$1 AND active=true ORDER BY sort_order,label';
if(src.split(existingDb).length!==2)throw Error('[R1961] R1805 active album size ID map missing');
fs.writeFileSync(path,src);
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
console.log('[R1961] photographer order cover choices now use the priced material/model/color/size matrix');
