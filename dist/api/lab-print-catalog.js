import crypto from 'node:crypto';
const defaults=[
 {id:'luster',kind:'paper',name:'لاستر',legacy:true,active:true},
 {id:'silk',kind:'paper',name:'سیلک',legacy:true,active:true},
 {id:'metallic',kind:'paper',name:'متالیک',legacy:true,active:true},
 {id:'album_binding_price',kind:'binding',name:'صحافی آلبوم',legacy:true,active:true},
 // Existing single-model prices remain stored in lab_prices / walkin_prices.
 {id:'chassis',kind:'chassis',name:'شاسی معمولی',legacy:true,active:true},
 {id:'frame',kind:'frame',name:'قاب معمولی',legacy:true,active:true}
];
const fail=code=>{throw Object.assign(Error(code),{status:400})};
const text=v=>String(v??'').normalize('NFC').trim();
export function normalizePrintCatalog(raw){
 const data=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const originals=Array.isArray(data.types)?data.types:[];
 const known=new Map(defaults.map(d=>[d.id,{...d,name:text(originals.find(t=>t?.id===d.id)?.name)||d.name}]));
 const limits={binding:0,chassis:0,frame:0};
 for(const row of originals){
  if(!row||typeof row!=='object'||!['binding','chassis','frame'].includes(row.kind)||!row.id)continue;
  const id=text(row.id),name=text(row.name);
  if(known.has(id))continue;
  if(!/^c_[0-9a-f-]{36}$/.test(id)||!name||name.length>70)continue;
  if(limits[row.kind]++>=30)continue;
  known.set(id,{id,kind:row.kind,name,legacy:false,active:row.active!==false});
 }
 const types=[...known.values()];
 const allowed=types.filter(t=>!t.legacy);
 const normalizeRates=input=>{
  const result={};
  for(const [sizeId,stored] of Object.entries(input||{})){
   if(!/^[a-zA-Z0-9_-]{1,110}$/.test(sizeId)||!stored||typeof stored!=='object'||Array.isArray(stored))continue;
   const obj={};
   for(const type of allowed){
    // Walk-in has no binding models; colleague prices retain all model types.
    if(input===data.walkinRates&&type.kind==='binding')continue;
    const v=stored[type.id];
    if(v===null||v===''){obj[type.id]=null;continue}
    if(v===undefined)continue;
    if(Number.isSafeInteger(Number(v))&&Number(v)>=0&&Number(v)<=9000000000)obj[type.id]=Number(v);
   }
   if(Object.keys(obj).length)result[sizeId]=obj;
  }
  return result;
 };
 return {types,rates:normalizeRates(data.rates),walkinRates:normalizeRates(data.walkinRates)};
}
function cleanName(value){const name=text(value);if(!name||name.length>70||/[<>\x00-\x1f]/.test(name))fail('print_catalog_invalid_name');return name;}
function ensureUnique(types,kind,name,except=''){if(types.some(t=>t.active&&t.kind===kind&&t.id!==except&&t.name.localeCompare(name,'fa',{sensitivity:'base'})===0))fail('print_catalog_duplicate_name');}
export function addPrintType(catalog,{kind,name}){
 if(!['binding','chassis','frame'].includes(kind))fail('print_catalog_invalid_kind');
 name=cleanName(name);
 if(catalog.types.filter(t=>t.kind===kind&&!t.legacy).length>=30)fail('print_catalog_limit');
 ensureUnique(catalog.types,kind,name);
 return {...catalog,types:[...catalog.types,{id:'c_'+crypto.randomUUID(),kind,name,legacy:false,active:true}]};
}
export function renamePrintType(catalog,id,name){
 name=cleanName(name);
 const current=catalog.types.find(t=>t.id===id);
 if(!current||!['binding','chassis','frame'].includes(current.kind))fail('print_catalog_not_found');
 ensureUnique(catalog.types,current.kind,name,id);
 return {...catalog,types:catalog.types.map(t=>t.id===id?{...t,name}:t)};
}
// Never hard-delete an album model: historic invoice snapshots and prices may reference its ID.
export function archivePrintBinding(catalog,id){
 const current=catalog.types.find(type=>type.id===id);
 if(!current||current.legacy||!['binding','chassis','frame'].includes(current.kind))fail('print_catalog_cannot_remove_type');
 return {...catalog,types:catalog.types.map(type=>type.id===id?{...type,active:false}:type)};
}
// Store separate prices for colleagues and direct walk-in customers.
// Never change existing legacy chassis/frame columns, their stock, or historical invoices.
function applyAudienceRates(catalog,rows,sizeIds,audience){
 if(!Array.isArray(rows)||rows.length>300)fail('print_catalog_invalid_rows');
 const free=audience==='walkin',key=free?'walkinRates':'rates';
 const allowed=new Set(catalog.types.filter(t=>!t.legacy&&t.active!==false&&(!free||t.kind!=='binding')).map(t=>t.id));
 const sizes=new Set(sizeIds.map(String)),rates={...(catalog[key]||{})};
 for(const row of rows){
  const sizeId=String(row?.sizeId||'');
  if(!sizes.has(sizeId))fail('invalid_print_size');
  const input=row?.customRates;
  if(input==null)continue;
  if(!input||typeof input!=='object'||Array.isArray(input))fail('print_catalog_invalid_rates');
  const next={...(rates[sizeId]||{})};
  for(const [id,raw] of Object.entries(input)){
   if(!allowed.has(id))fail('print_catalog_unknown_type');
   if(raw===null||raw===''){next[id]=null;continue}
   const n=Number(raw);
   if(!Number.isSafeInteger(n)||n<0||n>9000000000)fail('print_catalog_invalid_price');
   next[id]=n;
  }
  rates[sizeId]=next;
 }
 return {...catalog,[key]:rates};
}
export function applyPrintRates(catalog,rows,sizeIds){return applyAudienceRates(catalog,rows,sizeIds,'colleague')}
export function applyWalkinPrintRates(catalog,rows,sizeIds){return applyAudienceRates(catalog,rows,sizeIds,'walkin')}
export async function handleLabPrintCatalog({req,res,url,pool,labId,bodyJson,sendJson,audit,userId}){
 if(!['/api/lab/print-catalog','/api/lab/print-catalog/type'].includes(url.pathname))return false;
 const method=req.method,root=url.pathname==='/api/lab/print-catalog';
 if(root&&method==='GET'){
  const row=(await pool.query('SELECT ui_preferences FROM labs WHERE id=$1',[labId])).rows[0];
  return sendJson(res,200,{catalog:normalizePrintCatalog(row?.ui_preferences?.printTariffCatalog)}),true;
 }
 if(!(root&&method==='POST'||!root&&method==='PATCH'))return sendJson(res,405,{error:'method_not_allowed'}),true;
 const body=await bodyJson(req);
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  const q=await c.query('SELECT ui_preferences FROM labs WHERE id=$1 FOR UPDATE',[labId]);
  if(!q.rowCount)fail('lab_not_found');
  const prefs=q.rows[0].ui_preferences||{};
  const catalog=normalizePrintCatalog(prefs.printTariffCatalog);
  const updated=method==='POST'?addPrintType(catalog,body):body.active===false?archivePrintBinding(catalog,text(body.id)):renamePrintType(catalog,text(body.id),body.name);
  await c.query("UPDATE labs SET ui_preferences=jsonb_set(COALESCE(ui_preferences,'{}'::jsonb),'{printTariffCatalog}',$2::jsonb,true),updated_at=now() WHERE id=$1",[labId,JSON.stringify(updated)]);
  await c.query('COMMIT');
  await audit(userId,labId,method==='POST'?'print_catalog.type_create':body.active===false?'print_catalog.type_archive':'print_catalog.type_rename','lab',labId,{kind:body.kind,id:body.id||updated.types.at(-1)?.id}).catch(()=>{});
  sendJson(res,200,{ok:true,catalog:updated});return true;
 }catch(e){await c.query('ROLLBACK').catch(()=>{});if(e.status)return sendJson(res,e.status,{error:e.message}),true;throw e}finally{c.release()}
}
