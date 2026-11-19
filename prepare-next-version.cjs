'use strict';
// For every future installer, bump from the exact complete source snapshot.
// NEVER ship a new feature with the same version as an installed program;
// the current updater compares semantic version and ignores equal versions.
const fs=require('node:fs'),path=require('node:path');
const {newer}=require('./update-trust.cjs');
function prepare(version,{root=__dirname,minimum='1.0.104'}={}){
 if(!/^\d{1,5}\.\d{1,5}\.\d{1,5}$/.test(String(version||'')))throw Error('invalid_three_part_version');
 const pkgPath=path.join(root,'package.json'),lockPath=path.join(root,'package-lock.json'),
 pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8')),lock=JSON.parse(fs.readFileSync(lockPath,'utf8'));
 if(pkg.version!==lock.version||pkg.version!==lock.packages?.['']?.version)throw Error('source_version_lock_mismatch');
 if(!newer(version,minimum)||!newer(version,pkg.version))throw Error('release_version_must_increase');
 const before={package:fs.readFileSync(pkgPath,'utf8'),lock:fs.readFileSync(lockPath,'utf8')};
 pkg.version=version;lock.version=version;lock.packages[''].version=version;
 try{
  fs.writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n');
  fs.writeFileSync(lockPath,JSON.stringify(lock,null,2)+'\n');
 }catch(error){
  fs.writeFileSync(pkgPath,before.package);fs.writeFileSync(lockPath,before.lock);
  throw error;
 }
 return version;
}
if(require.main===module){try{console.log('Prepared next distinct installer version:',prepare(process.argv[2]));}catch(error){console.error('STOP:',error.message);process.exitCode=1}}
module.exports={prepare};
