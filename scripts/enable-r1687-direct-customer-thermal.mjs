/* R1687: revise the generated invoice classifier in site and Windows UI. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const oldPred="function pb1674DirectCustomer(t){\n const kind=String(t?.customer_kind||'').trim().toLowerCase();\n if(kind==='customer')return true;\n if(kind==='coworker')return false;\n const source=String(t?.order_source||t?.source||'').trim().toLowerCase();\n return source==='walkin'||source==='manual_invoice';\n}";
const oldThermal="const customer=String(t.customer_kind||'').toLowerCase()==='customer'||(!t.customer_kind&&['walkin','manual_invoice'].includes(String(t.order_source||'')));";
const updated=fs.readFileSync('scripts/r1674-direct-customer-invoices.js.txt','utf8');
const newPred=updated.slice(updated.indexOf('function pb1674DirectCustomer(t){'),updated.indexOf('\nfunction pb1674CustomerName(t){')).trimEnd();
const thermal=fs.readFileSync('scripts/r1665-thermal-invoice.js.txt','utf8');
const newThermal=thermal.match(/const customer=[^\n]+/)[0];
const upgrade=(s,previous,current,tag)=>{
 const live=s.split(current).length-1;
 if(live===1)return s; // R1665 and R1674 already inject the latest source.
 if(live!==0)throw Error('R1687 duplicated current '+tag);
 const legacy=s.split(previous).length-1;
 if(legacy!==1)throw Error('R1687 missing or duplicated '+tag+' count '+legacy);
 return s.replace(previous,current);
};
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/assets/index-UIRefine-v655-r84.js';
 let js=fs.readFileSync(file,'utf8');
 js=upgrade(js,oldPred,newPred,'direct customer '+root);
 js=upgrade(js,oldThermal,newThermal,'thermal fallback '+root);
 fs.writeFileSync(file,js);
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const page=root+'/index.html';let html=fs.readFileSync(page,'utf8'),count=0;
 html=html.replace(/index-UIRefine-v655-r84\.js\?[^"']*/g,u=>{count++;return u.includes('&customerThermal=r1687')?u:u+'&customerThermal=r1687'});
 if(count!==1)throw Error('R1687 script reference '+root+' '+count);
 fs.writeFileSync(page,html);
 if(root.endsWith('lab-desktop-ui')){
  const mp=root+'/manifest.json',m=JSON.parse(fs.readFileSync(mp,'utf8'));
  for(const name of ['index.html','assets/index-UIRefine-v655-r84.js']){
   const row=m.files.find(x=>x.name===name);if(!row)throw Error('R1687 missing manifest '+name);
   row.sha256=sha(fs.readFileSync(root+'/'+name));
  }
  m.build=sha(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(mp,JSON.stringify(m));
 }
}
console.log('[R1687] Site and Windows direct customer receipts updated.');
