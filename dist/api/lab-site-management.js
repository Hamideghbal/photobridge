import {defaultLabSite,mergeLabSite,SITE_FIELDS,SITE_IMAGES,SITE_SECTIONS} from './lab-site-content.js';
const fail=(error,status=400)=>{throw Object.assign(new Error(error),{status});};
export async function normalizeLabSite(input,sharp,allowedImages=SITE_IMAGES){
 if(!input||typeof input!=='object'||Array.isArray(input))fail('invalid_site_config');
 const out={};
 for(const [key,max]of Object.entries(SITE_FIELDS)){if(input[key]===undefined)continue;if(typeof input[key]!=='string'||input[key].length>max)fail('invalid_site_text');out[key]=input[key].trim();}
 for(const k of ['displayName','heroTitle'])if(out[k]!==undefined&&!out[k])fail('site_title_required');
 if(out.phone&&!/^[+0-9۰-۹٠-٩()\s-]{5,40}$/.test(out.phone))fail('invalid_site_phone');
 for(const key of ['primary','background','ink'])if(input[key]!==undefined){if(!/^#[0-9a-f]{6}$/i.test(input[key]))fail('invalid_site_color');out[key]=input[key];}
 if(input.font!==undefined){if(!['Vazirmatn','Tahoma','Arial'].includes(input.font))fail('invalid_site_font');out.font=input.font;}
 if(input.fontSize!==undefined){if(!Number.isInteger(input.fontSize)||input.fontSize<14||input.fontSize>20)fail('invalid_site_font_size');out.fontSize=input.fontSize;}
 for(const key of ['sections','hidden'])if(input[key]!==undefined){const list=input[key];if(!Array.isArray(list)||list.some(x=>!SITE_SECTIONS.includes(x))||new Set(list).size!==list.length)fail('invalid_site_sections');if(key==='sections'&&list.length!==SITE_SECTIONS.length)fail('invalid_site_sections');out[key]=[...list];}
 if(input.images!==undefined){if(!input.images||typeof input.images!=='object'||Array.isArray(input.images))fail('invalid_site_image');out.images={};for(const key of Object.keys(allowedImages)){
  const value=input.images[key];if(value===undefined)continue;if(Object.values(allowedImages).includes(value)){out.images[key]=value;continue;}
  if(typeof value!=='string'||value.length>600000||!/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/]+={0,2}$/.test(value))fail('invalid_site_image');
  const bytes=Buffer.from(value.split(',')[1],'base64');if(bytes.length>430000)fail('site_image_too_large');
  let result;try{result=await sharp(bytes,{limitInputPixels:20000000,animated:false}).rotate().resize({width:1400,height:1400,fit:'inside',withoutEnlargement:true}).webp({quality:80}).toBuffer();}catch{fail('invalid_site_image');}
  if(result.length>280000)fail('site_image_too_large');out.images[key]='data:image/webp;base64,'+result.toString('base64');
 }}return out;
}
export async function getLabSiteState(pool,labId){
 const lab=(await pool.query('SELECT id,name,slug,province,city,walkin_enabled,walkin_show_prices FROM labs WHERE id=$1',[labId])).rows[0];
 if(!lab)fail('lab_not_found',404);
 const row=(await pool.query('SELECT config,revision FROM lab_public_site_content WHERE lab_id=$1',[labId])).rows[0];
 return {lab,config:mergeLabSite(lab,row?.config||{}),revision:row?.revision||0};
}
export async function handleLabSiteManagement(req,res,url,actor,d){
 if(url.pathname!=='/api/lab/site')return false;
 const reply=(status,body)=>{res.setHeader?.('Cache-Control','private, no-store');d.sendJson(res,status,body);return true;};
 if(actor?.labRole!=='lab_admin'||!actor.labId)return reply(403,{error:'forbidden'});
 try{
 if(req.method==='GET'){const state=await getLabSiteState(d.pool,actor.labId),domains=(await d.pool.query('SELECT hostname,active FROM equipment_store_domains WHERE lab_id=$1 AND released_at IS NULL ORDER BY created_at',[actor.labId])).rows;return reply(200,{...state,domains});}
 if(req.method==='PUT'){
  if(req.headers.origin!==d.publicOrigin)return reply(403,{error:'invalid_origin'});
  const body=await d.bodyJson(req,3500000);if(!body||!Number.isInteger(body.revision)||body.revision<0)fail('invalid_site_revision');
  const current=(await d.pool.query('SELECT revision FROM lab_public_site_content WHERE lab_id=$1',[actor.labId])).rows[0];if(!current&&body.revision!==0)fail('site_revision_conflict',409);
  const normalized=await normalizeLabSite(body.config,d.sharp);
  const row=(await d.pool.query(`INSERT INTO lab_public_site_content(lab_id,config,updated_by,revision) VALUES($1,$2::jsonb,$3,1)
   ON CONFLICT(lab_id) DO UPDATE SET config=EXCLUDED.config,updated_by=EXCLUDED.updated_by,revision=lab_public_site_content.revision+1,updated_at=now()
   WHERE lab_public_site_content.revision=$4 RETURNING revision,config`,[actor.labId,JSON.stringify(normalized),actor.userId,body.revision])).rows[0];
  if(!row)fail('site_revision_conflict',409);
  await d.audit(actor.userId,actor.labId,'lab_site.update','lab',actor.labId,{revision:row.revision,fields:Object.keys(normalized)});
  const lab=(await d.pool.query('SELECT id,name,slug,province,city,walkin_enabled,walkin_show_prices FROM labs WHERE id=$1',[actor.labId])).rows[0];
  return reply(200,{revision:row.revision,config:mergeLabSite(lab,row.config)});
 }
 return reply(405,{error:'method_not_allowed'});
 }catch(e){if(e.status)return reply(e.status,{error:e.message});throw e;}
}
