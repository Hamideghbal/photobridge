import crypto from 'node:crypto';
import {pipeline} from 'node:stream/promises';
import trust from './store-update-trust.cjs';
export function cleanStoreUpdate(m,release,key){
 if(!trust.valid(m,key)||m.version!==release.version||m.size!==release.bytes||!/^PhotoBridge-Store(?:-R\d+)?-Setup-[\d.]+-x64\.exe$/i.test(release.name))return null;
 return {protocol:1,channel:'store',version:m.version,size:m.size,sha256:m.sha256,signature:m.signature}
}
export async function validateStoreUpdate(m,release,getObject,key){
 const update=cleanStoreUpdate(m,release,key);if(!update)throw Error('invalid_update_manifest');
 const object=await getObject(release.objectKey);let size=0;const hash=crypto.createHash('sha256');
 for await(const chunk of object.Body){size+=chunk.length;if(size>update.size)throw Error('update_size_mismatch');hash.update(chunk)}
 if(size!==update.size||hash.digest('hex')!==update.sha256)throw Error('update_hash_mismatch');
 return update;
}
export async function sendStoreUpdateFile(res,release,getObject){
 const m=cleanStoreUpdate(release?.autoUpdate,release||{});if(!m||!release.objectKey)return false;
 const object=await getObject(release.objectKey);
 if(Number(object.ContentLength)!==m.size)throw Error('update_size_mismatch');
 res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':m.size,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
 try{await pipeline(object.Body,res)}catch{res.destroy()}return true;
}
