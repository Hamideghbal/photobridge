// R1552: always show the newest submitted order first within each archive day.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const serverFile='dist/api/server.js';
let server=fs.readFileSync(serverFile,'utf8');
const start=server.indexOf('async function archiveOrdersForLab(');
const end=server.indexOf('async function financeDocumentsForCustomer(',start);
if(start<0||end<=start)throw Error('R1552 archive API boundary not found');
let section=server.slice(start,end);
const archiveSelect='SELECT o.id order_id,o.number order_number,o.mode,o.status raw_order_status,o.album_stage,o.updated_at,';
if(!section.includes('o.created_at order_created_at')){
 if(section.split(archiveSelect).length!==2)throw Error('R1552 archive order timestamp anchor changed');
 section=section.replace(archiveSelect,archiveSelect+'\n    o.created_at order_created_at,');
 server=server.slice(0,start)+section+server.slice(end);
 fs.writeFileSync(serverFile,server);
}
execFileSync(process.execPath,['--check',serverFile],{stdio:'inherit'});

const sortFunction=String.raw`
/* PB1552 archive latest registered order first */
function pb1552ArchiveNewestFirst(first,second){
 const createdAt=entry=>Date.parse(entry?.order_created_at||entry?.created_at||'');
 const firstCreated=createdAt(first),secondCreated=createdAt(second);
 if(Number.isFinite(firstCreated)&&Number.isFinite(secondCreated)&&firstCreated!==secondCreated)return secondCreated-firstCreated;
 const firstNumber=Number(first?.order_number),secondNumber=Number(second?.order_number);
 if(Number.isFinite(firstNumber)&&Number.isFinite(secondNumber)&&firstNumber!==secondNumber)return secondNumber-firstNumber;
 const archiveAt=entry=>Date.parse(entry?.sent_at||entry?.completed_at||entry?.issued_at||'');
 const firstArchive=archiveAt(first),secondArchive=archiveAt(second);
 if(Number.isFinite(firstArchive)&&Number.isFinite(secondArchive)&&firstArchive!==secondArchive)return secondArchive-firstArchive;
 return 0;
}
`;
const root='dist/web',nativeRoot=root+'/lab-desktop-ui',asset='assets/index-UIRefine-v655-r84.js';
for(const dir of [root,nativeRoot]){
 const jsFile=dir+'/'+asset;
 let source=fs.readFileSync(jsFile,'utf8');
 const anchor='const ae=w?B.get(w)||[]:[],';
 const replacement='const ae=w?(B.get(w)||[]).slice().sort(pb1552ArchiveNewestFirst):[],';
 if(!source.includes(replacement)){
  if(source.split(anchor).length!==2)throw Error('R1552 archive day list anchor changed in '+dir);
  source=source.replace(anchor,replacement);
 }
 if(!source.includes('/* PB1552 archive latest registered order first */'))source+='\n'+sortFunction;
 fs.writeFileSync(jsFile,source);
 execFileSync(process.execPath,['--check',jsFile],{stdio:'inherit'});
 const indexFile=dir+'/index.html';
 let index=fs.readFileSync(indexFile,'utf8');
 const pattern=/index-UIRefine-v655-r84\.js\?[^"']+/g,urls=index.match(pattern)||[];
 if(urls.length!==1)throw Error('R1552 JS browser cache entry missing in '+dir);
 index=index.replace(pattern,url=>url.includes('&archiveNewest=r1552')?url:url+'&archiveNewest=r1552');
 fs.writeFileSync(indexFile,index);
}
const sha=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const manifestPath=nativeRoot+'/manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(manifest.channel!=='lab'||manifest.protocol!==1)throw Error('R1552 unexpected Windows UI manifest');
for(const filename of [asset,'index.html']){
 const row=manifest.files.find(entry=>entry.name===filename);
 if(!row||row.url!=='/lab-desktop-ui/'+filename)throw Error('R1552 Windows update entry missing: '+filename);
 row.sha256=sha(fs.readFileSync(nativeRoot+'/'+filename));
}
manifest.build=sha(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log('[R1552] Archive orders newest first in selected day · website and Windows Lab UI',manifest.build.slice(0,12));
