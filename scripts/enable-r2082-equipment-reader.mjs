import fs from 'node:fs';import crypto from 'node:crypto';import zlib from 'node:zlib';import {execFileSync} from 'node:child_process';
import {patchPortal,patchReturn} from './r2082-equipment-reader-patch.mjs';
const helper=fs.readFileSync('scripts/r2082-equipment-reader.js.txt','utf8'),css=fs.readFileSync('scripts/r2082-equipment-reader.css.txt','utf8');
const name='photobridge-r100f73-staff-desktop-return.js',root='dist/web/desktop-ui',portal='equipment-rental-portal.html';
const write=(path,content)=>{fs.writeFileSync(path,content);const bytes=fs.readFileSync(path);for(const [ext,encode] of [['.br',b=>zlib.brotliCompressSync(b,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:5}})],['.gz',b=>zlib.gzipSync(b,{level:6})]])if(fs.existsSync(path+ext))fs.writeFileSync(path+ext,encode(bytes));};
for(const file of ['dist/api/'+portal,root+'/'+portal])write(file,patchPortal(fs.readFileSync(file,'utf8'),helper,css));
for(const file of ['dist/web/'+name,root+'/'+name]){write(file,patchReturn(fs.readFileSync(file,'utf8')));execFileSync(process.execPath,['--check',file],{stdio:'inherit'});}
const manifestPath=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8')),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(manifest.channel!=='store'||!Array.isArray(manifest.files))throw Error('R2082 Store manifest invalid');
for(const name of [portal,'photobridge-r100f73-staff-desktop-return.js']){const entry=manifest.files.find(x=>x.name===name);if(!entry)throw Error('R2082 missing Store snapshot '+name);entry.sha256=sha(fs.readFileSync(root+'/'+name));}
manifest.build=sha(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();write(manifestPath,JSON.stringify(manifest));
console.log('[R2082] USB/Bluetooth keyboard reader, optional serial chooser and explicit return checklist; Store only.');