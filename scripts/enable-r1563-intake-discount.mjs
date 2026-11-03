import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1563 changed anchor: '+a.slice(0,100));return s.replace(a,b)};
const native='dist/web/lab-desktop-ui',discount='photobridge-r1038-subscription-discounts.js',intake='photobridge-r1137-lab-local-intake.js';
let server=fs.readFileSync('dist/api/server.js','utf8');
if(!server.includes('/* PB1563 live intake customer aliases */')){
 const start=server.indexOf("    if (url.pathname.startsWith('/api/lab/')) {"),end=server.indexOf('        const labId = a.labId;',start);
 if(start<0||end<start)throw Error('R1563 Lab authorization boundary missing');
 const insertion=`\n        /* PB1563 live intake customer aliases */
        if(url.pathname.startsWith('/api/lab/intake-live/download/')){
            const suffix=url.pathname.slice('/api/lab/intake-live/download/'.length);
            if(req.method==='GET'&&suffix==='bootstrap')url.pathname='/api/lab/delegated-orders/bootstrap';
            else if(req.method==='POST'&&suffix==='customers')url.pathname='/api/lab/delegated-customers';
            else if(req.method==='POST'&&/^customers\\/[0-9a-f-]{36}\\/resend-invitation$/i.test(suffix))url.pathname='/api/lab/delegated-customers/'+suffix.slice('customers/'.length);
            else return sendJson(res,404,{error:'not_found'});
        }
`;
 const at=end+'        const labId = a.labId;'.length;server=server.slice(0,at)+insertion+server.slice(at);fs.writeFileSync('dist/api/server.js',server);
}
for(const root of ['dist/web',native]){
 let s=fs.readFileSync(root+'/'+discount,'utf8');
 if(!s.includes('/* PB1563 stable soft discount */')){
  s=once(s,'#fff9e8 0%,#ffecbc 48%,#f5d791 100%','#fffdf8 0%,#fff7e6 48%,#f8edda 100%');
  s=once(s,'border:1px solid #e5bf74','border:1px solid #e8d9ba');
  s=once(s,'font-size:8px!important;font-weight:800','font-size:10px!important;font-weight:800');
  s=once(s,'small{font-size:7px!important}','small{font-size:9px!important}');
  s=once(s,"if(button.dataset.pbR1038Discount===signature&&(signature==='none'||button.querySelector('.pbR1038LabDiscountDetails')))return;", "if(button.dataset.pbR1038Discount===signature&&(signature==='none'||button.querySelector('.pbR1038LabDiscountDetails')&&button.querySelector('.pbR1038BeforePrice'))){if(signature!=='none'&&!button.classList.contains('pbR1038DiscountedPlan'))button.classList.add('pbR1038DiscountedPlan');return;}");
  s=once(s,'{childList:true,subtree:true}','{childList:true,subtree:true,attributes:true,attributeFilter:[\'class\']}');
  s=once(s,'border-color:#70b5f8!important;box-shadow:0 0 0 2px rgba(63,142,240,.12),0 7px 20px rgba(158,111,27,.08)!important;','border-color:#e9d6a5!important;box-shadow:0 2px 8px rgba(158,111,27,.035)!important;');
  s=once(s,'position:relative!important;display:flex!important;flex-direction:column!important;','position:relative!important;display:flex!important;flex-direction:column!important;transform:none!important;');
  s+='\n/* PB1563 stable soft discount */\n';fs.writeFileSync(root+'/'+discount,s);
 }
 s=fs.readFileSync(root+'/'+intake,'utf8');
 if(!s.includes('/* PB1563 live preregistration */')){
  s=once(s,' const result=await storage().request(live?url+\'/download\':url,',` if(window.pbNativeStorage&&(body?.sendInvitation===true&&url==='/api/lab/delegated-customers'||/^\\/api\\/lab\\/delegated-customers\\/[0-9a-f-]+\\/resend-invitation$/.test(url)))url=url.replace('/api/lab/delegated-customers','/api/lab/intake-live/download/customers');
 const result=await storage().request(live?url+'/download':url,`);
  const anchor='  directory=root;bootstrap=data;';
  s=once(s,anchor,`  if(window.pbNativeStorage){
   try{const live=await api('/api/lab/intake-live/download/bootstrap'+(albumMode?'':'?mode=print'));if(Array.isArray(live.customers)){const rows=new Map((data.customers||[]).filter(c=>c.local_contact||c.origin_offline&&!c.remote).map(c=>[String(c.serverId||c.id),c]));for(const c of live.customers)rows.set(String(c.id),c);data.customers=[...rows.values()];if(live.album)data.album=live.album;if(Array.isArray(live.printSizes))data.printSizes=live.printSizes;}}
   catch{ /* Existing offline contacts remain selectable; no SMS success is claimed. */ }
  }
`+anchor);
  s+='\n/* PB1563 live preregistration */\n';fs.writeFileSync(root+'/'+intake,s);
 }
 for(const file of [discount,intake])execFileSync(process.execPath,['--check',root+'/'+file],{stdio:'inherit'});
 const index=root+'/index.html';let html=fs.readFileSync(index,'utf8');for(const name of [discount,intake])html=html.replace(new RegExp('('+name.replaceAll('.','\\.')+'\\?[^"\\\']*)','g'),url=>url.includes('&intake=r1563')?url:url+'&intake=r1563');fs.writeFileSync(index,html);
}
execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),file=native+'/manifest.json',m=JSON.parse(fs.readFileSync(file,'utf8'));
for(const name of [discount,intake,'index.html']){const row=m.files.find(f=>f.name===name);if(!row)throw Error('R1563 manifest entry missing');row.sha256=hash(fs.readFileSync(native+'/'+name));}m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(file,JSON.stringify(m));
console.log('[R1563] Stable soft discount badge and live Windows preregistration');
