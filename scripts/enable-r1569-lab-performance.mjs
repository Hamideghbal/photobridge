// R1569: request-count and first-render latency reduction in Lab intake + finance.
// Applied AFTER R1568 so website and installed-Windows hot-update assets stay aligned.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const once=(s,a,b,label)=>{if(s.split(a).length!==2)throw Error('R1569 changed '+label+' anchor: '+a.slice(0,100));return s.replace(a,b);};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const marker='/* PB1569 manual intake latency */';

let file='dist/api/server.js',server=read(file);
if(!server.includes('/* PB1569 lab performance */')){
 server="import {handleLocalBatch} from './lab-local-batch.js';\n"+server;
 server=once(server,"        const delegatedFiles = url.pathname.match(",
   `        /* PB1569 lab performance */
        if(await handleLocalBatch({req,url,res,pool,labId,bodyJson,sendJson,requireLocalIntakePrimary,
          labCanUsePrintSize,safeFileName,maxBytes:MAX_UPLOAD_BYTES}))return;
        const delegatedFiles = url.pathname.match(`,'authenticated delegated route');
 // Replace repeated correlated finance customer totals with four lab-scoped aggregates.
 const start=server.indexOf('pool.query(`WITH finance_customers AS (',server.indexOf("url.pathname === '/api/lab/finance/summary'"));
 const end=server.indexOf('`, [labId])',start);
 if(start<0||end<start)throw Error('R1569 finance customer summary query anchor missing');
 const old=server.slice(start,end+12);
 if(!old.includes('COALESCE((SELECT sum(i.total)')||!old.includes('ORDER BY balance DESC,u.name ASC'))throw Error('R1569 source customer summary unexpected');
 const replacement=`pool.query(\`WITH finance_customers AS (
            SELECT m.user_id id FROM lab_memberships m WHERE m.lab_id=$1 AND m.role='customer' AND m.active=true
            UNION SELECT i.customer_id id FROM invoices i WHERE i.lab_id=$1
          ),
          invoice_totals AS (
            SELECT customer_id,COALESCE(sum(total),0)::bigint invoiced FROM invoices WHERE lab_id=$1 GROUP BY customer_id
          ),
          paid_totals AS (
            SELECT customer_id,COALESCE(sum(amount),0)::bigint paid FROM finance_payments WHERE lab_id=$1 GROUP BY customer_id
          ),
          adjustment_totals AS (
            SELECT customer_id,COALESCE(sum(amount),0)::bigint discounts FROM finance_customer_adjustments WHERE lab_id=$1 GROUP BY customer_id
          ),
          receivable_totals AS (
            SELECT e.customer_id,COALESCE(sum(e.debit-e.credit),0)::bigint balance
            FROM finance_entries e JOIN finance_accounts a ON a.id=e.account_id
            WHERE a.lab_id=$1 AND a.system_key='receivable' GROUP BY e.customer_id
          )
          SELECT u.id,\${labFinanceCustomerNameSql()} name,u.mobile,u.email,
            COALESCE(i.invoiced,0)::bigint invoiced,
            COALESCE(p.paid,0)::bigint paid,
            COALESCE(x.discounts,0)::bigint discounts,
            COALESCE(r.balance,0)::bigint balance
          FROM finance_customers fc JOIN users u ON u.id=fc.id
          LEFT JOIN invoice_totals i ON i.customer_id=fc.id
          LEFT JOIN paid_totals p ON p.customer_id=fc.id
          LEFT JOIN adjustment_totals x ON x.customer_id=fc.id
          LEFT JOIN receivable_totals r ON r.customer_id=fc.id
          ORDER BY balance DESC,u.name ASC\`, [labId])`;
 server=server.slice(0,start)+replacement+server.slice(end+12);
 write(file,server);execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}

const intakeFile='dist/web/photobridge-r1137-lab-local-intake.js';
let intake=read(intakeFile);
if(!intake.includes(marker)){
 const helper=`  // Hash a file only once while this form is open; bound concurrency avoids large memory spikes.
  const pb1569HashCache=new WeakMap();
  function pb1569Digest(file){
    let pending=pb1569HashCache.get(file);
    if(!pending){
      pending=(async()=>{const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()));
        return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');})();
      pb1569HashCache.set(file,pending);
      pending.catch(()=>pb1569HashCache.delete(file));
    }
    return pending;
  }
  async function pb1569MapLimit(items,max,worker){
    const out=new Array(items.length);let next=0;
    await Promise.all(Array.from({length:Math.min(max,items.length)},async()=>{
      while(next<items.length){const i=next++;out[i]=await worker(items[i],i);}
    }));
    return out;
  }
`;
 intake=once(intake," const storage=()=>window.pbLabLocalIntakeStorage;",helper+" const storage=()=>window.pbLabLocalIntakeStorage;",'intake hashing helpers');
 intake=once(intake,
   "for(const file of files){const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');",
   "const pb1569Files=[...files],pb1569Hashes=await pb1569MapLimit(pb1569Files,3,pb1569Digest);for(let index=0;index<pb1569Files.length;index++){const file=pb1569Files[index],hash=pb1569Hashes[index];",
   'serial full-file hash');
 const photosStart="const photos=node('div',null,'pb1139GroupPhotos');photos.hidden=!!group.collapsed;";
 intake=once(intake,photosStart+"\n    for(const item of group.items){",
  photosStart+"\n    if(!group.collapsed)for(const item of group.items){",'hidden group rendering');
 intake=once(intake,"const image=node('img');image.src=item.preview;",
  "const image=node('img');image.loading='lazy';image.decoding='async';image.src=item.preview;",'lazy photo decoding');

 const start=intake.indexOf("for(const item of entries){const result=await api('/api/lab/delegated-orders/'");
 const end=intake.indexOf("const detail=await api('/api/lab/orders/'+order.orderId);",start);
 if(start<0||end<start)throw Error('R1569 delegated presign serial loop missing');
 const existing=intake.slice(start,end);
 if(!existing.includes("'/files/presign'")||!existing.includes("item.registered=true;item.fileId=result.fileId;"))throw Error('R1569 delegated registration shape changed');
 const replacement=`const pb1569Payload=entries.map(item=>({clientFileId:item.id,name:item.file.name,relativePath:item.file.name,
    bytes:item.file.size,contentType:item.file.type,printSizeId:item.size,printType:item.paper,
    printCopies:item.copies,localOnly:true}));
   error.textContent='در حال ثبت مشخصات '+entries.length.toLocaleString('fa-IR')+' فایل…';
   let pb1569Batch=null;
   // One network round trip for up to 100 files; legacy servers still accept the original route.
   if(entries.length<=100){
    try{pb1569Batch=await api('/api/lab/delegated-orders/'+order.orderId+'/files/local-batch',{localOnly:true,files:pb1569Payload});}
    catch(err){
     const code=String(err.code||err.data?.error||'');
     if(!['not_found','route_not_found','method_not_allowed'].includes(code))throw err;
    }
   }
   if(pb1569Batch){
    const results=new Map((pb1569Batch.files||[]).map(item=>[item.clientFileId,item]));
    if(results.size!==entries.length)throw Error('فهرست فایل‌های ثبت‌شده کامل نیست؛ دوباره تلاش کن.');
    for(const item of entries){
      const registered=results.get(item.id);
      if(!registered||registered.storageMode!=='device-local'||registered.uploadUrl||registered.fileId!==item.id)
       throw Error('ثبت اطلاعات فایل توسط سرور تأیید نشد.');
      item.registered=true;item.fileId=registered.fileId;
    }
   }else{
    await pb1569MapLimit(entries,4,async item=>{
      const result=await api('/api/lab/delegated-orders/'+order.orderId+'/files/presign',
        {clientFileId:item.id,name:item.file.name,relativePath:item.file.name,bytes:item.file.size,
         contentType:item.file.type,printSizeId:item.size,printType:item.paper,printCopies:item.copies,localOnly:true});
      if(result.storageMode!=='device-local'||result.uploadUrl)throw Error('سفارش محلی تأیید نشد؛ هیچ عکسی به سرور ارسال نشد.');
      item.registered=true;item.fileId=result.fileId;
    });
   }
   `;
 intake=intake.slice(0,start)+replacement+intake.slice(end);
 // Local copy can be lengthy on a slow HDD; show the current phase instead of one generic spinner.
 intake=once(intake,'for(const {item,file,target} of targets){if(item.saved)continue;',
  "error.textContent='در حال کپی فایل‌ها به مسیر سفارش روی هارد…';for(const {item,file,target} of targets){if(item.saved)continue;",'copy status');
 intake+='\n'+marker+'\n';
 write(intakeFile,intake);
 execFileSync(process.execPath,['--check',intakeFile],{stdio:'inherit'});
}
const financeMarker='/* PB1569 finance focused loads */';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const asset=root+'/assets/index-UIRefine-v655-r84.js';
 let ui=read(asset);
 if(!ui.includes(financeMarker)){
  const start=ui.indexOf('pb1472Load=async()=>{var Je;g(!0);try{const Ot=await Me(ke);');
  const end=ui.indexOf('}finally{g(!1)}};',start);
  if(start<0||end<start)throw Error('R1569 missing finance loader '+root);
  const current=ui.slice(start,end+17);
  if(!current.includes('Me("/api/lab/finance/ledger")')||!current.includes('Me("/api/lab/finance/payments")'))throw Error('R1569 finance loader shape mismatch '+root);
  const optimized=`pb1472Load=async()=>{var Je;g(!0);try{
   if(t==="lab"){
    const At=new URLSearchParams;Le&&At.set("from",$s(Le)),Ke&&At.set("to",$s(Ke));
    const extraPath=w==="payments"?"/api/lab/finance/payments":w==="expenses"?"/api/lab/finance/expenses":w==="ledger"?"/api/lab/finance/ledger":null;
    // Preserve invoice reconciliation before dependent finance balances are read.
    const Ot=await Me(ke);
    const[Et,extra]=await Promise.all([Me(\`/api/lab/finance/summary?\${At.toString()}\`),extraPath?Me(extraPath):Promise.resolve(null)]);
    o(Ot.invoices||[]),f(Et.summary||null),C(Et.customers||[]);
    if(w==="payments")S(extra?.payments||[]);
    if(w==="expenses")I(extra?.expenses||[]);
    if(w==="ledger")k(extra?.transactions||[]);
    !z&&((Je=Et.customers)!=null&&Je.length)&&q(String(Et.customers[0].id));
   }else{
    const[Ot,At,Et]=await Promise.all([Me(ke),Me("/api/customer/finance/summary"),Me("/api/customer/finance/payments")]);
    o(Ot.invoices||[]),f(At.summary||null),S(Et.payments||[]);
   }
   pb1569InitialFinance.current=true;
  }finally{g(!1)}};`;
  ui=ui.slice(0,start)+optimized+ui.slice(end+17);
  const anchor='const Ve=r.filter(';
  if(ui.split(anchor).length!==2)throw Error('R1569 finance list anchor '+root);
  const watcher=`const pb1569InitialFinance=x.useRef(false);
  // Load only the selected secondary table, not three unrelated 1000-row collections.
  x.useEffect(()=>{if(t!=="lab"||!pb1569InitialFinance.current)return;
   const endpoint=w==="payments"?"/api/lab/finance/payments":w==="expenses"?"/api/lab/finance/expenses":w==="ledger"?"/api/lab/finance/ledger":null;
   if(!endpoint)return;let active=true;
   Me(endpoint).then(response=>{if(!active)return;
    if(w==="payments")S(response.payments||[]);
    if(w==="expenses")I(response.expenses||[]);
    if(w==="ledger")k(response.transactions||[]);
   }).catch(error=>{if(active)console.warn("[PhotoBridge] finance tab refresh",error?.message||"load failed")});
   return()=>{active=false};
  },[w,t]);
  `;
  ui=once(ui,anchor,watcher+anchor,'finance active tab watcher '+root);
  ui+='\n'+financeMarker+'\n';
  write(asset,ui);
  execFileSync(process.execPath,['--check',asset],{stdio:'inherit'});
 }
}
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const htmlPath=root+'/index.html';let html=read(htmlPath);
 html=html.replace(/(photobridge-r1137-lab-local-intake\.js\?[^"'\s]*)/g,v=>v.includes('&speed=r1569')?v:v+'&speed=r1569');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"'\s]*)/g,v=>v.includes('&financeSpeed=r1569')?v:v+'&financeSpeed=r1569');
 write(htmlPath,html);
}
const native='dist/web/lab-desktop-ui',nativeIntake=native+'/photobridge-r1137-lab-local-intake.js';
fs.copyFileSync(intakeFile,nativeIntake);
const nativeManifestPath=native+'/manifest.json',m=JSON.parse(read(nativeManifestPath));
for(const name of ['index.html','photobridge-r1137-lab-local-intake.js','assets/index-UIRefine-v655-r84.js']){
 const item=m.files.find(x=>x.name===name);if(!item)throw Error('R1569 native UI manifest file missing '+name);
 item.sha256=hash(fs.readFileSync(native+'/'+name));
}
m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();write(nativeManifestPath,JSON.stringify(m));
console.log('[R1569] manual intake batch, 3-file hash pool, focused finance load, preaggregated balances');
