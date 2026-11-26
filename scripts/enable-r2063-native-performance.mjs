// Candidate: patch only the final native Lab snapshot. R1897 follows this stage.
import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {patchTable,patchIntake}=require('./r2063-native-lists.cjs');
const {patchFinance}=require('./r2063-native-finance.cjs');
const root='dist/web/lab-desktop-ui',asset='assets/index-UIRefine-v655-r84.js',intake='photobridge-r1137-lab-local-intake.js',manual='photobridge-r1176-lab-finance.js';
const read=name=>fs.readFileSync(root+'/'+name,'utf8');
const ui=patchTable(patchFinance(read(asset))),local=patchIntake(read(intake));
let html=read('index.html');
for(const name of [asset,intake,manual]){
 const basename=name.split('/').pop().replaceAll('.','\\.');
 const re=new RegExp(basename+'\\?[^"\\x27\\s>]+','g');
 const matches=html.match(re)||[];
 if(matches.length!==1)throw Error('R2063 asset URL '+name+' count '+matches.length);
 if(!matches[0].includes('&nativePerf=r2063'))html=html.replace(matches[0],matches[0].replace(/(\?[^&]+)/,'$1&nativePerf=r2063'));
}
const manifestPath=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
for(const [name,content] of [[asset,ui],[intake,local],['index.html',html]]){
 const file=root+'/'+name;fs.writeFileSync(file,content);
 if(name.endsWith('.js'))execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const bytes=fs.readFileSync(file);
 for(const [suffix,encode] of [['.br',zlib.brotliCompressSync],['.gz',zlib.gzipSync]])if(fs.existsSync(file+suffix))fs.writeFileSync(file+suffix,encode(bytes));
 for(const n of [name,name+'.br',name+'.gz']){
  const row=manifest.files.find(x=>x.name===n);
  if(!row&&n===name)throw Error('R2063 missing native manifest '+n);
  if(row)row.sha256=crypto.createHash('sha256').update(fs.readFileSync(root+'/'+n)).digest('hex');
 }
}
manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
manifest.generatedAt=new Date().toISOString();fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log('[R2063] candidate native focused finance, bounded photographers and indexed intake');
