'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function verifySource({root=__dirname}={}){
 const lock=JSON.parse(fs.readFileSync(path.join(root,'protected-source-lock.json'),'utf8'));
 if(lock.protocol!==1||lock.contract!=='lab-thermal-model-updater-v1')throw Error('release_contract_invalid');
 for(const [name,expected] of Object.entries(lock.sourceFiles)){
  if(!/^[a-zA-Z0-9_.\/-]+$/.test(name)||name.includes('..')||hash(fs.readFileSync(path.join(root,name)))!==expected)throw Error('protected_source_changed:'+name);
 }
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')),dependency=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8')),version=fs.readFileSync(path.join(root,'BUILD-VERSION.txt'),'utf8').trim();
 if(pkg.name!=='photobridge-lab-desktop'||pkg.main!=='main.cjs'||pkg.build.appId!=='ir.photobridge.lab'||pkg.version!==version||dependency.version!==version||dependency.packages[''].version!==version||!require('./update-trust.cjs').newer(version,'1.0.153'))throw Error('release_version_identity_mismatch');
 if(pkg.scripts.verify!==lock.verifyCommand||!pkg.build.files.includes('protected-source-lock.json')||pkg.scripts.dist!==lock.distCommands.dist||pkg.scripts['dist:unsigned']!==lock.distCommands['dist:unsigned']||pkg.scripts['release:json']!==lock.distCommands['release:json'])throw Error('mandatory_release_gate_missing');
 return {lock,version};
}
function readPackedFile(archive,name){
 const fd=fs.openSync(archive,'r');try{
  const prefix=Buffer.alloc(16);if(fs.readSync(fd,prefix,0,16,0)!==16||prefix.readUInt32LE(0)!==4)throw Error('invalid_asar_header');
  const headerSize=prefix.readUInt32LE(4),size=prefix.readUInt32LE(12);if(headerSize<8||headerSize>32*1024*1024||size>headerSize-8)throw Error('invalid_asar_header_size');
  const bytes=Buffer.alloc(size);if(fs.readSync(fd,bytes,0,size,16)!==size)throw Error('truncated_asar_header');
  let info=JSON.parse(bytes.toString());for(const part of name.split('/'))info=info?.files?.[part];
  if(!info||info.unpacked||!/^\d+$/.test(info.offset)||!Number.isSafeInteger(info.size)||info.size<0||info.size>20*1024*1024)throw Error('packed_file_missing:'+name);
  const start=8+headerSize+Number(info.offset),body=Buffer.alloc(info.size);if(!Number.isSafeInteger(start)||start+body.length>fs.fstatSync(fd).size||fs.readSync(fd,body,0,body.length,start)!==body.length)throw Error('truncated_packed_file:'+name);
  return body;
 }finally{fs.closeSync(fd)}
}
function verifyPackedCore({root=__dirname,archive=path.join(root,'release/win-unpacked/resources/app.asar')}={}){
 const {lock,version}=verifySource({root});
 const pkg=JSON.parse(readPackedFile(archive,'package.json'));if(pkg.name!=='photobridge-lab-desktop'||pkg.version!==version)throw Error('packed_version_mismatch');
 if(!readPackedFile(archive,'protected-source-lock.json').equals(fs.readFileSync(path.join(root,'protected-source-lock.json'))))throw Error('packed_contract_mismatch');
 for(const name of lock.packagedFiles)if(hash(readPackedFile(archive,name))!==lock.sourceFiles[name])throw Error('packed_protected_source_changed:'+name);
 return {protocol:1,version,contract:lock.contract,contractSha256:hash(fs.readFileSync(path.join(root,'protected-source-lock.json'))),checkedFiles:lock.packagedFiles.length};
}
function verifyPackaged({root=__dirname}={}){
 const proof=verifyPackedCore({root}),ui=path.join(root,'release/win-unpacked/resources/runtime');
 require('./verify-native-ui.cjs').validateNativeUi(ui);
 const readManifest=dir=>JSON.parse(fs.readFileSync(path.join(dir,'.pb-lab-bundle-manifest.json'),'utf8'));
 const expected=readManifest(path.join(root,'runtime')),actual=readManifest(ui);
 if(actual.build!==expected.build)throw Error('packed_ui_build_mismatch');
 require('./prepare-assets.cjs').validate(actual);
 for(const entry of actual.files)if(hash(fs.readFileSync(path.join(ui,entry.name)))!==entry.sha256)throw Error('packed_ui_hash_mismatch:'+entry.name);
 proof.uiBuild=actual.build;fs.writeFileSync(path.join(root,'release','RELEASE-PROOF-'+proof.version+'.json'),JSON.stringify(proof,null,2)+'\n');return proof;
}
if(require.main===module){try{const proof=process.argv.includes('--packaged')?verifyPackaged():verifySource();console.log('RELEASE_CONTRACT_PASS',proof.version);}catch(error){console.error('STOP: release contract:',error.message);process.exitCode=1}}
module.exports={verifySource,verifyPackedCore,verifyPackaged,readPackedFile};
