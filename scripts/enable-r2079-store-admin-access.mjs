// R2079: scoped platform-admin store access + verified manager transfer.
import fs from 'node:fs';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const once=(s,a,b,label)=>{const count=s.split(a).length-1;if(count!==1)throw Error('[R2079] '+label+' anchor '+count);return s.replace(a,()=>b)};
function write(file,s){
 fs.writeFileSync(file,s);const bytes=fs.readFileSync(file);
 for(const [ext,encode,decode] of [['.br',zlib.brotliCompressSync,zlib.brotliDecompressSync],['.gz',zlib.gzipSync,zlib.gunzipSync]])if(fs.existsSync(file+ext)){fs.writeFileSync(file+ext,encode(bytes));if(!decode(fs.readFileSync(file+ext)).equals(bytes))throw Error('[R2079] stale '+file+ext);}
}
function serverPatch(s){
 if(s.includes('function pb2079PreviewScope('))return s;
 const auth='async function auth(req) {';
 s=once(s,auth,read('scripts/r2079-store-preview-auth.txt')+'\n'+auth+'\n    const pb2079Scope=pb2079PreviewScope(req);if(pb2079Scope!==null)return pb2079PreviewAuth(req,pb2079Scope);','preview auth before legacy Sofia fallback');
 const apiAnchor='    const a = await auth(req);\n    // Independent owner-scoped CRM endpoints;';
 // Anchor directly after the API authentication, before ANY handler runs.
 const apiActual='    const a = await auth(req);\n    // Independent owner-scoped CRM endpoints; legacy lab/photographer flows unchanged.';
 const gate=[
 '    const a = await auth(req);',
 '    const pb2079Scope=pb2079PreviewScope(req);',
 '    if(pb2079Scope!==null){',
 '        if(!a?.adminStorePreview)return sendJson(res,403,{error:"admin_store_preview_forbidden"});',
 '        if(url.pathname==="/api/auth/logout")return sendJson(res,200,{ok:true});',
 '        if(/^\\/api\\/rental\\/(?:push(?:\\/|$)|notifications(?:\\/|$)|desktop(?:\\/|$)|alert-agent(?:\\/|$))/.test(url.pathname)||/\\/zibal\\/request$/.test(url.pathname))return sendJson(res,403,{error:"admin_store_preview_operation_unavailable"});',
 '    }',
 '    // Independent owner-scoped CRM endpoints; legacy lab/photographer flows unchanged.'
 ].join('\n');
 s=once(s,apiActual,gate,'preview scope fail closed / no global session or user actions');
 s=once(s,'if (activeToken && !bearerToken(req))','if (activeToken && !bearerToken(req) && !a.adminStorePreview)','do not replace rental cookie from admin');
 const create="    if (req.method === 'POST' && url.pathname === '/api/admin/equipment-rental/shops') {";
 s=once(s,create,read('scripts/r2079-store-admin-route.txt')+create,'admin actions before create');
 return s;
}
function uiPatch(s){
 if(s.includes('data-pb2079-open-store'))return s;
 const edit='<button data-edit>ویرایش</button>';
 const actions='<button type="button" class="primary" data-pb2079-open-store>ورود به پنل فروشگاه</button><button type="button" data-pb2079-transfer-manager>تغییر مدیر فروشگاه</button>';
 s=once(s,edit,actions+edit,'admin store actions');
 const handler="if(e.target.closest('[data-edit]'))return edit(shop);";
 s=once(s,handler,"if(e.target.closest('[data-pb2079-open-store]'))return pb2079OpenStore(shop);if(e.target.closest('[data-pb2079-transfer-manager]'))return pb2079TransferManager(shop,e.target.closest('[data-pb2079-transfer-manager]'));"+handler,'admin actions click');
 s=once(s,'async function managerAccess(s){',read('scripts/r2079-store-admin-ui.txt')+'\nasync function managerAccess(s){','admin UI helpers');
 // Manager mobile is an access change, not an ordinary profile-edit field.
 const mobile='<input name="managerMobile" dir="ltr" value="'+String.fromCharCode(36,123)+'esc(s.manager_mobile||\'\')}">';
 s=once(s,mobile,mobile.replace('<input ','<input readonly title="برای تغییر شماره مدیر از دکمه تغییر مدیر فروشگاه استفاده کنید" '),'manager phone read-only in profile editor');
 return s;
}
const server='dist/api/server.js',ui='dist/web/photobridge-v904r19-admin-stores.js',portal='dist/api/equipment-rental-portal.html',htmlFile='dist/web/index.html';
write(server,serverPatch(read(server)));write(ui,uiPatch(read(ui)));
let p=read(portal);if(!p.includes('id="pb2079StorePreview"')){const head=p.search(/<head(?:\s[^>]*)?>/i);if(head<0||head>1000)throw Error('[R2079] real portal head missing');const at=p.indexOf('>',head)+1;p=p.slice(0,at)+read('scripts/r2079-store-preview-portal.txt')+p.slice(at);p=once(p,'async function rentalLogout(){','async function rentalLogout(){if(window.pb2079StorePreview){window.pb2079StorePreview.back();return;}','preview exit without ordinary logout');write(portal,p);}
let html=read(htmlFile);
const re=/photobridge-v904r19-admin-stores\.js\?[^"'<>\s]+/g;
if([...html.matchAll(re)].length!==1)throw Error('[R2079] admin asset URL');
html=html.replace(re,u=>u.replace(/&storeAdmin=r\d+/g,'')+'&storeAdmin=r2079');write(htmlFile,html);
for(const file of [server,ui])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('[R2079] explicit admin store preview, scoped transport, verified manager transfer');
