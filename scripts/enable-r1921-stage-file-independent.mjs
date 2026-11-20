import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const marker='/* PB1921 stage transitions independent of old local photo folder */';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/assets/index-UIRefine-v655-r84.js',htmlFile=root+'/index.html';
 if(!fs.existsSync(file)){if(root==='dist/web')throw Error('R1921 website UI missing');continue;}
 let ui=fs.readFileSync(file,'utf8');
 if(!ui.includes(marker)){
  const local='if(ai())try{const Qe=await Me(`/api/lab/orders/${le.id}`),rt=await Ef(Qe);await jc(rt.dir,xe,Bt)}catch(Qe){Mt=(Qe==null?void 0:Qe.message)==="folder_permission_denied"?"اجازه نوشتن روی هارد داده نشد.":"ذخیره نسخه فاکتور روی هارد کامل نشد."}';
  if(ui.split(local).length!==2)throw Error('R1921 invoice mirror path anchor changed in '+root);
  ui=ui.replace(local,'/* R1921: PDF remains on server; never resolve old photo folder for stage progression. */');
  const before='await ye(),await Gt(le,"ready"),qt=!0;const Bt=await Wu(Zt.invoice)';
  const after='await ye(),await Gt(le,"ready"),qt=!0;if(le.invoice_id&&le.invoice_pdf_ready){P(`سفارش #${V(le.number)} آماده تحویل شد · فاکتور #${V(Zt.invoice.number)} قبلاً صادر شده است`);return}const Bt=await Wu(Zt.invoice)';
  if(ui.split(before).length!==2)throw Error('R1921 existing-issued-invoice shortcut anchor changed in '+root);
  ui=ui.replace(before,after);
  ui+='\n'+marker+'\n';
  fs.writeFileSync(file,ui);
 }
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 let html=fs.readFileSync(htmlFile,'utf8');
 const rx=/(assets\/index-UIRefine-v655-r84\.js\?[^"'<>\s]*)/g;
 if([...html.matchAll(rx)].length!==1)throw Error('R1921 UI version anchor missing '+root);
 html=html.replace(rx,x=>x.includes('&stageNoDisk=r1921')?x:x+'&stageNoDisk=r1921');
 fs.writeFileSync(htmlFile,html);
 const manifestFile=root+'/manifest.json';
 if(fs.existsSync(manifestFile)){
  const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
  for(const item of ['index.html','assets/index-UIRefine-v655-r84.js']){const row=manifest.files?.find(f=>f.name===item);if(!row)throw Error('R1921 manifest file missing '+item);row.sha256=sha(fs.readFileSync(root+'/'+item));}
  manifest.build=sha(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();
  fs.writeFileSync(manifestFile,JSON.stringify(manifest));
 }
}
console.log('R1921 stage / invoice paths no longer require historical local photo folders');
