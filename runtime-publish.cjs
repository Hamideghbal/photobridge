'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function publishRuntime(candidate,target,expected,{rename=fs.rename,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 for(let attempt=0;attempt<5;attempt++){
  try{await rename(candidate,target);return;}catch(error){if(!['EPERM','EBUSY','EACCES'].includes(error.code))throw error;if(attempt<4)await wait(250*(attempt+1));}
 }
 // Windows can keep the just-checked java.exe locked against directory rename.
 // Copy into a newly owned destination, never merge with another runtime.
 let owned=false;
 try{await fs.mkdir(target);owned=true;for(const name of await fs.readdir(candidate))await fs.cp(path.join(candidate,name),path.join(target,name),{recursive:true,force:false,errorOnExist:true});if(sha(await fs.readFile(path.join(target,'bin','java.exe')))!==expected)throw Error('access_runtime_copy_integrity_failed');}
 catch(error){if(owned)await fs.rm(target,{recursive:true,force:true,maxRetries:10,retryDelay:250}).catch(()=>{});throw error;}
}
module.exports={publishRuntime};
