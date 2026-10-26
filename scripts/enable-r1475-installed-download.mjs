import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const p='dist/web/assets/index-UIRefine-v655-r84.js';let s=fs.readFileSync(p,'utf8');
if(!s.includes('/* PB1475 installed manual download */')){
 const a=s.indexOf('function PB1365LabFeature('),b=s.indexOf('\n}',a);if(a<0||b<a)throw Error('R1475 feature component missing');let block=s.slice(a,b+2);
 const once=(a,b)=>{if(block.split(a).length!==2)throw Error('R1475 changed anchor '+a);block=block.replace(a,b)};
 once('disabled:busy||!features.desktopEnabled||native','disabled:busy||!features.desktopEnabled');
 once("children:native?'✓':'↓'","children:'↓'");
 once("children:native?'برنامه نصب است':busy?'در حال بررسی…':'دانلود برنامهٔ ویندوز'","children:busy?'در حال بررسی…':native?'دانلود دوباره برنامهٔ ویندوز':'دانلود برنامهٔ ویندوز'");
 once("children:native?'PhotoBridge Lab':'PhotoBridge Lab · Windows'","children:native?'برنامه نصب است · دریافت فایل نصب':'PhotoBridge Lab · Windows'");
 s=s.slice(0,a)+block+s.slice(b+2)+'\n/* PB1475 installed manual download */\n';fs.writeFileSync(p,s);
}
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let html=fs.readFileSync(p,'utf8');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"'\s]*)/g,url=>url.includes('installedDownload=r1475')?url:url+'&installedDownload=r1475');fs.writeFileSync(p,html);}
execFileSync(process.execPath,['--check','dist/web/assets/index-UIRefine-v655-r84.js'],{stdio:'inherit'});
