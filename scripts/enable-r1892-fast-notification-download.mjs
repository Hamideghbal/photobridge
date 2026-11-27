// R1892: Native Lab UI only. Use the existing 45s worker as a safety net,
// but actively probe for orders whose manifest becomes ready just after an
// OS tray notification. No server-side eligibility or file-integrity bypass.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='dist/web/lab-desktop-ui';
const asset='assets/index-UIRefine-v655-r84.js';
const file=root+'/'+asset;
const marker='/* PB1892: follow a desktop order notice';
let s=fs.readFileSync(file,'utf8');
if(!s.includes(marker)){
 if(!s.includes('function pb1586WakeDownloads()')||!s.includes('function pb1586NoticeWake(')||
    !s.includes('async function pb1568AutoTick()'))
  throw Error('R1892 native serialized worker/notification hook unavailable');
 s+='\n'+fs.readFileSync('scripts/r1892-fast-notification-download.js.txt','utf8')+'\n';
 fs.writeFileSync(file,s);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
const index=root+'/index.html';
let html=fs.readFileSync(index,'utf8');
const jsName='index-UIRefine-v655-r84.js';
const pattern=/(index-UIRefine-v655-r84\.js\?[^"'\s]*)/g;
let count=0;
html=html.replace(pattern,match=>{
 count++;
 const clean=match.replace(/&nativeWakeFast=r\d+/g,'');
 const legacy=clean.includes('nativeWake=r1892')?clean:clean+'&nativeWake=r1892';
 return legacy.replace('&nativeWake=r1892','&nativeWakeFast=r2074&nativeWake=r1892');
});
if(count!==1)throw Error('R1892 native bundle expected one cache-busted entry, got '+count);
fs.writeFileSync(index,html);
const manifestPath=root+'/manifest.json',m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(m.protocol!==1||m.channel!=='lab')throw Error('R1892 unexpected native manifest');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
for(const name of [asset,'index.html']){
 const entry=m.files.find(x=>x.name===name);
 if(!entry)throw Error('R1892 missing native file: '+name);
 entry.sha256=hash(fs.readFileSync(root+'/'+name));
}
m.build=hash(JSON.stringify(m.files));
m.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(m));
console.log('[R1892] Native Lab notification readiness follow-ups staged');
