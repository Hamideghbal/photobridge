import crypto from 'node:crypto';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Call after BEGIN and before business writes. Unique INSERT waits for an
// in-flight request to commit, so even simultaneous retries see one result.
export async function beginDesktopOperation(c,labId,method,requestPath,body){
  const id=String(body?.desktopOperationId||'').trim();
  if(!id)return null;
  if(!UUID.test(id))return {replayed:true,status:400,response:{error:'invalid_desktop_operation_id'}};
  const payload={...body};delete payload.desktopOperationId;
  const hash=crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const inserted=await c.query(`INSERT INTO lab_desktop_operations(lab_id,operation_id,method,request_path,payload_hash)
    VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING operation_id`,
    [labId,id,method,requestPath,hash]);
  if(inserted.rowCount)return {id,replayed:false};
  const prior=(await c.query(`SELECT method,request_path,payload_hash,http_status,response
    FROM lab_desktop_operations WHERE lab_id=$1 AND operation_id=$2`,[labId,id])).rows[0];
  if(!prior||prior.method!==method||prior.request_path!==requestPath||prior.payload_hash!==hash)
    return {replayed:true,status:409,response:{error:'desktop_operation_conflict'}};
  if(!prior.http_status||!prior.response)
    return {replayed:true,status:409,response:{error:'desktop_operation_incomplete'}};
  return {id,replayed:true,status:prior.http_status,response:prior.response};
}

export async function finishDesktopOperation(c,labId,op,status,response){
  if(!op)return;
  await c.query(`UPDATE lab_desktop_operations SET http_status=$3,response=$4::jsonb
    WHERE lab_id=$1 AND operation_id=$2`,[labId,op.id,status,JSON.stringify(response)]);
}
