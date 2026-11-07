/* R1665: bold customer/coworker thermal invoice (80mm), preserving A4 customer PDF. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {withThermalInvoicePartyFields} from './r1665-finance-party-sql.mjs';
const digest=v=>crypto.createHash('sha256').update(v).digest('hex');
function one(s,oldValue,next,label){const n=s.split(oldValue).length-1;if(n!==1)throw Error('R1665 '+label+' count '+n);return s.replace(oldValue,next)}
let api=fs.readFileSync('dist/api/server.js','utf8');
// R1672: Earlier finance stages can replace the customer-name SQL projection.
// Target the invoice SELECT inside financeDocumentsForCustomer, never its name.
api=withThermalInvoicePartyFields(api);
fs.writeFileSync('dist/api/server.js',api);
execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
const file=root+'/assets/index-UIRefine-v655-r84.js';let js=fs.readFileSync(file,'utf8');
const functionName='function Vy(t,a){';
if(js.includes('function pb1665Thermal(t,a){'))throw Error('R1665 duplicated in '+root);
const snippet=fs.readFileSync('scripts/r1665-thermal-invoice.js.txt','utf8');
if(!snippet.includes('function pb1665Thermal(t,a){'))throw Error('R1665 thermal template unavailable');
js=one(js,functionName,snippet+'\n'+functionName,'invoice thermal function '+root);
const write='s.document.open(),s.document.write(Vy(t,a)),s.document.close()';
js=one(js,write,"s.document.open(),s.document.write(a==='lab'?pb1665Thermal(t,a):Vy(t,a)),s.document.close()",'lab print override '+root);
fs.writeFileSync(file,js);execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
const htmlPath=root+'/index.html';let html=fs.readFileSync(htmlPath,'utf8');let count=0;
html=html.replace(/index-UIRefine-v655-r84\.js\?[^"']*/g,url=>{count++;return url+'&thermalInvoice=r1665'});
if(count!==1)throw Error('R1665 bundle cache reference '+root+' '+count);
fs.writeFileSync(htmlPath,html);
if(root.endsWith('/lab-desktop-ui')){const mp=root+'/manifest.json',m=JSON.parse(fs.readFileSync(mp,'utf8'));
for(const name of ['index.html','assets/index-UIRefine-v655-r84.js']){const entry=m.files.find(x=>x.name===name);if(!entry)throw Error('R1665 native manifest entry '+name);entry.sha256=digest(fs.readFileSync(root+'/'+name))}
m.build=digest(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(mp,JSON.stringify(m));
}
}
console.log('[R1665] Lab thermal invoice uses 80mm monochrome and customer/co-worker identity.');
