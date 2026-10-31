'use strict';
const crypto=require('node:crypto');
async function fileProof(storage,file){const before=await storage.operation('stat',file);if(before.size!==file.bytes)throw Error('local_file_size_mismatch');const hash=crypto.createHash('sha256');for(let offset=0;offset<before.size;offset+=1024*1024){const length=Math.min(1024*1024,before.size-offset),bytes=await storage.operation('read',{...file,offset,length});if(!(bytes instanceof Uint8Array)||bytes.length!==length)throw Error('local_file_read_failed');hash.update(bytes);}const after=await storage.operation('stat',file);if(after.size!==before.size||after.lastModified!==before.lastModified)throw Error('local_file_changed');return hash.digest('hex');}
async function verifyFiles(storage,files){if(!files.length)throw Error('local_files_not_verified');for(const file of files){const sum=await fileProof(storage,file);if(!file.sha256||sum!==file.sha256)throw Error('local_file_hash_mismatch');}}
module.exports={fileProof,verifyFiles};
