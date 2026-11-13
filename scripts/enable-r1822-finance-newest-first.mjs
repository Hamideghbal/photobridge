/* R1822: Finance invoices and receipts display newest first in both roles.
   Sort rendered copies only; never change API, accounting, dates or saved rows. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'), write=(p,s)=>fs.writeFileSync(p,s);
function once(s,from,to,label){
 const count=s.split(from).length-1;
 if(count!==1)throw Error(`[R1822] ${label} anchor count ${count}`);
 return s.replace(from,to);
}
const asset='assets/index-UIRefine-v655-r84.js';
const helper='function pb1822FinanceNewestFirst(rows,kind){const date=(r,k)=>{for(const key of k){const value=r==null?void 0:r[key];if(value==null||value==="")continue;const time=Date.parse(String(value));if(Number.isFinite(time))return time}return 0};const fields=kind==="invoice"?["issued_at","created_at"]:["paid_at","issued_at","created_at"];return [...(Array.isArray(rows)?rows:[])].sort((a,b)=>date(b,fields)-date(a,fields)||date(b,["created_at"])-date(a,["created_at"])||((Number.isFinite(Number(b.number))&&Number.isFinite(Number(a.number)))?Number(b.number)-Number(a.number):0)||String(b.id??"").localeCompare(String(a.id??""),"en"))}';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/'+asset;
 let js=read(file);
 js=once(js,'function pb1821LabInvoiceIssuer(t){',helper+'function pb1821LabInvoiceIssuer(t){',root+' sorter helper');
 js=once(js,'const Ve=r.filter(Je=>{','const Ve=pb1822FinanceNewestFirst(r.filter(Je=>{',root+' invoice list');
 js=once(js,'}),he=Math.max(1,Math.ceil(Ve.length/N))','}),"invoice"),he=Math.max(1,Math.ceil(Ve.length/N))',root+' invoice page ordering');
 const receiptVariants=[
  'const pb1420Payments=t==="lab"?PB1420PaymentRows(PB1431ReceiptRows(h,r),pb1420PaymentCustomer):h;',
  'const pb1420Payments=t==="lab"?PB1420PaymentRows(h,pb1420PaymentCustomer):h;'
 ];
 const present=receiptVariants.filter(v=>js.includes(v));
 if(present.length!==1)throw Error('[R1822] '+root+' receipt list variant count '+present.length);
 js=once(js,present[0],present[0].replace('const pb1420Payments=','const pb1420Payments=pb1822FinanceNewestFirst(').replace(/;$/,',"receipt");'),root+' receipt order');
 if(!js.includes('const Ve=pb1822FinanceNewestFirst(')||!js.includes('const pb1420Payments=pb1822FinanceNewestFirst('))throw Error('[R1822] '+root+' ordering verification');
 write(file,js);
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const htmlPath=root+'/index.html';
 let html=read(htmlPath),hits=0;
 html=html.replace(/index-UIRefine-v655-r84\.js\?[^"']*/g,url=>{hits++;return url+'&financeNewest=r1822'});
 if(hits!==1)throw Error('[R1822] '+root+' cache tag count '+hits);
 write(htmlPath,html);
}
const native='dist/web/lab-desktop-ui',manifestPath=native+'/manifest.json',manifest=JSON.parse(read(manifestPath));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
for(const name of [asset,'index.html']){
 const sha256=sha(fs.readFileSync(native+'/'+name));
 const entry=manifest.files.find(x=>x.name===name);
 if(entry)entry.sha256=sha256;else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=sha(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
write(manifestPath,JSON.stringify(manifest));
console.log('[R1822] finance invoices and receipts newest first on web and Windows; accounting unchanged');
