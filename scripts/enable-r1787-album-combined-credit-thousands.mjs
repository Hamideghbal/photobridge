/* R1787: combined album leaf pricing and true advance receipts.
   Run after all historic transformations; fail closed on changed anchors. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,c)=>fs.writeFileSync(p,c);
const once=(s,a,b,where)=>{const n=s.split(a).length-1;if(n!==1)throw Error('R1787 '+where+' anchor '+n);return s.replace(a,b)};
const region=(s,a,b,fn,where)=>{const i=s.indexOf(a),j=i<0?-1:s.indexOf(b,i+a.length);if(i<0||j<=i)throw Error('R1787 '+where+' bounds');return s.slice(0,i)+fn(s.slice(i,j))+s.slice(j)};

// Lab-owned JSONB mode, with separate pricing as the backward-compatible default.
// Existing binding/custom-model rates remain unchanged; only interpretation is new.
const catalogPath='dist/api/lab-print-catalog.js';
let catalog=read(catalogPath);
catalog=once(catalog,
 'return {types,rates:normalizeRates(data.rates),walkinRates:normalizeRates(data.walkinRates)};',
 'return {types,rates:normalizeRates(data.rates),walkinRates:normalizeRates(data.walkinRates),albumPricingMode:data.albumPricingMode==="combined"?"combined":"separate"};',
 'catalog normalization');
catalog=once(catalog,
 "  if(method==='POST'){\n   updated=addPrintType(catalog,body);",
 "  if(method==='PATCH'&&Object.hasOwn(body,'albumPricingMode')){\n   if(!['combined','separate'].includes(body.albumPricingMode))fail('print_catalog_invalid_album_pricing_mode');\n   updated={...catalog,albumPricingMode:body.albumPricingMode};\n  }else if(method==='POST'){\n   updated=addPrintType(catalog,body);",
 'catalog mode PATCH');
catalog=once(catalog,
 "method==='POST'?'print_catalog.type_create':body.active===false?",
 "method==='POST'?'print_catalog.type_create':Object.hasOwn(body,'albumPricingMode')?'print_catalog.album_pricing_mode':body.active===false?",
 'audit event');
write(catalogPath,catalog);

// Preserve the mode on each order snapshot: changing the Lab setting never
// retrospectively modifies already issued or pending album orders.
const serverPath='dist/api/server.js';let server=read(serverPath);
server=region(server,'async function albumOrderSnapshot(','\nasync function ',part=>{
 part=once(part,
 "    const spreads = Math.max(1, Math.floor(Number(input?.spreads || 0)));",
 "    const pb1787Combined = !customSize && catalog.printTariffCatalog?.albumPricingMode === 'combined';\n    const spreads = Math.max(1, Math.floor(Number(input?.spreads || 0)));",
 'album snapshot flag');
 part=once(part,
 'const manualPrintRequired = Boolean(missingPaperTariff);',
 'const manualPrintRequired = !pb1787Combined && Boolean(missingPaperTariff);',
 'combined skips print tariff');
 part=once(part,
 'const total = manualRequired ? null : knownPrintTotal + Number(bindingTotal || 0)',
 'const total = manualRequired ? null : (pb1787Combined?0:knownPrintTotal) + Number(bindingTotal || 0)',
 'combined total');
 part=once(part,
 '        pricing: {\n            manualRequired,',
 "        pricing: {\n            albumPricingMode: pb1787Combined ? 'combined' : 'separate',\n            manualRequired,",
 'immutable mode');
 return part;
},'album snapshot');

// The invoice contains ONE per-leaf combined line, never a second paper charge.
server=region(server,
 'const paperBreakdown = Array.isArray(ad?.paperBreakdown) && ad.paperBreakdown.length',
 'const needManualCover =',part=>{
 part=once(part,
 'const needManualPrint = pricing.manualRequired',
 "const pb1787Combined = pricing.albumPricingMode === 'combined';\n            const needManualPrint = pricing.manualRequired",
 'invoice mode');
 part=once(part,'if (needManualPrint) {','if (!pb1787Combined && needManualPrint) {','invoice skip manual print');
 part=once(part,'else {\n                for (const row of paperBreakdown)',
              'else if (!pb1787Combined) {\n                for (const row of paperBreakdown)','invoice skip ordinary print');
 const re=/items\.push\(\{ kind: 'album_binding', description: [^\n]+?, quantity: spreads, unitPrice: bindingUnit, lineTotal: bindingUnit \* spreads \}\);/g;
 if((part.match(re)||[]).length!==1)throw Error('R1787 album invoice binding item anchor');
 part=part.replace(re,
  "items.push({ kind: 'album_binding', description: (pb1787Combined?'چاپ و صحافی هر برگ آلبوم ':String(ad?.binding?.name||'صحافی آلبوم').trim()+' ')+String(ad?.size?.label||'سایز آزاد').trim(), quantity: spreads, unitPrice: bindingUnit, lineTotal: bindingUnit * spreads });");
 return part;
},'album invoice');

// Permit a legitimate customer-level advance, including zero-debt accounts.
// Explicit invoice payments still cannot exceed that invoice's open balance.
server=region(server,
 "if (req.method === 'POST' && url.pathname === '/api/lab/finance/payments')",
 "if (req.method === 'GET' && url.pathname === '/api/lab/finance/customer-statement')",part=>{
 part=once(part,
 "available = Math.max(0, await customerReceivableBalance(c, labId, customer.id));",
 "available = await customerReceivableBalance(c, labId, customer.id);",
 'signed balance');
 part=once(part,
 'if (amount > available) {',
 'if (invoiceId && amount > available) {',
 'advance payment allowance');
 return part;
},'finance payment');
write(serverPath,server);
execFileSync(process.execPath,['--check',serverPath],{stdio:'inherit'});

// Lab website: explicit toggle in the existing binding tariff section.
const webJs='dist/web/assets/index-UIRefine-v655-r84.js';let ui=read(webJs);
ui=region(ui,'function tw({data:t,onSaved:a,labName:s=""}){','function Na(t)',part=>{
 part=once(part,
 'const pb1539Label=(id,fallback)=>pb1539Types.find(t=>t.id===id)?.name||fallback;',
 'const pb1539Label=(id,fallback)=>pb1539Types.find(t=>t.id===id)?.name||fallback;\nconst pb1787Combined=pb1539.albumPricingMode==="combined";\nconst pb1787Toggle=async()=>{try{await Me("/api/lab/print-catalog/type",{method:"PATCH",body:JSON.stringify({albumPricingMode:pb1787Combined?"separate":"combined"})});await pb1539Reload()}catch{alert("تغییر روش قیمت‌گذاری انجام نشد.")}};',
 'UI mode helper');
 part=once(part,
 '["album_binding_price",pb1539Label("album_binding_price","صحافی آلبوم")]',
 '["album_binding_price",pb1787Combined?"چاپ و صحافی":pb1539Label("album_binding_price","صحافی آلبوم")]',
 'legacy column label');
 part=once(part,
 'pb1539Custom.filter(t=>t.kind==="binding").map(t=>["pb1539_"+t.id,t.name])',
 'pb1539Custom.filter(t=>t.kind==="binding").map(t=>["pb1539_"+t.id,pb1787Combined?"چاپ و صحافی · "+t.name:t.name])',
 'custom column labels');
 const anchor='e.jsx("button",{className:"pbActionButton secondary",type:"button",onClick:()=>pb1539Create(),children:"صحافی جدید"}),';
 part=once(part,anchor,
 'e.jsxs("label",{className:"pb1787CombinedPriceToggle",children:[e.jsx("input",{type:"checkbox",checked:pb1787Combined,onChange:pb1787Toggle}),e.jsx("span",{children:"قیمت هر برگ شامل چاپ و صحافی است"})]}),'+anchor,
 'mode control');
 return part;
},'lab tariff UI');
// Photographer pre-invoice estimate: the combined leaf rate already includes paper.
ui=once(ui,
 'ma=Tt?0:yt.reduce(($e,gt)=>$e+Number(gt.unitPrice||0)*Number(gt.count||0),0)',
 'ma=Tt||l.printTariffCatalog?.albumPricingMode==="combined"?0:yt.reduce(($e,gt)=>$e+Number(gt.unitPrice||0)*Number(gt.count||0),0)',
 'album preview no double count');
// Show a signed credit as bستانکار, never as a negative unlabeled debt.
const tick=String.fromCharCode(96);
ui=once(ui,
 'label:'+tick+'${Je.name} · مانده ${Xe(Je.balance)}'+tick,
 'label:'+tick+'${Je.name} · ${Number(Je.balance)<0?"بستانکار":"بدهکار"} ${Xe(Math.abs(Je.balance))}'+tick,
 'customer credit label');
// Receipt form keeps the existing payment behavior and adds an explicit credit label.
ui=once(ui,
 'placeholder:"پرداخت علی‌الحساب / بدون اتصال به فاکتور"',
 'placeholder:"پیش‌پرداخت / بستانکاری (بدون فاکتور)"',
 'advance receipt label');
write(webJs,ui);
execFileSync(process.execPath,['--check',webJs],{stdio:'inherit'});

// The initial debt form already formats on every keystroke. Ensure the amount
// is also formatted when focus leaves the field (including autofill/IME).
const intakePath='dist/web/photobridge-r1137-lab-local-intake.js';let intake=read(intakePath);
intake=once(intake,
 'debt.oninput=()=>{debt.value=formatMoney(debt.value);};',
 'debt.oninput=()=>{debt.value=formatMoney(debt.value);};debt.onblur=()=>{debt.value=formatMoney(debt.value);};',
 'opening debt grouping');
write(intakePath,intake);
execFileSync(process.execPath,['--check',intakePath],{stdio:'inherit'});

// Keep the native Lab finance view up-to-date when it shares this React form;
// the installed updater requires hashes for every mutated file.
const nativeRoot='dist/web/lab-desktop-ui',nativeJs=nativeRoot+'/assets/index-UIRefine-v655-r84.js';
let native=read(nativeJs),nativeTouched=false;
if(native.includes('placeholder:"پرداخت علی‌الحساب / بدون اتصال به فاکتور"')){
 native=once(native,'placeholder:"پرداخت علی‌الحساب / بدون اتصال به فاکتور"',
 'placeholder:"پیش‌پرداخت / بستانکاری (بدون فاکتور)"','native receipt label');
 write(nativeJs,native);nativeTouched=true;
 execFileSync(process.execPath,['--check',nativeJs],{stdio:'inherit'});
}
for(const root of ['dist/web',nativeRoot]){
 let html=read(root+'/index.html');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&albumCombined=r1787')?u:u+'&albumCombined=r1787');
 write(root+'/index.html',html);
}
const manifestPath=nativeRoot+'/manifest.json',manifest=JSON.parse(read(manifestPath));
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
for(const name of ['index.html',...(nativeTouched?['assets/index-UIRefine-v655-r84.js']:[])]){
 const entry=manifest.files.find(f=>f.name===name);if(!entry)throw Error('R1787 native manifest missing '+name);
 entry.sha256=hash(fs.readFileSync(nativeRoot+'/'+name));
}
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();write(manifestPath,JSON.stringify(manifest));
console.log('[R1787] immutable combined album tariff, credit-capable receipts, grouped initial debt; no historical invoice rewrites');