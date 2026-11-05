import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
// R1613 is the final targeted patch. No migrations, no schema changes.
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const policy='lab-priced-invoice-policy.js';
fs.copyFileSync('scripts/r1613-priced-invoice-policy.js.txt','dist/api/'+policy);
fs.copyFileSync('scripts/r1613-invoice-stage-guard.js.txt','dist/api/lab-invoice-stage-guard.js');
let server=read('dist/api/server.js');
if(!server.includes('/* R1613 manual priced invoice */')){
 const marker="                await finishDesktopOperation(c,labId,desktopOp,200,{ok:true,order,requirements,missing:requirements.filter((x)=>!x.resolved),ready:requirements.every((x)=>x.resolved),invoice});";
 if(server.split(marker).length!==2)throw Error('R1613 invoice-pricing transaction boundary changed');
 const inject=[
  '                /* R1613 manual priced invoice */',
  '                // Prices are committed and an invoice issued only when all',
  '                // requirements are satisfied; existing issuer is idempotent.',
  '                if(!missing.length){',
  '                    const outcome=await issueAfterManualPriceConfirmation(',
  '                      c,labId,orderId,order,missing,createOrGetInvoice);',
  '                    if(outcome.invoice){invoice=outcome.invoice;order=outcome.order;}',
  '                }',''].join('\n');
 server=server.replace(marker,inject+marker);
 server="import {issueAfterManualPriceConfirmation} from './"+policy+"';\n"+server;
 write('dist/api/server.js',server);
}
execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});
execFileSync(process.execPath,['--check','dist/api/lab-invoice-stage-guard.js'],{stdio:'inherit'});
execFileSync(process.execPath,['--check','dist/api/'+policy],{stdio:'inherit'});
const name='photobridge-r1613-lab-stage-table.css';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const app=root+'/assets/index-UIRefine-v655-r84.js';
 let js=read(app);
 if(!js.includes('/* PB1613 manual pricing completion */')){
  // R1613 hotfix: prior R1576/R1603 stages can add hooks and rewrite the
  // callback's parameters (Nn=async saved=> in R1577). Match the named assignment and
  // its immediate *next* useEffect boundary instead of the old exact text.
  const variants=['Nn=async saved=>','Nn=async le=>'];
  const matches=variants.reduce((n,token)=>n+js.split(token).length-1,0);
  const from=variants.find(token=>js.includes(token));
  const start=from?js.indexOf(from):-1;
  const boundary='};x.useEffect(()=>';
  const boundaryStart=js.indexOf(boundary,start);
  const end=boundaryStart+1; // Preserve ';x.useEffect' and every later hook.
  const previous=js.slice(start,end);
  if(matches!==1||start<0||boundaryStart<start||end-start>3200||
      !previous.includes('Fe(null)')||
      !(previous.includes('C(order.id)')||previous.includes('await ye()')))
    throw Error('R1613 pricing callback not uniquely located in '+root);
  js=js.slice(0,start)+read('scripts/r1613-on-pricing-saved.js.txt')+js.slice(end);
  // R1603 pre-invoice client guard wrongly blocked the ordinary after-print
  // flow at the print/ready/binding stages. The /ready handler already
  // validates pricing and issues the invoice transactionally; only delivery
  // or unpaid prepaid printing needs an existing invoice.
  const oldStage='function pb1603StageInvoicePending(order,stage){return pb1603InvoicePending(order)&&([\'print\',\'printing\',\'ready\',\'completed\',\'binding\'].includes(stage)||stage===\'download_print\'&&!!order.downloaded_at)}';
  const newStage='function pb1603StageInvoicePending(order,stage){return pb1603InvoicePending(order)&&(stage===\'completed\'||String(order.settlement_mode||\'ledger\')===\'prepaid\'&&[\'print\',\'printing\',\'binding\'].includes(stage))}';
  if(js.split(oldStage).length!==2)throw Error('R1613 after-print stage guard changed in '+root);
  js=js.replace(oldStage,newStage);
  js=js.replace('children:m?"در حال ثبت…":"تأیید و تعیین قیمت"','children:m?"در حال ثبت…":"ثبت قیمت و صدور فاکتور"');
  js+='\n/* PB1613 manual pricing completion */\n';
  write(app,js);
 }
 execFileSync(process.execPath,['--check',app],{stdio:'inherit'});
 fs.copyFileSync('scripts/r1613-lab-stage-table.css',root+'/'+name);
 const htmlFile=root+'/index.html';
 let html=read(htmlFile);
 const tag='<link rel="stylesheet" href="/'+name+'?v=r1613">';
 if(!html.includes(tag)){
  if(!html.includes('</head>'))throw Error('R1613 missing HTML head in '+root);
  html=html.replace('</head>',tag+'\n</head>');
 }
 const pattern=/index-UIRefine-v655-r84\.js\?[^"']+/g;
 if((html.match(pattern)||[]).length!==1)throw Error('R1613 app cache anchor changed in '+root);
 html=html.replace(pattern,url=>url.includes('&pricedInvoice=r1613')?url:url+'&pricedInvoice=r1613');
 write(htmlFile,html);
 if(root.endsWith('/lab-desktop-ui')){
  const manifestFile=root+'/manifest.json',manifest=JSON.parse(read(manifestFile));
  if(manifest.protocol!==1||manifest.channel!=='lab'||!Array.isArray(manifest.files))throw Error('R1613 Windows manifest contract changed');
  for(const file of ['assets/index-UIRefine-v655-r84.js','index.html',name]){
   let item=manifest.files.find(row=>row.name===file);
   if(!item){item={name:file,url:'/lab-desktop-ui/'+file};manifest.files.push(item)}
   item.sha256=hash(fs.readFileSync(root+'/'+file));
  }
  manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  manifest.build=hash(JSON.stringify(manifest.files));
  manifest.generatedAt=new Date().toISOString();
  write(manifestFile,JSON.stringify(manifest));
 }
}
console.log('[R1613] Safe priced ledger invoice, no automatic invoice previews, visible stage activity, centered photographer headers');
