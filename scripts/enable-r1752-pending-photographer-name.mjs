// R1752: narrow post-build patch for the lab's preregistered photographer list.
// Applied AFTER older UI rebuild steps; never patch the manual-intake launcher.
import fs from 'node:fs';
import crypto from 'node:crypto';
const marker='/* PB1752 pending photographer temporary name */';
const once=(text,oldValue,newValue,label)=>{
  const count=text.split(oldValue).length-1;
  if(count!==1)throw Error('[R1752] '+label+' anchor count '+count);
  return text.replace(oldValue,newValue);
};
const serverFile='dist/api/server.js';
let server=fs.readFileSync(serverFile,'utf8');
if(!server.includes(marker)){
  server=once(server,"import {createGalleryMessaging} from './gallery-messaging.js';",
    "import {updatePendingLabCustomerName} from './lab-pending-customer-name.js';\nimport {createGalleryMessaging} from './gallery-messaging.js';",
    'server import');
  const fromName='SELECT u.id,COALESCE(pp.studio_name,u.name) name,u.email,u.mobile,COALESCE(pp.location_lat,u.location_lat)';
  const eligible='NOT m.active AND NOT COALESCE(u.photographer_enabled,false) AND u.mobile_verified_at IS NULL AND pp.user_id IS NULL';
  const toName='SELECT u.id,CASE WHEN '+eligible+
    " THEN COALESCE(NULLIF(pending_i.target_name,''),u.name) ELSE COALESCE(NULLIF(pp.studio_name,''),u.name) END name,"+
    'pending_i.target_name temporary_name,('+eligible+
    ') temporary_name_editable,u.email,u.mobile,COALESCE(pp.location_lat,u.location_lat)';
  server=once(server,fromName,toName,'lab dashboard customer display name');
  // Earlier releases may extend this SQL WHERE clause. Limit the injection
  // to the single dashboard customer SELECT rather than replacing the full JOIN/WHERE.
  const pendingSelect=server.indexOf('pending_i.target_name temporary_name');
  const endOfCustomerQuery=pendingSelect<0?-1:server.indexOf('ORDER BY m.created_at DESC',pendingSelect);
  const profileJoin='LEFT JOIN photographer_profiles pp ON pp.user_id=u.id';
  if(pendingSelect<0||endOfCustomerQuery<0||endOfCustomerQuery-pendingSelect>5000)
    throw Error('[R1752] lab dashboard customer query boundary changed');
  const customerQuery=server.slice(pendingSelect,endOfCustomerQuery);
  if(customerQuery.split(profileJoin).length!==2)
    throw Error('[R1752] dashboard photographer profile JOIN not uniquely found');
  const invitationJoin=" LEFT JOIN LATERAL ("+
    "SELECT i.target_name FROM invitations i WHERE i.lab_id=m.lab_id AND i.target_mobile IS NOT NULL AND u.mobile IS NOT NULL "+
    "AND right(regexp_replace(i.target_mobile,'[^0-9]','','g'),10)=right(regexp_replace(u.mobile,'[^0-9]','','g'),10) "+
    "AND i.active=true AND i.uses=0 ORDER BY i.created_at DESC LIMIT 1"+
    ") pending_i ON true";
  server=server.slice(0,pendingSelect)+
    customerQuery.replace(profileJoin,profileJoin+invitationJoin)+
    server.slice(endOfCustomerQuery);
  const fromPatch="if (cm && req.method === 'PATCH') {\n            const b = await bodyJson(req);\n            const hasActive";
  const extra=[
    "if (cm && req.method === 'PATCH') {",
    "            const b = await bodyJson(req);",
    "            if (Object.prototype.hasOwnProperty.call(b,'temporaryName')) {",
    "                if (Object.keys(b).length!==1) return sendJson(res,400,{error:'invalid_temporary_name_request'});",
    "                const renamed = await updatePendingLabCustomerName({pool,crypto,labId,userId:cm[1],actorId:a.userId,name:b.temporaryName});",
    "                if (!renamed.ok) return sendJson(res,renamed.status,{error:renamed.error});",
    "                await audit(a.userId,labId,'customer.pending_name_edit','user',cm[1],{temporaryName:renamed.name}).catch(()=>{});",
    "                return sendJson(res,200,{ok:true,name:renamed.name});",
    "            }",
    "            const hasActive"
  ].join('\n');
  server=once(server,fromPatch,extra,'lab customer PATCH');
  server+='\n'+marker+'\n';
  fs.writeFileSync(serverFile,server);
}
const uiOld='e.jsx("b",{children:h.name}),e.jsx("small",{dir:"ltr",children:h.mobile||"بدون شماره موبایل"})';
const uiNew=[
 'e.jsxs("div",{className:"pbR1752NameRow",children:[',
 'e.jsx("b",{children:h.name}),',
 'h.temporary_name_editable&&e.jsx("button",{type:"button",className:"pbR1752NameEdit",title:"ویرایش نام موقت عکاس",',
 '"aria-label":"ویرایش نام موقت "+(h.name||"عکاس"),onClick:async()=>{',
 'const initial=String(h.temporary_name||"");',
 'const answer=prompt("نام موقت عکاس یا عکاسی را وارد کنید:",initial);',
 'if(answer===null)return;',
 'const name=String(answer).trim().replace(/\\s+/g," ");',
 'if(!name||name.length>140){alert("نام موقت را بین ۱ تا ۱۴۰ کاراکتر وارد کنید.");return;}',
 'try{await Me("/api/lab/customers/"+h.id,{method:"PATCH",body:JSON.stringify({temporaryName:name})});o();}',
 'catch(error){const code=error?.data?.error;alert(code==="customer_not_preregistered"?"این عکاس دیگر در وضعیت پیش‌عضویت نیست.":',
 'code==="invalid_temporary_name"?"نام موقت معتبر نیست.":"ذخیره نام موقت انجام نشد. دوباره تلاش کنید.");}',
 '},children:"✎"})',
 ']}),e.jsx("small",{dir:"ltr",children:h.mobile||"بدون شماره موبایل"})'
].join('');
const css='.pbR1752NameRow{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}.pbR1752NameRow>b{min-width:0;overflow-wrap:anywhere}.pbR1752NameEdit{width:29px;height:29px;min-width:29px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;color:#334155;font-size:20px;line-height:1;cursor:pointer}.pbR1752NameEdit:hover,.pbR1752NameEdit:focus-visible{background:#e2e8f0;outline:2px solid transparent;border-color:#64748b}';
const tag='<style id="pbR1752TemporaryNameStyle">'+css+'</style>';
const sha=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const roots=['dist/web','dist/web/lab-desktop-ui'];
let modified=0;
for(const root of roots){
 const bundle=root+'/assets/index-UIRefine-v655-r84.js';
 const index=root+'/index.html';
 if(!fs.existsSync(bundle)||!fs.existsSync(index)){
  if(root==='dist/web')throw Error('[R1752] site UI missing');
  console.log('[R1752] no generated Windows Lab UI snapshot, skipped');
  continue;
 }
 let ui=fs.readFileSync(bundle,'utf8');
 if(!ui.includes('pbR1752NameEdit')){
  ui=once(ui,uiOld,uiNew,root+' photographer name row');
  fs.writeFileSync(bundle,ui);
 }
 let html=fs.readFileSync(index,'utf8');
 if(!html.includes('pbR1752TemporaryNameStyle'))html=once(html,'</head>',tag+'</head>',root+' style');
 const source=/assets\/index-UIRefine-v655-r84\.js\?[^"'<>\s]*/g;
 const found=[...html.matchAll(source)];
 if(found.length!==1)throw Error('[R1752] '+root+' module cache URL count '+found.length);
 html=html.replace(source,url=>url.includes('&pendingName=r1752')?url:url+'&pendingName=r1752');
 fs.writeFileSync(index,html);
 const manifestFile=root+'/manifest.json';
 if(fs.existsSync(manifestFile)){
  const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
  if(!Array.isArray(manifest.files))throw Error('[R1752] native manifest invalid');
  for(const asset of ['index.html','assets/index-UIRefine-v655-r84.js']){
   const entry=manifest.files.find(f=>f.name===asset);
   if(!entry)throw Error('[R1752] manifest entry missing: '+asset);
   entry.sha256=sha(fs.readFileSync(root+'/'+asset));
  }
  manifest.build=sha(Buffer.from(JSON.stringify(manifest.files)));
  manifest.generatedAt=new Date().toISOString();
  fs.writeFileSync(manifestFile,JSON.stringify(manifest));
 }
 modified++;
}
console.log('[R1752] pending photographer names editable in '+modified+' lab UI packages; invoice/SMS/manual-intake untouched.');
