import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),one=(s,a,b)=>{if(s.split(a).length!==2)throw Error('[R1802] anchor '+a.slice(0,85));return s.replace(a,b)};
let server=read('dist/api/server.js');
server=one(server,'if(!productInvoiceRequired(order)||!await isNoPrintOrder(c,labId,order.id))return null;',"if(!productInvoiceRequired(order)||(order.mode!=='album'&&!await isNoPrintOrder(c,labId,order.id)))return null;");
fs.writeFileSync('dist/api/server.js',server);
let api=read('dist/api/lab-auto-processing.js');
api=one(api,'const product=await isNoPrintOrder(c,labId,id);',"const product=await isNoPrintOrder(c,labId,id);\n    const receiptOnly=product||order.mode==='album';");
api=one(api,"if(!product&&settings.invoiceTiming", "if(!receiptOnly&&settings.invoiceTiming");
api=one(api,'if(!product&&!order.downloaded_at)','if(!receiptOnly&&!order.downloaded_at)');
api=one(api,'if(!product){\n    const fileQ', 'if(!receiptOnly){\n    const fileQ');
// Complete upload is required even when a design-sheet download is not a receipt prerequisite.
api=one(api,'    if(!wasExisting){',"    if(!wasExisting){\n    if(order.mode==='album'){const files=await c.query(\"SELECT count(*) FILTER (WHERE original_state='active')::int active_files,count(*) FILTER (WHERE original_state NOT IN ('active','deleted'))::int pending_files FROM order_files WHERE order_id=$1 AND lab_id=$2\",[id,labId]);if(!Number(files.rows[0]?.active_files)||Number(files.rows[0]?.pending_files))throw Object.assign(Error('album_files_not_ready'),{status:409});}");
fs.writeFileSync('dist/api/lab-auto-processing.js',api);
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const path=root+'/assets/index-UIRefine-v655-r84.js';let s=read(path);
 s=one(s,'Qn=async(le,nt)=>{try{const Mt=((await Me("/api/lab/invoices")).invoices||[]).find(qt=>qt.id===le)||nt;', 'Qn=async(le,nt)=>{try{const Mt=await pb1802CompleteInvoice(((await Me("/api/lab/invoices")).invoices||[]).find(qt=>qt.id===le)||nt,{role:"lab",orderId:nt?.order_id});');
 s=one(s,'await Qn(le.invoice_id,{id:le.invoice_id,','await Qn(le.invoice_id,{id:le.invoice_id,order_id:le.id,');
 s=one(s,'async function Wu(t){if(pb1674DirectCustomer(t))', 'async function Wu(t){t=await pb1802CompleteInvoice(t,{role:oh()});if(t?.order_id&&(!t.document_type||t.document_type==="invoice")&&!vh(t).length)throw Error("invoice_items_unavailable");if(pb1674DirectCustomer(t))');
 s=one(s,'x.useEffect(()=>pbSetLiveInvoice(pbOriginalInvoice),[pbOriginalInvoice]);','x.useEffect(()=>pbSetLiveInvoice(old=>pb1802MergeInvoice(old,pbOriginalInvoice)),[pbOriginalInvoice]);x.useEffect(()=>{let closed=false;pb1802CompleteInvoice(pbOriginalInvoice,{role:t}).then(fresh=>{if(!closed)pbSetLiveInvoice(old=>pb1802MergeInvoice(old,fresh))}).catch(()=>{});return()=>{closed=true}},[t,pbOriginalInvoice.id,pbOriginalInvoice.order_id]);');
 s=one(s,'if(!closed&&fresh)pbSetLiveInvoice(fresh);','if(!closed&&fresh)pbSetLiveInvoice(old=>pb1802MergeInvoice(old,fresh));');
 s=one(s,'ye=l.coverCatalogEnabled!==!1,Ye=!ye,','ye=l.coverCatalogEnabled!==!1,Ye=!ye||v,');
 s=one(s,'className:"albumCustomCoverRequest "+(Ye?"active":"")','className:"albumCustomCoverRequest "+(Ye?"active":"")+(!ye?" pb1802TextCoverOnly":"")');
 s=one(s,'Ye&&e.jsx("textarea",{maxLength:1200,value:X,','Ye&&e.jsx("textarea",{"aria-label":"توضیحات جلد دلخواه",maxLength:1200,value:X,');
 s=one(s,'Ot=ea.filter($e=>($e.colors||[]).some(gt=>gt.active!==!1&&ci(gt)===Je))','Ot=pb1802CoversForColor(ea,Je)');
 s=one(s,'className:"albumOrderGrid",children:[','className:"albumOrderGrid pb1802CompactAlbum",children:[');
 if(root.endsWith('lab-desktop-ui')){s=one(s,"       await pb1568ProcessOrder(lab,order,settings);\n     }","       await pb1568ProcessOrder(lab,order,settings);\n     }\n     if(order.mode==='album')await pb1802AlbumReceipt(lab,order,settings);");s=one(s,"pb1586Stage='print';if(settings.autoPrintInvoice)","pb1586Stage='print';if(settings.autoPrintInvoice&&!(order.mode==='album'&&pb1802ReceiptState(lab,id).albumReceiptDone))");}
 const start=s.indexOf('function PB1380AlbumEditor('),end=s.indexOf('\n}',start);let editor=s.slice(start,end);
 const toggleStart=editor.indexOf("e.jsx('button',{type:'button',className:'pb1379AlbumMenuToggle'"),toggleEnd=editor.indexOf("}),e.jsxs('div',{className:'pb1380SaveBar'",toggleStart);if(toggleStart<0||toggleEnd<toggleStart)throw Error('cover setting bounds');
 editor=editor.slice(0,toggleStart)+"tab==='cover'?e.jsx(PB1802CoverCatalogSetting,{settings,setSettings,busy,setBusy,setNotice,setError}):"+editor.slice(toggleStart,toggleEnd+2)+editor.slice(toggleEnd+2);s=s.slice(0,start)+editor+s.slice(end);
 s+='\n'+read('scripts/r1802-invoice-album-ui.js.txt');fs.writeFileSync(path,s);execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
 const html=root+'/index.html';fs.writeFileSync(html,one(read(html),'</head>','<link rel="stylesheet" href="/photobridge-r1802-album-compact.css?v=r1802"></head>').replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u+'&albumInvoice=r1802'));
}
const root='dist/web/lab-desktop-ui',style='photobridge-r1802-album-compact.css';fs.copyFileSync('dist/web/'+style,root+'/'+style);const p=root+'/manifest.json',m=JSON.parse(read(p)),hash=v=>crypto.createHash('sha256').update(v).digest('hex');for(const name of ['assets/index-UIRefine-v655-r84.js','index.html',style]){const sha256=hash(fs.readFileSync(root+'/'+name)),f=m.files.find(f=>f.name===name);if(f)f.sha256=sha256;else m.files.push({name,url:'/lab-desktop-ui/'+name,sha256})}m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(p,JSON.stringify(m));
for(const p of ['dist/api/server.js','dist/api/lab-auto-processing.js'])execFileSync(process.execPath,['--check',p],{stdio:'inherit'});
