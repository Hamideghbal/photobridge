import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
// R1612 is a presentational follow-up to R1610, preserving existing finance
// semantics and the authenticated finance/customer-settings API.
const roots=['dist/web','dist/web/lab-desktop-ui'];
const bundle='assets/index-UIRefine-v655-r84.js';
const cssName='photobridge-r1612-discount-spinner.css';
const marker='/* PB1612 independent discount modal and fixed spinner */';
const react=fs.readFileSync('scripts/r1612-discount-react.js.txt','utf8');
const helper=fs.readFileSync('scripts/r1612-discount-dialog.js.txt','utf8');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const root of roots){
 const file=root+'/'+bundle;
 let code=fs.readFileSync(file,'utf8');
 if(!code.includes(marker)){
  const beginning=code.indexOf('function PB1585Discount(');
  const ending=code.indexOf('function PB1585CopyLocation(',beginning);
  if(beginning<0||ending<beginning||ending-beginning>6500)throw Error('R1612 discount component boundary changed in '+root);
  if(!code.slice(beginning,ending).includes('pb1585DiscountInfo(customer)'))throw Error('R1612 existing customer data source changed in '+root);
  code=code.slice(0,beginning)+react+code.slice(ending);
  const oldCols="['27%','12%','17%','14%','9%','21%']";
  const newCols="['24%','14%','18%','15%','9%','20%']";
  if(code.split(oldCols).length!==2)throw Error('R1612 photographer table colgroup changed in '+root);
  code=code.replace(oldCols,newCols);
  if(!code.includes('e.jsx(PB1585Discount,{customer,onSaved})'))throw Error('R1612 save callback missing in '+root);
  code+='\n'+helper+'\n'+marker+'\n';
  fs.writeFileSync(file,code);
 }
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 fs.copyFileSync('scripts/r1612-discount-spinner.css',root+'/'+cssName);
 const index=root+'/index.html';
 let html=fs.readFileSync(index,'utf8');
 const tag='<link rel="stylesheet" href="/'+cssName+'?v=r1612">';
 if(!html.includes(tag)){
  if(!html.includes('</head>'))throw Error('R1612 missing HTML head in '+root);
  html=html.replace('</head>',tag+'\n</head>');
 }
 const pattern=/index-UIRefine-v655-r84\.js\?[^"']+/g;
 if((html.match(pattern)||[]).length!==1)throw Error('R1612 app entry URL changed in '+root);
 html=html.replace(pattern,url=>url.includes('&labDiscountModal=r1612')?url:url+'&labDiscountModal=r1612');
 fs.writeFileSync(index,html);
 if(root.endsWith('/lab-desktop-ui')){
  const manifestFile=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
  if(manifest.channel!=='lab'||manifest.protocol!==1||!Array.isArray(manifest.files))throw Error('R1612 native manifest format changed');
  for(const name of [bundle,'index.html',cssName]){
   let row=manifest.files.find(x=>x.name===name);
   if(!row){row={name,url:'/lab-desktop-ui/'+name};manifest.files.push(row)}
   row.sha256=digest(fs.readFileSync(root+'/'+name));
  }
  manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  manifest.build=digest(JSON.stringify(manifest.files));
  manifest.generatedAt=new Date().toISOString();
  fs.writeFileSync(manifestFile,JSON.stringify(manifest));
 }
}
console.log('[R1612] Stable in-place timeline circles and centered photographer finance discount dialog · site + Windows UI');
