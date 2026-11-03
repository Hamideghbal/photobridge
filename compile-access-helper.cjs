'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=__dirname,out=path.join(root,'.access-classes');
fs.mkdirSync(out,{recursive:true});
try{
 const libs=require('./access-libraries.json');for(const lib of libs){if(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/access-libs',lib.name))).digest('hex')!==lib.sha256)throw Error('access_library_integrity_failed');}
 execFileSync('javac',['-encoding','UTF-8','-source','8','-target','8','-cp',path.join(root,'assets/access-libs/*'),'-d',out,path.join(root,'access-src/PhotoBridgeAccess.java')],{stdio:'inherit'});
 for(const name of fs.readdirSync(out)){if(name.endsWith('.class')&&fs.readFileSync(path.join(out,name)).readUInt16BE(6)>52)throw Error('access_helper_not_java8');}
 const jar=path.join(root,'assets/photobridge-access-export.jar');execFileSync('jar',['cf',jar,'-C',out,'.'],{stdio:'inherit'});
 fs.writeFileSync(path.join(root,'access-helper.sha256'),crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex')+'\n');
}finally{fs.rmSync(out,{recursive:true,force:true});}
