'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=__dirname;process.chdir(root);
function run(command,args){const r=spawnSync(command,args,{cwd:root,stdio:'inherit',shell:process.platform==='win32'&&command==='npm'});if(r.error)throw r.error;if(r.status!==0)throw Error(command+' failed: '+r.status)}
async function main(){
 const version=process.argv[2]||'1.0.55';if(!['1.0.54','1.0.55'].includes(version))throw Error('unsupported_version');
 if(process.platform!=='win32')throw Error('Run this build on Windows x64 with Node.js 22 or newer.');
 if(Number(process.versions.node.split('.')[0])<22)throw Error('Node.js 22 or newer is required.');
 const keyFile=process.env.PB_UPDATE_SIGNING_KEY||path.join(root,'.publisher','update-private.pem');
 if(!fs.existsSync(keyFile))throw Error('Publisher key missing. Copy your ORIGINAL .publisher/update-private.pem into this folder, or set PB_UPDATE_SIGNING_KEY to its path. The existing 1.0.54 updater requires the matching original key.');
 const key=crypto.createPrivateKey(fs.readFileSync(keyFile));if(crypto.createPublicKey(key).export({type:'spki',format:'pem'})!==require('./update-trust.cjs').PUBLIC_KEY)throw Error('Wrong publisher key: it does not match the installed updater.');
 for(const name of ['package.json','package-lock.json']){const p=path.join(root,name),v=JSON.parse(fs.readFileSync(p));v.version=version;if(v.packages?.[''])v.packages[''].version=version;fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');}
 run('npm',['ci']);run(process.execPath,['--test','test/updater.test.cjs','test/progress.test.cjs']);run('npm',['run',process.env.CSC_LINK||process.env.WIN_CSC_LINK?'dist':'dist:unsigned']);
 const manifest=await require('./create-update-release.cjs').create({root,keyFile});
 console.log('\nSUCCESS\nInstaller: '+path.join(root,'release',`PhotoBridge-Lab-Setup-${version}-x64.exe`)+'\nJSON: '+manifest);
}
main().catch(e=>{console.error('\nSTOP: '+e.message);process.exitCode=1});
