import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const uiFile='dist/web/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(uiFile,'utf8');
const start=ui.indexOf('c&&e.jsx(On,{title:"گالری خصوصی جدید",dialogClassName:"pb1112CreateDialog"');
const end=start<0?-1:ui.indexOf('function PBClientGalleryCompare(',start);
if(start<0||end<start)throw Error('[R1197] new gallery JSX boundaries not found');
let modal=ui.slice(start,end);
function once(needle,replacement,label) {
 const count=modal.split(needle).length-1;
 if(count!==1)throw Error('[R1197] '+label+': expected once, got '+count);
 modal=modal.replace(needle,replacement);
}
once('e.jsxs("label",{children:["رمز ورود خصوصی",e.jsx("input",{',
 'e.jsxs("label",{children:[e.jsxs("span",{className:"pb1196FieldCaption",children:["رمز ورود خصوصی",e.jsx("small",{"aria-hidden":!0,children:"اجباری"})]}),e.jsx("input",{',
 'password caption');
const digitalStart=modal.indexOf('e.jsxs("label",{children:["قیمت فایل دیجیتال (اختیاری · تومان)"');
const digitalEnd=modal.indexOf(',e.jsxs("label",{className:"clientGalleryOrderingToggle"',digitalStart);
if(digitalStart<0||digitalEnd<digitalStart||digitalEnd-digitalStart>650)
 throw Error('[R1197] duplicate create-form digital price changed');
modal=modal.slice(0,digitalStart)+modal.slice(digitalEnd+1);
once('"سفارش چاپ و فاکتور (انتخاب عکس فعال است)"','"سفارش و فاکتور"','invoice checkbox label');
once('disabled:g||!!PB1112draft.current||!Number(h.digitalPrice)',
 'disabled:g||!!PB1112draft.current','invoice checkbox enabling');
ui=ui.slice(0,start)+modal+ui.slice(end);
const digitalPayload='digitalPrice:Number(h.digitalPrice||0)';
if(ui.split(digitalPayload).length!==2)throw Error('[R1197] single create payload digital price missing');
ui=ui.replace(digitalPayload,'digitalPrice:0');

const serverFile='dist/api/server.js';
let server=fs.readFileSync(serverFile,'utf8');
const sectionStart=server.indexOf("if (req.method === 'POST' && url.pathname === '/api/customer/client-galleries')");
const sectionEnd=sectionStart<0?-1:server.indexOf('const customerGalleryRenew',sectionStart);
if(sectionStart<0||sectionEnd<sectionStart)throw Error('[R1197] gallery create server section missing');
let section=server.slice(sectionStart,sectionEnd);
const anchor="            const token = crypto.randomBytes(24).toString('base64url')";
const guard=[
 "            // R1197: activation uses priced, active profile print tariffs; check BEFORE charging wallet.",
 "            if (orderingEnabled && moneyAmount(b.digitalPrice) <= 0) {",
 "                const tariffReady = await pool.query(",
 "                    'SELECT 1 FROM photographer_gallery_print_tariffs t ' +",
 "                    'LEFT JOIN print_sizes ps ON ps.id=t.size_id ' +",
 "                    'LEFT JOIN photographer_gallery_custom_sizes cs ON cs.id=t.size_id AND cs.owner_id=t.owner_id AND cs.active=true ' +",
 "                    'WHERE t.owner_id=$1 AND t.active=true ' +",
 "                    'AND ((t.luster_enabled AND COALESCE(t.luster_price,0)>0) ' +",
 "                    'OR (t.silk_enabled AND COALESCE(t.silk_price,0)>0) ' +",
 "                    'OR (t.metallic_enabled AND COALESCE(t.metallic_price,0)>0)) ' +",
 "                    'AND ((ps.id IS NOT NULL AND ps.active=true AND (ps.owner_lab_id IS NULL OR ps.owner_lab_id=$2) ' +",
 "                    'AND NOT EXISTS (SELECT 1 FROM lab_hidden_print_sizes h WHERE h.lab_id=$2 AND h.size_id=t.size_id)) ' +",
 "                    'OR cs.id IS NOT NULL) LIMIT 1', [a.userId, labId]);",
 "                if (!tariffReady.rowCount)",
 "                    return sendJson(res, 400, { error: 'gallery_ordering_tariff_required' });",
 "            }",
 ""
].join('\n');
if(section.split(anchor).length!==2)throw Error('[R1197] pre-wallet creation guard anchor changed');
section=section.replace(anchor,guard+anchor);
server=server.slice(0,sectionStart)+section+server.slice(sectionEnd);
const message='v==="gallery_ordering_tariff_required"?"برای فعال‌کردن سفارش و فاکتور، ابتدا قیمت چاپ را در مدیریت تعرفه‌های گالری ثبت کن.":';
const old='v==="gallery_service_disabled"?"ساخت گالری مشتری در حال حاضر توسط ادمین غیرفعال است.":';
if(ui.split(old).length!==2)throw Error('[R1197] gallery create API error mapping changed');
ui=ui.replace(old,message+old);
fs.writeFileSync(uiFile,ui);
fs.writeFileSync(serverFile,server);

const htmlFile='dist/web/index.html';
let html=fs.readFileSync(htmlFile,'utf8');
const tag='<link rel="stylesheet" href="/photobridge-r1197-gallery-create-four-fields.css?v=r1197">';
if(!html.includes(tag)){
 if(html.includes('photobridge-r1197-gallery-create-four-fields.css'))throw Error('[R1197] stale style URL');
 if(!html.includes('</body>'))throw Error('[R1197] site HTML body missing');
 html=html.replace('</body>',tag+'\n</body>');
}
const rx=/(index-UIRefine-v655-r84\.js\?v=[^"']+)/g;
if([...html.matchAll(rx)].length!==1)throw Error('[R1197] React module URL not found once');
html=html.replace(rx,s=>s.includes('&form=r1197')?s:s+'&form=r1197');
fs.writeFileSync(htmlFile,html);
execFileSync(process.execPath,['--check',uiFile],{stdio:'inherit'});
execFileSync(process.execPath,['--check',serverFile],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1197-gallery-create-four-fields.cjs','scripts/test-r1196-gallery-field-align.cjs'],{stdio:'inherit'});
