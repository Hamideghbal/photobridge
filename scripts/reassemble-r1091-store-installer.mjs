/* Reassemble the version-pinned Windows installer from durable Git source chunks.
 * Chunks (each under GitHub's single-blob limit) are committed once. Every
 * Docker/Liara deploy recreates the *same* verified .exe under dist/web/downloads.
 * Never write to ephemeral process storage or download expiring Action artifacts.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const dir=path.join(root,'dist','installer-source','store-r1089');
const manifestPath=path.join(dir,'manifest.json');
if (!fs.existsSync(manifestPath)) {
 console.log('[PB R1091] Persistent installer not staged; leaving existing downloads untouched.');
} else {
 const spec=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 const name='PhotoBridge-Store-R1089-Setup-1.0.3-x64.exe';
 if(spec.name!==name||!Array.isArray(spec.parts)||spec.parts.length<2||spec.parts.length>20||!Number.isSafeInteger(spec.size)||spec.size<10_000_000||!/^[a-f0-9]{64}$/.test(spec.sha256))throw Error('Invalid persistent desktop installer manifest');
 const outDir=path.join(root,'dist','web','downloads','store-desktop');
 fs.mkdirSync(outDir,{recursive:true});
 const target=path.join(outDir,name),tmp=target+'.tmp';
 const digest=crypto.createHash('sha256');let total=0;
 const buf=Buffer.alloc(256*1024);
 const fd=fs.openSync(tmp,'w');
 try {
  for(let i=0;i<spec.parts.length;i++){
   const part=spec.parts[i];
   if(part!==name+'.part'+String(i+1).padStart(2,'0'))throw Error('Invalid installer part ordering');
   const source=path.join(dir,part),inp=fs.openSync(source,'r');
   try{
    let n;
    while((n=fs.readSync(inp,buf,0,buf.length,null))>0){
     digest.update(buf.subarray(0,n));
     let written=0;
     while(written<n)written+=fs.writeSync(fd,buf,written,n-written);
     total+=n;
    }
   }finally{fs.closeSync(inp)}
  }
 }catch(e){fs.closeSync(fd);fs.rmSync(tmp,{force:true});throw e}
 fs.closeSync(fd);
 const hash=digest.digest('hex');
 if(total!==spec.size||hash!==spec.sha256){fs.rmSync(tmp,{force:true});throw Error('R1091 installer checksum failed; refusing to publish corrupted executable')}
 fs.renameSync(tmp,target);
 fs.writeFileSync(path.join(outDir,'SHA256SUMS.txt'),hash+'  '+name+'\n');
 console.log('[PB R1091] Persistent installer ready:',name,total,hash);
}
