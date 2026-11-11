import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const one=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error('[R1797] '+label+' anchor '+n);return s.replace(a,b)};
const region=(s,a,b,fn,label)=>{const i=s.indexOf(a),j=i<0?-1:s.indexOf(b,i+a.length);if(i<0||j<=i)throw Error('[R1797] '+label+' bounds');return s.slice(0,i)+fn(s.slice(i,j))+s.slice(j)};
let server=read('dist/api/server.js');
server=one(server,'async function financeDocumentsForCustomer(c, labId, customerId) {',read('scripts/r1797-invoice-component-rows.js.txt')+'\nasync function financeDocumentsForCustomer(c, labId, customerId) {','invoice component helper');
server=region(server,'    const grouped = new Map();\n    for (const f of fq.rows) {','async function finalizePaidSubscriptionRenewal',part=>{
 part=one(part,",unit].join('|');",",unit,paper,chassis,frame].join('|');",'group component snapshots');
 part=one(part,'unitPrice: unit, quantity: 0, lineTotal: 0','priceComponents:{paper,chassis,frame},unitPrice: unit, quantity: 0, lineTotal: 0','exact issue-time component prices');
 part=one(part,'const items = [...grouped.values()];','const items = pb1797InvoiceComponentRows([...grouped.values()]);','split new invoice rows');
 return part;
},'new print invoices');
fs.writeFileSync('dist/api/server.js',server);
execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});
const stylesheet='photobridge-r1797-invoice-tariff-debt.css';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const jsFile=root+'/assets/index-UIRefine-v655-r84.js';let ui=read(jsFile);
 ui=region(ui,'function pbR1698ApprovedThermal(','function Vy(',part=>{
  part=one(part,'<td class="qty">${number(qty)}</td><td class="unit">${esc(unit)}</td><td class="price">${number(price)}</td>','<td class="price">${number(price)}</td><td class="qty">${number(qty)}</td>','thermal fee then quantity');
  part=one(part,'.desc{text-align:right;width:36%}.qty{width:11%}.unit{width:11%}.price{width:20%}.amount{width:22%}', '.desc{text-align:right;width:42%}.price{width:24%}.qty{width:10%}.amount{width:24%}','thermal four-column widths');
  part=one(part,'<th class="qty">تعداد</th><th class="unit">واحد</th><th class="price">قیمت</th>','<th class="price">فی</th><th class="qty">تعداد</th>','thermal fee heading');
  part=one(part,'colspan="5"','colspan="4"','thermal empty state');
  return part;
 },root+' thermal renderer');
 ui=region(ui,'function Qj(','function Zj(',part=>{
  const start=part.indexOf('e.jsxs("div",{className:"priceScroller walkinPriceScroller"');
  const end=start<0?-1:part.indexOf(']})]}),c!==void 0&&',start);
  if(start<0||end<=start)throw Error('[R1797] '+root+' tariff markup bounds');
  const replacement='e.jsx(PB1797WalkinTable,{rows:s,fields:pb1777Fields,value:pb1777Value,onChange:p,onEdit:m,catalog:pb1777Catalog,models:pb1777Models,onRename:pb1788Rename,onDelete:pb1788Delete,onFrame:pb1777SetEdit})';
  return part.slice(0,start)+replacement+part.slice(end+3);
 },root+' single physical tariff table');
 ui=region(ui,'function PB1465InviteDebt(','\n}',part=>{
  part=one(part,'setAmount(String(result.initialDebt||0))','setAmount(pb1797MoneyInput(result.initialDebt||0))','format loaded debt');
  part=one(part,'setAmount(String(saved.initialDebt))','setAmount(pb1797MoneyInput(saved.initialDebt))','format confirmed debt');
  part=one(part,'onChange:ev=>setAmount(ev.target.value)','onChange:ev=>pb1797MoneyChange(ev,setAmount),onBlur:ev=>setAmount(pb1797MoneyInput(ev.target.value))','group debt as typed');
  return part;
 },root+' photographer directory debt');
 ui+='\n/* PB1797 INVOICE TARIFF DEBT UI */\n'+read('scripts/r1797-tariff-debt-ui.js.txt');
 fs.writeFileSync(jsFile,ui);execFileSync(process.execPath,['--check',jsFile],{stdio:'inherit'});
 const htmlPath=root+'/index.html';let html=read(htmlPath);
 html=one(html,'</head>','<link rel="stylesheet" href="/'+stylesheet+'?v=r1797"></head>',root+' final stylesheet');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u+'&invoiceFee=r1797');
 fs.writeFileSync(htmlPath,html);
}
const native='dist/web/lab-desktop-ui';
fs.copyFileSync('dist/web/'+stylesheet,native+'/'+stylesheet);
const mf=native+'/manifest.json',m=JSON.parse(read(mf)),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
for(const name of ['assets/index-UIRefine-v655-r84.js','index.html',stylesheet]){
 const sha256=hash(fs.readFileSync(native+'/'+name)),entry=m.files.find(f=>f.name===name);
 if(entry)entry.sha256=sha256;else m.files.push({name,url:'/lab-desktop-ui/'+name,sha256});
}
m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();
fs.writeFileSync(mf,JSON.stringify(m));
console.log('[R1797] independent invoice unit prices, aligned customer tariff table and grouped opening debt');
