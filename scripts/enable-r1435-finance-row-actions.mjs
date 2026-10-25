import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1435 stable finance actions */')){
 const once=(a,b)=>{if(ui.split(a).length!==2)throw Error('R1435 anchor '+a.slice(0,80));ui=ui.replace(a,b)};
 once("Number(Je.total)>0&&[\"invoice\",\"correction\"].includes(Je.document_type||\"invoice\")","(Je.document_type===\"correction\"||Number(Je.total)>0&&(Je.document_type||\"invoice\")===\"invoice\")");
 once("_pbRecorded=!Ot&&!At&&Boolean(Je.external_accounting_recorded)","_pbRecorded=!Ot&&Boolean(Je.external_accounting_recorded)");
 once("+(_pbRecorded?\"externalAccountingRecordedInvoice \":\"\")","");
 once("_pbRecorded&&e.jsx(\"small\",{className:\"externalAccountingRecordedBadge\",children:\"✓ در حسابداری اصلی ثبت شده\"})","!1");
 once("At?e.jsx(\"span\",{className:\"correctionBadge\",children:\"ثبت‌شده\"})","At?e.jsx(PB1435CorrectionView,{doc:Je})");
 once("t===\"lab\"&&!Ot&&!At&&e.jsx(\"button\",{className:\"externalAccountingBtn \"+(_pbRecorded?\"recorded\":\"\"),onClick:()=>_setPbAccountingMark(Je),children:_pbRecorded?\"ثبت‌شده در حسابداری\":\"ثبت در حسابداری\"})","t===\"lab\"&&!Ot&&e.jsx(\"button\",{className:\"externalAccountingBtn pb1435AccountingMark \"+(_pbRecorded?\"recorded\":\"\"),\"aria-pressed\":_pbRecorded,onClick:()=>_setPbAccountingMark(At?{...Je,_pb1431ReceiptKind:\"correction\"}:Je),children:\"ثبت در حسابداری\"})");
 once("className:Je.external_accounting_recorded?\"pb1431ReceiptRow pb1431RecordedReceipt\":\"pb1431ReceiptRow\"","className:\"pb1431ReceiptRow\"");
 once("className:\"pb1431ReceiptMark\",\"aria-pressed\":Boolean(Je.external_accounting_recorded)","className:\"externalAccountingBtn pb1435AccountingMark \"+(Je.external_accounting_recorded?\"recorded\":\"\"),\"aria-pressed\":Boolean(Je.external_accounting_recorded)");
 once("children:Je.external_accounting_recorded?\"✓ ثبت‌شده در حسابداری\":\"ثبت در حسابداری\"","children:\"ثبت در حسابداری\"");
 once("سندهای علامت‌خورده در لیست با زمینه سبز مشخص می‌شوند تا سندهای واردنشده سریع پیدا شوند.","رنگ دکمهٔ ثبت در حسابداری، وضعیت ثبت این سند را نشان می‌دهد.");
 ui+='\n/* PB1435 stable finance actions */\n'+fs.readFileSync('scripts/r1435-correction-view.js','utf8');fs.writeFileSync(file,ui);
}
const serverFile='dist/api/server.js';let server=fs.readFileSync(serverFile,'utf8');
if(!server.includes('/* PB1435 correction tracking */')){
 const replace=(a,b)=>{if(server.split(a).length!==2)throw Error('R1435 server anchor '+a);server=server.replace(a,b)};
 if(server.split("['payment','discount'].includes(kind)").length!==3)throw Error("R1435 receipt helpers");server=server.replaceAll("['payment','discount'].includes(kind)","['payment','discount','correction'].includes(kind)");
 replace("kind==='payment'||row.document_type==='discount'","kind==='payment'||row.document_type===kind");
 replace("kind==='discount'&&row.document_type!=='discount'","kind!=='payment'&&row.document_type!==kind");
 replace('(payment|discount)\\/','(payment|discount|correction)\\/');
 replace('const sql=kind===\'payment\'?', 'const sql=kind===\'correction\'?"SELECT id FROM finance_corrections WHERE lab_id=$1 AND id=$2 AND target_type=\'invoice\'":kind===\'payment\'?');
 replace("const marked = await pb1431AttachReceiptMarks(c,labId,await externalAccountingAttachMarks(c, 'lab', labId, decorated),'discount');","const marked = await pb1431AttachReceiptMarks(c,labId,await pb1431AttachReceiptMarks(c,labId,await externalAccountingAttachMarks(c, 'lab', labId, decorated),'discount'),'correction');");
 server+='\n/* PB1435 correction tracking */\n';fs.writeFileSync(serverFile,server);
}
let html=fs.readFileSync('dist/web/index.html','utf8');
if(!html.includes('photobridge-r1435-finance-rows.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1435-finance-rows.css?v=r1435" /></head>');
html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&financeRows=')?url:url+'&financeRows=r1435');fs.writeFileSync('dist/web/index.html',html);
