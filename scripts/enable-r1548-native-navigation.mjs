// R1548: Windows Lab UI hot update only. Leave public browser UI unchanged.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='dist/web/lab-desktop-ui',bundle='assets/index-UIRefine-v655-r84.js';
const file=root+'/'+bundle,manifestFile=root+'/manifest.json',htmlFile=root+'/index.html';
const marker='/* PB1548 Windows Lab navigation and login */';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const rows=JSON.parse(fs.readFileSync('scripts/r1548-native-navigation-patches.json','utf8'));
if(!Array.isArray(rows)||rows.length!==15)throw Error('R1548 patch contract invalid');
let s=fs.readFileSync(file,'utf8');
if(!s.includes(marker)){
 for(const [from,to] of rows){
  if(typeof from!=='string'||!from||typeof to!=='string'||s.split(from).length!==2)throw Error('R1548 native anchor changed: '+String(from).slice(0,100));
  s=s.replace(from,to);
 }
 fs.writeFileSync(file,s+'\n'+marker+'\n');
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
let html=fs.readFileSync(htmlFile,'utf8');
const match=/index-UIRefine-v655-r84\.js\?[^"']+/g;
const matches=html.match(match)||[];
if(matches.length!==1)throw Error('R1548 native JS entry changed');
html=html.replace(match,url=>url.includes('&nativeNavigation=r1548')?url:url+'&nativeNavigation=r1548');
fs.writeFileSync(htmlFile,html);
const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
if(manifest.protocol!==1||manifest.channel!=='lab'||!Array.isArray(manifest.files))throw Error('R1548 wrong Windows UI package');
for(const name of [bundle,'index.html']){
 const entry=manifest.files.find(row=>row.name===name);
 if(!entry||entry.url!=='/lab-desktop-ui/'+name)throw Error('R1548 manifest asset missing: '+name);
 entry.sha256=hash(fs.readFileSync(root+'/'+name));
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestFile,JSON.stringify(manifest));
console.log('[PhotoBridge R1548] Windows Lab GPS/Snapp, external site editor and login footer',manifest.build.slice(0,12));
