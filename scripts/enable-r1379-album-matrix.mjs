import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1379 changed anchor: '+a.slice(0,110));return s.replace(a,b)};
const server='dist/api/server.js';let s=fs.readFileSync(server,'utf8');
if(!s.includes('/* PB1379 album shared prices */')){
 s="import {normalizeSharedAlbumPrices} from './album-shared-prices.js';\n/* PB1379 album shared prices */\n"+s;
 s=once(s,"    const coverCatalogEnabled = labPreferences.albumCoverCatalogEnabled !== false;","    const coverCatalogEnabled = labPreferences.albumCoverCatalogEnabled !== false;\n    const packageCatalogEnabled=labPreferences.albumPackageCatalogEnabled!==false,extrasEnabled=labPreferences.albumExtrasEnabled!==false;");
 s=once(s,'return { enabled: Boolean(lq.rows[0]?.album_enabled), coverCatalogEnabled,','return { enabled: Boolean(lq.rows[0]?.album_enabled), coverCatalogEnabled, packageCatalogEnabled,extrasEnabled,');
 s=once(s,"            const rawCatalog = b.coverCatalog", "            try{normalizeSharedAlbumPrices(b)}catch(e){return sendJson(res,400,{error:e.message})}\n            const rawCatalog = b.coverCatalog");
 s=once(s,"ui_preferences=jsonb_set(COALESCE(ui_preferences,'{}'::jsonb),'{albumCoverCatalogEnabled}',$3::jsonb,true)","ui_preferences=COALESCE(ui_preferences,'{}'::jsonb)||$3::jsonb");
 s=once(s,'JSON.stringify(coverCatalogEnabled)]);','JSON.stringify({albumCoverCatalogEnabled:coverCatalogEnabled,albumPackageCatalogEnabled:b.packageCatalogEnabled??albumBase.packageCatalogEnabled??true,albumExtrasEnabled:b.extrasEnabled??albumBase.extrasEnabled??true})]);');
 s=once(s,'return pr && col ? { draftColorId, col, price: albumMoney(pr.price) } : null;','return col ? { draftColorId, col, price: pr ? albumMoney(pr.price) : 0 } : null;');
 s=once(s,'let sizeSort = 0;\n                        for (const [rawSizeLabel, rawPrice] of Object.entries(rawPrices)) {','let sizeSort = 0;\n                        for (const [rawSizeLabel, rawPrice] of Object.entries(b.sharedAlbumPricing===true?Object.fromEntries([...sizeIdsByLabel.keys()].map(label=>[label,rawPrices[label]??0])):rawPrices)) {');
 s=once(s,'const customCover = Boolean(input?.customCover) || !coverCatalogEnabled;','const customCover = !coverCatalogEnabled;');
 s=once(s,'const extras = requestedExtras.map(id => catalog.extras.find((x) => String(x.id) === id)).filter(Boolean);','const extras = catalog.extrasEnabled===false?[]:requestedExtras.map(id => catalog.extras.find((x) => String(x.id) === id)).filter(Boolean);');
 s=once(s,"const packageId = String(input?.packageId || '').trim();","const packageId = catalog.packageCatalogEnabled===false?'':String(input?.packageId || '').trim();\n    const packageRequest=catalog.packageCatalogEnabled===false?String(input?.packageRequest||'').trim().slice(0,1200):'';");
 s=once(s,'const snapshotPackage = albumPackage ?','const snapshotPackage = packageRequest?{id:null,modelName:packageRequest,customRequest:packageRequest,kindLabel:"کیف / باکس سفارشی",price:null}:albumPackage ?');
 s=once(s,'const manualRequired = manualPrintRequired || manualBindingRequired || manualCoverRequired;','const manualPackageRequired=Boolean(packageRequest||(albumPackage&&Number(albumPackage.price)<=0));\n    const manualRequired = manualPrintRequired || manualBindingRequired || manualCoverRequired || manualPackageRequired;');
 s=once(s,'manualPrintRequired, manualBindingRequired, manualCoverRequired,','manualPrintRequired, manualBindingRequired, manualCoverRequired,manualPackageRequired,manualPackagePrice:null,');
 s=once(s,'            return rows;\n        }\n        return [];','            if(pricing.manualPackageRequired)rows.push({key:"album-custom-package",sizeId:"album-custom",sizeLabel:String(ad?.package?.customRequest||ad?.package?.modelName||"کیف / باکس"),printType:"album_custom_package",printTypeLabel:"هزینه کیف / باکس · کل آلبوم",quantity:1,unitPrice:pricing.manualPackagePrice??null,resolved:pricing.manualPackagePrice!=null&&Number.isFinite(Number(pricing.manualPackagePrice))});\n            return rows;\n        }\n        return [];');
 s=once(s,"if (requirement.key === 'album-custom-cover')\n                                currentPricing.manualCoverPrice = rounded;","if (requirement.key === 'album-custom-cover')\n                                currentPricing.manualCoverPrice = rounded;\n                            if(requirement.key==='album-custom-package')currentPricing.manualPackagePrice=rounded;");
 s=once(s,'currentPricing.coverPrice = Number(currentPricing.manualCoverPrice);','currentPricing.coverPrice = Number(currentPricing.manualCoverPrice);\n                        if(currentPricing.manualPackagePrice!=null)currentPricing.packagePrice=Number(currentPricing.manualPackagePrice);');
 // Invoice line generation uses the same manually resolved package component.
 fs.writeFileSync(server,s);
}
const main='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(main,'utf8');
if(!ui.includes('/* PB1379 album matrix */')){
 let a=ui.indexOf('function Sj()'),b=ui.indexOf('function ',a+12);if(a<0||b<a)throw Error('R1379 album editor missing');let editor=ui.slice(a,b);
 editor=once(editor,'coverCatalogEnabled:(ne==null?void 0:ne.coverCatalogEnabled)!==!1,','coverCatalogEnabled:(ne==null?void 0:ne.coverCatalogEnabled)!==!1,packageCatalogEnabled:ne?.packageCatalogEnabled!==false,extrasEnabled:ne?.extrasEnabled!==false,');
 editor=editor.replaceAll('JSON.stringify({...ne,covers:[],coverCatalog:pn(Ue)})','JSON.stringify({...ne,sharedAlbumPricing:true,covers:[],coverCatalog:pn(Ue)})').replaceAll('JSON.stringify({...We,covers:[],coverCatalog:ne})','JSON.stringify({...We,sharedAlbumPricing:true,covers:[],coverCatalog:ne})');
 editor=once(editor,'name:String(at.colorValue||at.name||"").toUpperCase()','name:String(at.name||at.colorValue||"")');
 const start=editor.indexOf('e.jsxs("div",{className:"albumServiceInlineToggle",'),end=editor.indexOf('J==="cover"&&e.jsxs("section"',start);if(start<0||end<start)throw Error('R1379 album toggles missing');
 editor=editor.slice(0,start)+`e.jsx("button",{type:"button",className:"pb1379AlbumMenuToggle",role:"switch","aria-checked":J==="cover"?t.coverCatalogEnabled!==false:J==="package"?t.packageCatalogEnabled!==false:t.extrasEnabled!==false,disabled:S,onClick:()=>{const key=J==="cover"?"coverCatalogEnabled":J==="package"?"packageCatalogEnabled":"extrasEnabled";void Yt({...t,enabled:true,[key]:t[key]===false},s,"وضعیت منو ذخیره شد")},children:(J==="cover"?t.coverCatalogEnabled!==false:J==="package"?t.packageCatalogEnabled!==false:t.extrasEnabled!==false)?"✓ منو فعال":"منو غیرفعال"})]})}),`+editor.slice(end);
 editor=editor.replace('Ue==="album_settings_too_large"?', 'Ue==="album_shared_price_conflict"?"قیمت‌های قدیمی بعضی رنگ‌ها متفاوت است؛ قیمت مشترک را در جدول تعیین کنید.":Ue==="album_settings_too_large"?');
 editor=once(editor,',Pe&&ra.createPortal',',["cover","package"].includes(J)&&e.jsx(PB1379AlbumMatrix,{kind:J,settings:t,catalog:s,setSettings:a,setCatalog:r,busy:S}),Pe&&ra.createPortal');
 ui=ui.slice(0,a)+editor+ui.slice(b);ui+='\n/* PB1379 album matrix */\n'+fs.readFileSync('scripts/r1379-album-matrix.js','utf8');fs.writeFileSync(main,ui);
}
let header=fs.readFileSync('dist/web/photobridge-r1372-third-header.js','utf8');
if(!header.includes('/* PB1379 album menu toggle */')){
 header=once(header,"const previous=row._originals||[];","/* PB1379 album menu toggle */\n if(data.kind==='album'){const toggle=root.querySelector('.pb1379AlbumMenuToggle');if(toggle)originals.push(toggle)}\n const previous=row._originals||[];");
 header=once(header,'button.disabled=original.disabled;',"button.classList.toggle('pb1379HeaderToggle',original.classList.contains('pb1379AlbumMenuToggle'));if(original.getAttribute('role')==='switch'){button.setAttribute('role','switch');button.setAttribute('aria-checked',original.getAttribute('aria-checked'))}else{button.removeAttribute('role');button.removeAttribute('aria-checked')}\n button.disabled=original.disabled;");fs.writeFileSync('dist/web/photobridge-r1372-third-header.js',header);
}
const index='dist/web/index.html';let html=fs.readFileSync(index,'utf8');if(!html.includes('/photobridge-r1379-album-matrix.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1379-album-matrix.css?v=r1379">\n</head>');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&albumMatrix=')?u:u+'&albumMatrix=r1379').replace(/(photobridge-r1372-third-header\.js\?v=)[^"']+/,'$1r1379');fs.writeFileSync(index,html);
// Apply the same selection rules to customer and walk-in orders.
s=fs.readFileSync(server,'utf8');
if(!s.includes('/* PB1379 order selection rules */')){
 s+='\n/* PB1379 order selection rules */\n';
 s=once(s,'extras: xq.rows.map((r)', 'extras: (includeInactive||extrasEnabled?xq.rows:[]).map((r)');
 s=once(s,'const labPreferences = lq.rows[0]?.ui_preferences','const labPreferences = lq.rows[0]?.ui_preferences');
 // Invalid boolean values must never accidentally enable a menu.
 s=once(s,'try{normalizeSharedAlbumPrices(b)}','if(["coverCatalogEnabled","packageCatalogEnabled","extrasEnabled"].some(key=>key in b&&typeof b[key]!=="boolean"))return sendJson(res,400,{error:"album_invalid_menu_setting"});\n            try{normalizeSharedAlbumPrices(b)}');
 s=once(s,"+ (CASE WHEN COALESCE((NULLIF(o.album_data->'pricing'->>'manualCoverRequired',''))::boolean,COALESCE((o.album_data->'size'->>'custom')::boolean,false)) AND NULLIF(o.album_data->'pricing'->>'manualCoverPrice','') IS NULL THEN 1 ELSE 0 END)","+ (CASE WHEN COALESCE((NULLIF(o.album_data->'pricing'->>'manualCoverRequired',''))::boolean,COALESCE((o.album_data->'size'->>'custom')::boolean,false)) AND NULLIF(o.album_data->'pricing'->>'manualCoverPrice','') IS NULL THEN 1 ELSE 0 END)\n              + (CASE WHEN COALESCE((o.album_data->'pricing'->>'manualPackageRequired')::boolean,false) AND NULLIF(o.album_data->'pricing'->>'manualPackagePrice','') IS NULL THEN 1 ELSE 0 END)");
 fs.writeFileSync(server,s);
}
ui=fs.readFileSync(main,'utf8');
if(!ui.includes('/* PB1379 customer package request */')){
 const a=ui.indexOf('function Kv('),b=ui.indexOf('function ',a+15);let order=ui.slice(a,b);
 order=once(order,'{var Qe,rt,G,Oe,ze,ct,lt,Ct,zt,Vt,Rn;','{const[pbPackageRequest,setPBPackageRequest]=x.useState("");var Qe,rt,G,Oe,ze,ct,lt,Ct,zt,Vt,Rn;');
 order=once(order,'Ye=v||!ye','Ye=!ye');
 order=order.replaceAll('packageModelId:Z,packageId:Se,','packageRequest:pbPackageRequest,packageModelId:Z,packageId:Se,');
 order=once(order,'const ht=gt.albumConfig||{},Lt=','const ht=gt.albumConfig||{};setPBPackageRequest(String(ht.packageRequest||""));const Lt=');
 order=once(order,'Vn=gn.length>0&&!Q','Vn=l.packageCatalogEnabled!==false&&gn.length>0&&!Q');
 order=once(order,'packageId:Q?null:Se||null,extraIds:', 'packageRequest:l.packageCatalogEnabled===false?pbPackageRequest.trim():"",packageId:l.packageCatalogEnabled===false||Q?null:Se||null,extraIds:');
 order=once(order,'if(!Q&&Z&&!Se)', 'if(l.packageCatalogEnabled!==false&&!Q&&Z&&!Se)');
 order=once(order,'Vn&&e.jsxs("div",{className:"albumConfigBlock albumPackageCustomerBlock"','l.packageCatalogEnabled===false&&e.jsxs("label",{className:"albumConfigBlock",children:["کیف / باکس (اختیاری)",e.jsx("textarea",{value:pbPackageRequest,maxLength:1200,onChange:event=>setPBPackageRequest(event.target.value),placeholder:"نوع، مدل و رنگ کیف یا باکس دلخواه را بنویسید؛ هزینه توسط لابراتوار تعیین می‌شود."})]}),Vn&&e.jsxs("div",{className:"albumConfigBlock albumPackageCustomerBlock"');
 ui=ui.slice(0,a)+order+ui.slice(b)+'\n/* PB1379 customer package request */\n';fs.writeFileSync(main,ui);
}
const intake='dist/web/photobridge-r1137-lab-local-intake.js';let walk=fs.readFileSync(intake,'utf8');
if(!walk.includes('/* PB1379 walkin selection */')){
 walk=once(walk," const albumPackage=field(grid,'باکس / کیف آلبوم',select([['','بدون باکس']]));"," const albumPackage=field(grid,'باکس / کیف آلبوم',select([['','بدون باکس']]));\n const packageRequest=field(grid,'توضیحات کیف / باکس (اختیاری)',node('textarea'));packageRequest.maxLength=1200;packageRequest.parentElement.hidden=album.packageCatalogEnabled!==false;albumPackage.parentElement.hidden=album.packageCatalogEnabled===false;");
 walk=walk.replaceAll(",['__custom__','جلد سفارشی']",",...(album.coverCatalogEnabled===false?[['__custom__','جلد سفارشی']]:[])");
 walk=once(walk," const extras=Array.isArray(album.extras)?album.extras:[];"," const extras=album.extrasEnabled===false?[]:Array.isArray(album.extras)?album.extras:[];");
 walk=once(walk,"  const customCover=cover.value==='__custom__'||album.coverCatalogEnabled===false;","  const customCover=album.coverCatalogEnabled===false;");
 walk=once(walk,"packageId:albumPackage.value||null,extraIds:","packageRequest:album.packageCatalogEnabled===false?packageRequest.value.trim():'',packageId:album.packageCatalogEnabled===false?null:albumPackage.value||null,extraIds:");
 walk+='\n/* PB1379 walkin selection */\n';fs.writeFileSync(intake,walk);
}
// Menu switches are independent of tariff edits and do not rewrite catalogs.
s=fs.readFileSync(server,'utf8');
if(!s.includes('/* PB1379 independent menu settings */')){
 s=once(s,"        if (req.method === 'GET' && url.pathname === '/api/lab/album-settings') {",`        /* PB1379 independent menu settings */
        if(req.method==='PUT'&&url.pathname==='/api/lab/album-settings/menus'){
            const body=await bodyJson(req),keys={coverCatalogEnabled:'albumCoverCatalogEnabled',packageCatalogEnabled:'albumPackageCatalogEnabled',extrasEnabled:'albumExtrasEnabled'};
            if(!Object.hasOwn(keys,body.key)||typeof body.enabled!=='boolean')return sendJson(res,400,{error:'album_invalid_menu_setting'});
            await pool.query("UPDATE labs SET album_enabled=true,ui_preferences=COALESCE(ui_preferences,'{}'::jsonb)||$2::jsonb,updated_at=now() WHERE id=$1",[labId,JSON.stringify({[keys[body.key]]:body.enabled})]);
            await audit(a.userId,labId,'album.menu_update','lab',labId,{key:body.key,enabled:body.enabled}).catch(()=>{});
            return sendJson(res,200,{ok:true,key:body.key,enabled:body.enabled});
        }
        if (req.method === 'GET' && url.pathname === '/api/lab/album-settings') {`);fs.writeFileSync(server,s);
}
ui=fs.readFileSync(main,'utf8');
if(!ui.includes('/* PB1379 independent menu UI */')){
 ui=once(ui,'disabled:S,onClick:()=>{const key=J===', 'disabled:S||C.tone==="saving",onClick:async()=>{const key=J===');
 ui=once(ui,'void Yt({...t,enabled:true,[key]:t[key]===false},s,"وضعیت منو ذخیره شد")','/* PB1379 independent menu UI */if(R.current)clearTimeout(R.current);y(true);try{const value=t[key]===false;await Me("/api/lab/album-settings/menus",{method:"PUT",body:JSON.stringify({key,enabled:value})});a(old=>({...old,enabled:true,[key]:value}));w({tone:"success",text:"وضعیت منو ذخیره شد"})}catch{w({tone:"error",text:"ذخیره وضعیت منو انجام نشد"})}finally{y(false)}');
 // Retire group/color price entry points; all catalog edits and images remain.
 ui=once(ui,'className:"pbActionButton compact primaryAction",disabled:!de.size,onClick:ma','className:"pb1379RetiredBulkPrice",disabled:true,onClick:ma');fs.writeFileSync(main,ui);
}
ui=fs.readFileSync(main,'utf8');
if(!ui.includes('/* PB1379 manual package draft and quote */')){
 ui=once(ui,'packageModelId:Z,packageId:[...Le]','packageRequest:pbPackageRequest,packageModelId:Z,packageId:Se,extraIds:[...Le]');
 ui=once(ui,'ja=!!(Tt||ka)','ja=!!(Tt||ka||(l.packageCatalogEnabled===false&&pbPackageRequest.trim())||(Wn&&Number(Wn.price)<=0))');ui+='\n/* PB1379 manual package draft and quote */\n';fs.writeFileSync(main,ui);
}
walk=fs.readFileSync(intake,'utf8');
if(!walk.includes('/* PB1379 hide disabled cover menu */')){walk=once(walk,"  const currentSize=String(sizeSelect.value);","  cover.parentElement.hidden=album.coverCatalogEnabled===false;\n  const currentSize=String(sizeSelect.value);");walk+='\n/* PB1379 hide disabled cover menu */\n';fs.writeFileSync(intake,walk);}
