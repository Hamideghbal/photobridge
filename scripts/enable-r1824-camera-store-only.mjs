/* R1824 camera stores only: no lab or frame/chassis behavior change. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const once=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error('[R1824] '+label+' anchor count '+n);return s.replace(a,b)};
const scoped=(s,start,end,fn,label)=>{const a=s.indexOf(start),b=a<0?-1:s.indexOf(end,a+start.length);if(a<0||b<=a)throw Error('[R1824] '+label+' bounds');return s.slice(0,a)+fn(s.slice(a,b))+s.slice(b)};
let api=read('dist/api/server.js');
api=once(api,
 "    if (req.method === 'POST' && url.pathname === '/api/admin/equipment-rental/shops') {",
 read('scripts/r1824-camera-admin-renewal.txt')+"    if (req.method === 'POST' && url.pathname === '/api/admin/equipment-rental/shops') {",
 'admin camera-store renewal route');
api=scoped(api,"if (req.method === 'POST' && url.pathname === '/api/rental/photographer-invites/send-sms') {","    // Store-origin photographers",part=>{
 const before="} catch(e){ const code=String(e?.message||'sms_send_failed'), status=";
 const after="} catch(e){ const code=String(e?.message||'sms_send_failed');"+
  "if(context==='invite'&&['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(shop.business_category||''))){"+
  "const full=await photographerInviteByCode(inv.code).catch(()=>null);"+
  "return sendJson(res,200,{ok:true,inviteCreated:true,preRegistered:Boolean(inviteIdentity?.preRegistered),requiresConfirmation:false,"+
  "invite:full?photographerInvitePublicView(full):null,url:inviteUrl,sms:{sent:false,error:code}});"+
  "}const status=";
 return once(part,before,after,'camera invite SMS failure manual-link fallback');
},'rental invite-only API');
if(!api.includes("camera_store_only")||!api.includes("inviteCreated:true,preRegistered"))throw Error('[R1824] server scope guard missing');
write('dist/api/server.js',api);
execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});
let ui=read('dist/web/photobridge-v904r19-admin-stores.js');
const renewBtn=String.fromCharCode(36,123)+'["equipment_rental","equipment_sale","equipment_rental_sale"].includes(String(s.business_category||""))?'+
 JSON.stringify('<button class="primary" data-pb1824-renew>تمدید اعتبار</button>')+':""}';
ui=once(ui,'<button data-edit>ویرایش</button><button data-store-domain>',
 '<button data-edit>ویرایش</button>'+renewBtn+'<button data-store-domain>','camera-only admin renew button');
ui=once(ui,"if(e.target.closest('[data-edit]'))return edit(shop);",
 "if(e.target.closest('[data-pb1824-renew]'))return pb1824RenewCameraShop(shop);if(e.target.closest('[data-edit]'))return edit(shop);",
 'camera-only admin renewal click');
ui=once(ui,'async function managerAccess(s){',read('scripts/r1824-camera-admin-ui.txt')+'\nasync function managerAccess(s){','admin renewal action');
write('dist/web/photobridge-v904r19-admin-stores.js',ui);
execFileSync(process.execPath,['--check','dist/web/photobridge-v904r19-admin-stores.js'],{stdio:'inherit'});
let portal=read('dist/api/equipment-rental-portal.html');
portal=once(portal,'</head><body class="pbRentalBoot">',
 '<style id="pbR1824CameraScroll">'+read('scripts/r1824-camera-scroll.css')+'</style></head><body class="pbRentalBoot">',
 'camera store scrollbar rules');
portal=once(portal,'const paintToken=++pb853TabPaintToken;',
 "document.documentElement.classList.toggle('pb1824CameraScroll',"+
 "['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(data?.shop?.business_category||''))"+
 "&&['bookings','sales','items'].includes(tab));const paintToken=++pb853TabPaintToken;",
 'camera store three-tab scroll gate');
portal=once(portal,'async function pb904r22SendInvite(',read('scripts/r1824-camera-invite-copy-ui.txt')+'\nasync function pb904r22SendInvite(','camera invite copy UI');
const inviteEnd="body:JSON.stringify({mobile,name,previousDebt,requiredFields,context:'invite'})});message('#photographerMsg',";
portal=once(portal,inviteEnd,
 "body:JSON.stringify({mobile,name,previousDebt,requiredFields,context:'invite'})});"+
 "if(['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(data?.shop?.business_category||''))&&out?.sms?.sent===false){"+
 "pb1824CameraInviteCopy(out);return true;}message('#photographerMsg',",
 'camera invite fallback response');
if(!portal.includes('pbR1824CameraScroll')||!portal.includes("['bookings','sales','items'].includes(tab)")||!portal.includes("pb1824CameraInviteCopy(out);return true;"))
 throw Error('[R1824] camera portal scope incomplete');
write('dist/api/equipment-rental-portal.html',portal);
let html=read('dist/web/index.html');
html=once(html,'photobridge-v904r19-admin-stores.js?v=r1256','photobridge-v904r19-admin-stores.js?v=r1824','admin browser cache');
write('dist/web/index.html',html);
console.log('[R1824] camera equipment store ONLY: admin credit, scrollbar and invitation copy recovery installed.');