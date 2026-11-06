// R1569: batch metadata for *device-local*, print-only manual intake.
// No picture bytes are uploaded or returned. The whole batch commits atomically.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail=(code,status=400)=>Object.assign(new Error(code),{status});
export const localBatchPath=/^\/api\/lab\/delegated-orders\/([0-9a-f-]{36})\/files\/local-batch$/i;
export function prepareLocalBatch(files,{labId,order,safeFileName,maxBytes}){
 if(!Array.isArray(files)||files.length<1||files.length>100)throw fail('invalid_local_batch_size');
 const ids=new Set();
 return files.map(b=>{
  if(!b||typeof b!=='object'||Array.isArray(b))throw fail('invalid_local_file');
  const id=String(b.clientFileId||'').trim();
  if(!UUID.test(id)||ids.has(id))throw fail('invalid_or_duplicate_client_file_id');
  ids.add(id);
  const copies=Number(b.printCopies??1),size=String(b.printSizeId||''),type=String(b.printType||'');
  const bytes=Number(b.bytes||0);
  if(!Number.isInteger(copies)||copies<1||copies>99)throw fail('invalid_print_copies');
  // Print-size IDs are catalog text keys (for example '13x18'), not file UUIDs.
  // The authenticated handler checks each key with labCanUsePrintSize below.
  if(!size||size.length>200)throw fail('print_selection_required');
  if(!['luster','silk','metallic'].includes(type))throw fail('print_selection_required');
  if(!Number.isSafeInteger(bytes)||bytes<1||bytes>maxBytes)throw fail('invalid_file_size',413);
  const sourceName=String(b.name||'file');
  let name=safeFileName(sourceName);
  if(copies>1){
   const dot=name.lastIndexOf('.'),stem=dot>0?name.slice(0,dot):name,ext=dot>0?name.slice(dot):'';
   name=safeFileName(stem.slice(0,110)+' = '+copies+ext);
  }
  const relativePath=String(b.relativePath||b.name||'file').replace(/\\/g,'/').replace(/^\/+|\/+$/g,'').slice(0,900);
  const key=`client-local-recovery/${labId}/${order.id}/${id}-${name}`;
  return {
   clientFileId:id,rows:[id,order.id,labId,order.customer_id,name,relativePath,key,b.contentType||null,
    bytes,b.width?Number(b.width):null,b.height?Number(b.height):null,b.dpi?Number(b.dpi):null,
    size,type,Boolean(b.chassis),Boolean(b.frame),b.cropHandling==='lab'?'lab':'none',copies,'active'],
   printSizeId:size
  };
 });
}
export function localBatchInsert(items){
 if(!items.length)throw fail('empty_batch');
 const params=[],groups=[];
 for(const item of items){
  const offset=params.length;
  params.push(...item.rows);
  groups.push('('+item.rows.map((_,i)=>'$'+(offset+i+1)).join(',')+')');
 }
 const sql=`INSERT INTO order_files
  (id,order_id,lab_id,customer_id,original_name,relative_path,object_key,content_type,bytes,
   width,height,dpi,print_size_id,print_type,chassis,frame,crop_handling,print_copies,original_state)
  VALUES ${groups.join(',')}
  ON CONFLICT (id) DO UPDATE SET
   print_size_id=EXCLUDED.print_size_id,print_type=EXCLUDED.print_type,
   chassis=EXCLUDED.chassis,frame=EXCLUDED.frame,print_copies=EXCLUDED.print_copies
  WHERE order_files.order_id=EXCLUDED.order_id AND order_files.lab_id=EXCLUDED.lab_id
    AND order_files.bytes=EXCLUDED.bytes
    AND order_files.object_key LIKE ('client-local-recovery/' || EXCLUDED.lab_id::text || '/' || EXCLUDED.order_id::text || '/' || EXCLUDED.id::text || '-%')
    AND order_files.original_state='active'
  RETURNING id`;
 return {sql,params};
}
export async function handleLocalBatch({req,url,res,pool,labId,bodyJson,sendJson,requireLocalIntakePrimary,
 labCanUsePrintSize,safeFileName,maxBytes}){
 const match=url.pathname.match(localBatchPath);
 if(!match)return false;
 const respond=(status,data)=>{sendJson(res,status,data);return true;};
 if(req.method!=='POST')return respond(405,{error:'method_not_allowed'});
 const body=await bodyJson(req);
 if(body?.localOnly!==true)return respond(400,{error:'local_only_required'});
 // Authenticated laboratory admin route; only its registered primary local workstation can register local files.
 if(!await requireLocalIntakePrimary())return true;
 let c;
 try{
  c=await pool.connect();
  await c.query('BEGIN');
  const oq=await c.query(`SELECT o.id,o.customer_id,o.mode,o.status
    FROM lab_delegated_order_intakes d JOIN orders o ON o.id=d.order_id AND o.lab_id=d.lab_id
    WHERE d.lab_id=$1 AND o.id=$2 AND o.status='uploading' FOR UPDATE OF o`,[labId,match[1]]);
  const order=oq.rows[0];
  if(!order)throw fail('delegated_draft_not_found',404);
  if(order.mode!=='print')throw fail('print_only_batch',409);
  const items=prepareLocalBatch(body.files,{labId,order,safeFileName,maxBytes});
  const sizeIds=[...new Set(items.map(item=>item.printSizeId))];
  for(const size of sizeIds)if(!await labCanUsePrintSize(c,labId,size))throw fail('invalid_print_size');
  const {sql,params}=localBatchInsert(items),saved=await c.query(sql,params);
  if(saved.rowCount!==items.length)throw fail('local_batch_conflict',409);
  await c.query('COMMIT');
  return respond(201,{ok:true,storageMode:'device-local',
    files:items.map(item=>({clientFileId:item.clientFileId,fileId:item.clientFileId,storageMode:'device-local',uploadUrl:null}))});
 }catch(error){
  await c?.query('ROLLBACK').catch(()=>{});
  if(error.status)return respond(error.status,{error:error.message});
  if(error.code==='23505'||error.code==='23503')return respond(409,{error:'local_batch_conflict'});
  throw error;
 }finally{c?.release();}
}
