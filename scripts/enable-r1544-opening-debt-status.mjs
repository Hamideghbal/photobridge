import fs from 'node:fs';
import crypto from 'node:crypto';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
// The installed native host's legacy local account projection omits initialDebt
// and canEditInitialDebt. A finance-scoped compatible alias uses the EXACT same
// server handler, role/lab/membership checks, invoice lock and balanced journal.
const api='dist/api/lab-manual-customer-controls.js';let server=fs.readFileSync(api,'utf8');
const old="const match=url.pathname.match(/^\\/api\\/lab\\/delegated-customers\\/([0-9a-f-]{36})\\/(account-summary|adjust-initial-debt)$/i);";
const fixed="/* PB1544 authoritative opening-debt route */\n "+old.slice(0,-1)+"||url.pathname.match(/^\\/api\\/lab\\/finance\\/customer-initial-debt\\/([0-9a-f-]{36})\\/(account-summary|adjust-initial-debt)$/i);";
if(!server.includes('PB1544 authoritative opening-debt route')){if(server.split(old).length!==2)throw Error('R1544 account handler changed');server=server.replace(old,fixed);fs.writeFileSync(api,server)}
const bundle='assets/index-UIRefine-v655-r84.js';let js=fs.readFileSync('dist/web/'+bundle,'utf8');
if(!js.includes('/* PB1544 authoritative opening-debt UI */')){
 const one=(a,b)=>{if(js.split(a).length!==2)throw Error('R1544 UI anchor changed: '+a.slice(0,90));js=js.replace(a,b)};
 one("Me('/api/lab/delegated-customers/'+customerId+'/account-summary')","Me(pb1544DebtUrl(customerId,'account-summary'))");
 one("Me('/api/lab/delegated-customers/'+customerId+'/adjust-initial-debt',", "Me(pb1544DebtUrl(customerId,'adjust-initial-debt'),");
 one("Me('/api/lab/delegated-customers/'+encodeURIComponent(customerId)+'/account-summary',", "Me(pb1544DebtUrl(customerId,'account-summary'),");
 one("data&&e.jsx('p',{children:'پس از صدور اولین فاکتور، بدهی اولیه قابل اصلاح نیست.'})", "data&&e.jsx('p',{children:data.canEditInitialDebt===false&&data.hasInvoice===true?'پس از صدور اولین فاکتور، بدهی اولیه قابل اصلاح نیست.':'وضعیت اجازهٔ اصلاح از سایت دریافت نشد؛ اتصال را بررسی و پنجره را دوباره باز کنید.'})");
 js+=`\n/* PB1544 authoritative opening-debt UI */\nfunction pb1544DebtUrl(customerId,action){const native=Boolean(window.pbNativeFolder||window.__PB_NATIVE_SOURCE_PROOF__);return (native?'/api/lab/finance/customer-initial-debt/':'/api/lab/delegated-customers/')+encodeURIComponent(customerId)+'/'+action}\n`;
 fs.writeFileSync('dist/web/'+bundle,js);
}
const root='dist/web/lab-desktop-ui';const native=js.replace('const ai=()=>!pb1483Phone()&&typeof window.showDirectoryPicker=="function"','const ai=()=>typeof window.showDirectoryPicker=="function"');if(!native.includes('const ai=()=>typeof window.showDirectoryPicker=="function"'))throw Error('R1544 native storage capability changed');fs.writeFileSync(root+'/'+bundle,native);
for(const directory of ['dist/web',root]){let html=fs.readFileSync(directory+'/index.html','utf8');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&openingDebt=r1544')?u:u+'&openingDebt=r1544');fs.writeFileSync(directory+'/index.html',html)}
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));if(manifest.protocol!==1||manifest.channel!=='lab')throw Error('R1544 native contract changed');for(const name of [bundle,'index.html']){const entry=manifest.files.find(f=>f.name===name);if(!entry)throw Error('R1544 missing native asset');entry.sha256=hash(fs.readFileSync(root+'/'+name))}manifest.build=hash(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();fs.writeFileSync(root+'/manifest.json',JSON.stringify(manifest));
console.log('[PhotoBridge R1544] authoritative opening-debt eligibility on installed native hosts');
