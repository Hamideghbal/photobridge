'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {PUBLIC_KEY,payload}=require('./update-trust.cjs');
async function create({root=__dirname,keyFile=process.env.PB_UPDATE_SIGNING_KEY||path.join(root,'.publisher/update-private.pem')}={}){
 const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version;if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('release_version_must_be_stable');
 const file=path.join(root,'release',`PhotoBridge-Lab-Setup-${version}-x64.exe`),size=fs.statSync(file).size;if(size<10_000_000)throw Error('installer_missing_or_too_small');
 const key=crypto.createPrivateKey(fs.readFileSync(keyFile));if(crypto.createPublicKey(key).export({type:'spki',format:'pem'})!==PUBLIC_KEY)throw Error('wrong_update_signing_key');
 const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);
 const manifest={protocol:1,version,size,sha256:hash.digest('hex')};manifest.signature=crypto.sign(null,Buffer.from(payload(manifest)),key).toString('base64');
 const out=path.join(root,'release',`PhotoBridge-Lab-Update-${version}.json`);fs.writeFileSync(out,JSON.stringify(manifest,null,2)+'\n');return out;
}
if(require.main===module)create().then(p=>console.log('Update release manifest:',p)).catch(e=>{console.error('STOP:',e.message);process.exitCode=1});
module.exports={create};
