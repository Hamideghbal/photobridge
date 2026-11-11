import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1608 anchor changed: '+a.slice(0,100));return s.replace(a,b)};
const path='dist/web/assets/index-UIRefine-v655-r84.js';let s=fs.readFileSync(path,'utf8');const a=s.indexOf('function ej('),b=s.indexOf('function vh(',a);if(a<0||b<a)throw Error('R1608 intake component missing');let c=s.slice(a,b);
c=once(c,'Ne=(ue,P,b)=>k(oe=>oe.map(ee=>ee.id===ue?{...ee,[P]:b}:ee))','Ne=(ue,P,b)=>k(oe=>oe.map(ee=>ee.id===ue?{...ee,[P]:b,files:P==="chassis"?ee.files.map(file=>({...file,chassisOverride:null})):ee.files}:ee))');
c=once(c,'className:"simplePrintCardAddonCheck "+(ue.chassis?"selected":"")','className:"simplePrintCardAddonCheck pb1608ChassisGroup "+(pb1608ChassisState(ue)==="all"?"selected":pb1608ChassisState(ue)==="mixed"?"mixed":"")');
// The exact stock is already used by the authoritative size-level checkbox.
// Expose it on that label for the separate per-photo controls to reuse.
// The price source stays unchanged and the lab/other add-ons are unaffected.
const pb1764Group='className:"simplePrintCardAddonCheck pb1608ChassisGroup "+(pb1608ChassisState(ue)==="all"?"selected":pb1608ChassisState(ue)==="mixed"?"mixed":"")';
c=once(c,pb1764Group,pb1764Group+',"data-pb1764-stock":oe==null?"unknown":oe.chassis_stock==null?"unlimited":oe.chassis_stock');
c=once(c,'className:"simplePrintPhotoAddonCheck "+(bt?"selected":"")','className:"simplePrintPhotoAddonCheck "+(bt?"selected":""),"data-pb1765-copies":pbPrintCopies(Be)');
c=once(c,'"اعمال شاسی روی همه عکس‌های این کارت"','(pb1608ChassisState(ue)==="mixed"?"شاسی بعضی عکس‌ها دستی انتخاب شده؛ برای اعمال به همه کلیک کنید":"اعمال شاسی روی همه عکس‌های این کارت")');
c=once(c,'type:"checkbox",checked:ue.chassis,disabled:W||Number(oe==null?void 0:oe.chassis_stock)===0','type:"checkbox",checked:pb1608ChassisState(ue)==="all",ref:node=>{if(node)node.indeterminate=pb1608ChassisState(ue)==="mixed"},"aria-label":"شاسی همهٔ عکس‌های این سایز","aria-checked":pb1608ChassisState(ue)==="mixed"?"mixed":pb1608ChassisState(ue)==="all",disabled:W||pb1773ChassisGroupShortage(ue,oe)');
c=once(c,'e.jsx("span",{children:"شاسی"})]}),Q&&e.jsxs("label",{className:"simplePrintCardAddonCheck','e.jsx("span",{children:"شاسی"}),pb1608ChassisState(ue)==="mixed"&&e.jsx("small",{className:"pb1608ChassisMixedHint",children:"انتخاب دستی"})]}),Q&&e.jsxs("label",{className:"simplePrintCardAddonCheck');
s=s.slice(0,a)+c+s.slice(b)+'\n'+fs.readFileSync('scripts/r1608-chassis-state.js.txt','utf8');fs.writeFileSync(path,s);execFileSync(process.execPath,['--check',path]);
const css='photobridge-r1608-compact-chassis.css';fs.copyFileSync('scripts/r1608-compact-chassis.css','dist/web/'+css);const html='dist/web/index.html';s=fs.readFileSync(html,'utf8').replace('</head>',`<link rel="stylesheet" href="/${css}?v=r1608"></head>`).replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,'$1&chassisState=r1608&chassisCopies=r1765');s=s.replace('photobridge-r1764-chassis-order-mobile.js?v=r1765','photobridge-r1764-chassis-order-mobile.js?v=r1773');fs.writeFileSync(html,s);
