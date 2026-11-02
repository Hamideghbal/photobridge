const fs=require('node:fs');
const paths=['dist/web/assets/index-UIRefine-v655-r84.js','dist/web/photobridge-r1137-lab-local-intake.js','scripts/r1452-archive-dialogs.js'];
for(const path of paths){
 const s=fs.readFileSync(path,'utf8'); console.log('FILE',path,'LEN',s.length);
 const terms=path.includes('assets')?['مشتری آزاد','عکاسان همکار','عکاسان','بدهی اولیه','اصلاح بدهی','آرشیو قدیمی','پاک‌سازی آرشیو','پاکسازی آرشیو','پاکسازی','سایز جدید','صحافی جدید','modelBinding','pb1539Create','function Kj(','function PB1386ArchiveSettings','function PB1395StoragePanel','function tw(','function Ei(']:['مشتری آزاد','بدهی اولیه','اصلاح بدهی اولیه'];
 for(const term of terms){let found=[],p=-1;while((p=s.indexOf(term,p+1))>=0&&found.length<45)found.push(p);console.log('TERM',JSON.stringify({path,term,total:found.length,positions:found.slice(0,12),matches:found.slice(0,7).map(i=>s.slice(Math.max(0,i-420),i+730))}));}
 if(!path.includes('assets'))continue;
 const components=[
  ['Kj','function Kj(','function wb('],['ArchiveSettings','function PB1386ArchiveSettings(','\n\n/* R1391'],['StoragePanel','function PB1395StoragePanel(','\nasync function pb1395GuardRoot'],['Prices','function tw({data:t,onSaved:a,labName:s=""}){','function Na(t)']
 ];
 for(const [name,left,right] of components){const a=s.indexOf(left),b=s.indexOf(right,a+left.length);const section=a>=0?s.slice(a,b>a?b:a+45000):'';console.log('SECTION',name,JSON.stringify({start:a,end:b,len:section.length,head:section.slice(0,2600),matches:[...section.matchAll(/مشتری آزاد|اولیه|صحافی|سایز جدید|پاکسازی|پاک‌سازی|آرشیو قدیمی|confirm\(|onClick/g)].slice(0,40).map(m=>({at:m.index,s:section.slice(Math.max(0,m.index-190),m.index+390)}))}));}
}

const app=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const at=app.indexOf('label:"عکاسان و همکاری",hint:"اعضا و مشتریان"');
const pre=app.lastIndexOf('function ',at),nxt=app.indexOf('function ',at+30);
console.log('DETAIL SETTINGS MENU',JSON.stringify({at,pre,nxt,code:app.slice(pre,Math.min(nxt,pre+19500))}));
const kp=app.indexOf('function Kj('),ke=app.indexOf('function wb(',kp);console.log('DETAIL KJ',JSON.stringify({kp,ke,code:app.slice(kp,ke)}));
for(const term of ['PB1386ArchiveSettings','PB1395StoragePanel','archiveSettings','پاک‌سازی آرشیو','پاکسازی آرشیو','پاک‌سازی قدیمی','آرشیو محلی','cleanupOld','cleanupArchive','حذف پوشه','پاک‌سازی','پاکسازی قدیمی','مشتری آزاد / QR']){
 let loc=[],j=-1;while((j=app.indexOf(term,j+1))>=0){loc.push(j);if(loc.length>=60)break}
 console.log('DETAIL TERM',JSON.stringify({term,count:loc.length,positions:loc.slice(-15),contexts:loc.slice(-8).map(j=>app.slice(j-620,j+1020))}));
}
