import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1380 changed anchor '+a.slice(0,110));return s.replace(a,b)};
const server='dist/api/server.js';let s=fs.readFileSync(server,'utf8');
if(!s.includes('/* PB1380 album corrections */')){
 s="import {saveAlbumExtras} from './album-extras-editor.js';\n/* PB1380 album corrections */\n"+s;
 s=once(s,"const packageRequest=catalog.packageCatalogEnabled===false?String(input?.packageRequest||'').trim().slice(0,1200):'';","const packageRequest=''; // Disabled packages are absent, including stale/manual draft requests.");
 const anchor="        if (req.method === 'GET' && url.pathname === '/api/lab/album-settings') {";
 s=once(s,anchor,`        if(req.method==='PUT'&&url.pathname==='/api/lab/album-settings/extras'){
            const body=await bodyJson(req,65536);try{const extras=await saveAlbumExtras({pool,labId,extras:body.extras,onChanged:async(before,after)=>{const changes=albumTariffPriceChanges({extras:before},{extras:after});if(changes.length){const revision=await createLabTariffRevision(pool,labId,a.userId,changes);await notifyLabTariffRevision(labId,revision,changes)}}});await audit(a.userId,labId,'album.extras_update','lab',labId,{count:extras.length}).catch(()=>{});return sendJson(res,200,{ok:true,extras})}catch(e){if(e.status)return sendJson(res,e.status,{error:e.message,display:e.display||'ذخیره خدمات انجام نشد؛ وضعیت را بازخوانی کنید.'});throw e}
        }
`+anchor);fs.writeFileSync(server,s);
}
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1380 flat album editor */')){
 // Keep the previous component definition for backward build checks, but remove its route entry.
 ui=once(ui,'function Sj(){','function PB1380RetiredAlbumEditor(){');ui+='\n/* PB1380 flat album editor */\nfunction Sj(){return e.jsx(PB1380AlbumEditor,{})}\n'+fs.readFileSync('scripts/r1380-album-editor.js','utf8');
 const a=ui.indexOf('function Kv('),b=ui.indexOf('function ',a+15);let order=ui.slice(a,b);
 const manual='l.packageCatalogEnabled===false&&e.jsxs("label",{className:"albumConfigBlock",children:["کیف / باکس (اختیاری)",e.jsx("textarea",{value:pbPackageRequest,maxLength:1200,onChange:event=>setPBPackageRequest(event.target.value),placeholder:"نوع، مدل و رنگ کیف یا باکس دلخواه را بنویسید؛ هزینه توسط لابراتوار تعیین می‌شود."})]}),';order=once(order,manual,'');
 order=once(order,'packageRequest:l.packageCatalogEnabled===false?pbPackageRequest.trim():"",','packageRequest:"",');order=once(order,'||(l.packageCatalogEnabled===false&&pbPackageRequest.trim())','');
 ui=ui.slice(0,a)+order+ui.slice(b);fs.writeFileSync(file,ui);
}
const intake='dist/web/photobridge-r1137-lab-local-intake.js';let walk=fs.readFileSync(intake,'utf8');
if(!walk.includes('/* PB1380 no manual package */')){
 walk=once(walk," const packageRequest=field(grid,'توضیحات کیف / باکس (اختیاری)',node('textarea'));packageRequest.maxLength=1200;packageRequest.parentElement.hidden=album.packageCatalogEnabled!==false;albumPackage.parentElement.hidden=album.packageCatalogEnabled===false;"," albumPackage.parentElement.hidden=album.packageCatalogEnabled===false;");walk=once(walk,"packageRequest:album.packageCatalogEnabled===false?packageRequest.value.trim():'',","packageRequest:'',");walk+='\n/* PB1380 no manual package */\n';fs.writeFileSync(intake,walk);
}
const index='dist/web/index.html';let html=fs.readFileSync(index,'utf8');if(!html.includes('/photobridge-r1380-album-editor.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1380-album-editor.css?v=r1380">\n</head>');html=html.replace(/(photobridge-r1380-album-editor\.css\?v=)[^"']+/g,'$1r1382');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.replace(/&flatAlbum=[^&"']*/g,'')+'&flatAlbum=r1382');fs.writeFileSync(index,html);
s=fs.readFileSync(server,'utf8');
if(!s.includes('/* PB1380 preserve independent extras */')){
 s=once(s,'await c.query(`DELETE FROM lab_album_extras WHERE lab_id=$1`, [labId]);','if(b.preserveExtras!==true)await c.query(`DELETE FROM lab_album_extras WHERE lab_id=$1`, [labId]);');
 s=once(s,'for (const raw of extras) {','for (const raw of b.preserveExtras===true?[]:extras) {');s+='\n/* PB1380 preserve independent extras */\n';fs.writeFileSync(server,s);
}
ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1380 disabled package quote */')){ui=once(ui,'Cn=Q?[]:gn.filter','Cn=l.packageCatalogEnabled===false||Q?[]:gn.filter');ui+='\n/* PB1380 disabled package quote */\n';fs.writeFileSync(file,ui);}
