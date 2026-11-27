'use strict';
// Create the signed manifest only on a trusted Windows publishing machine.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {PUBLIC_KEY,payload,valid}=require('./update-trust.cjs');
async function create(root=__dirname,keyFile=process.env.PB_UPDATE_SIGNING_KEY||path.join(root,'.publisher','update-private.pem')){
 if(!keyFile)throw Error('PB_UPDATE_SIGNING_KEY_required');
 const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
 if(!/^\d{1,5}\.\d{1,5}\.\d{1,5}$/.test(version))throw Error('invalid_version');
 const key=crypto.createPrivateKey(fs.readFileSync(keyFile));
 if(crypto.createPublicKey(key).export({format:'pem',type:'spki'}).trim()!==PUBLIC_KEY.trim())throw Error('wrong_update_signing_key');
 const exe=path.resolve(root,'release','PhotoBridge-Store-Setup-'+version+'-x64.exe'),size=fs.statSync(exe).size;
 if(size<10*1024*1024||size>2*1024**3)throw Error('invalid_installer_size');
 // As in Lab, the signed Ed25519 manifest authenticates the complete installer bytes.
 // Authenticode is independent and may be added before generating this manifest.

 const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(exe))hash.update(chunk);
 const m={protocol:1,channel:'store',version,size,sha256:hash.digest('hex')};m.signature=crypto.sign(null,Buffer.from(payload(m)),key).toString('base64');
 if(!valid(m))throw Error('manifest_verification_failed');
 const file=path.join(root,'release','PhotoBridge-Store-Update-'+version+'.json');fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n');return file;
}
module.exports={create};
if(require.main===module)create().then(console.log).catch(e=>{console.error(e.message);process.exitCode=1});
