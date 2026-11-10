// R1769: per-lab Latin photographer folder alias, independent of identity and finance.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const marker='/* PB1769 LAB LATIN FOLDER ALIAS */';
const once=(src,from,to,label)=>{
 const n=src.split(from).length-1;
 if(n!==1)throw Error('[R1769] '+label+' anchor count '+n);
 return src.replace(from,()=>to);
};
const serverPath='dist/api/server.js';
let server=fs.readFileSync(serverPath,'utf8');
if(server.includes(marker))throw Error('[R1769] server Latin alias injected twice');
server=once(server,"import {createGalleryMessaging} from './gallery-messaging.js';",
 "import {updateLabPhotographerFolderAlias} from './lab-photographer-folder-alias.js';\nimport {createGalleryMessaging} from './gallery-messaging.js';",'server import');
const join=String.raw`(SELECT NULLIF(BTRIM(ps.value->>'folderLatinName'),'')
 FROM platform_settings ps WHERE ps.key='lab_photographer_folder_alias:'||m.lab_id::text||':'||u.id::text LIMIT 1)`;
const folderQuery=join.replace(/\s*\n\s*/g,' ');
server=once(server,') temporary_name_editable,u.email,u.mobile',
 ') temporary_name_editable,'+folderQuery+' folder_latin_name,u.email,u.mobile','lab customer list Latin alias');
const patchFrom="return sendJson(res,200,{ok:true,name:renamed.name});\n            }\n            const hasActive";
const patchTo=[
 "return sendJson(res,200,{ok:true,name:renamed.name});",
 "            }",
 "            if (Object.prototype.hasOwnProperty.call(b,'folderLatinName')) {",
 "                if (Object.keys(b).length!==1) return sendJson(res,400,{error:'invalid_folder_alias_request'});",
 "                const alias = await updateLabPhotographerFolderAlias({pool,labId,userId:cm[1],alias:b.folderLatinName});",
 "                if (!alias.ok) return sendJson(res,alias.status,{error:alias.error});",
 "                await audit(a.userId,labId,'customer.folder_latin_name_edit','user',cm[1],{folderLatinName:alias.name}).catch(()=>{});",
 "                return sendJson(res,200,{ok:true,folderLatinName:alias.name});",
 "            }",
 "            const hasActive"
].join('\n');
server=once(server,patchFrom,patchTo,'lab customer edit endpoint');
const responseAlias="u.name storage_customer_name,(SELECT NULLIF(BTRIM(ps.value->>'folderLatinName'),'') FROM platform_settings ps WHERE ps.key='lab_photographer_folder_alias:'||o.lab_id::text||':'||o.customer_id::text LIMIT 1) folder_latin_name,";
const responseAnchor="customer_name,u.email customer_email,COALESCE(o.walkin_customer_mobile,u.mobile) customer_mobile";
const matches=server.split(responseAnchor).length-1;
if(matches!==2)throw Error('[R1769] lab order list + detail alias anchors count '+matches);
server=server.split(responseAnchor).join('customer_name,'+responseAlias+'u.email customer_email,COALESCE(o.walkin_customer_mobile,u.mobile) customer_mobile');
server+='\n'+marker+'\n';
fs.writeFileSync(serverPath,server);
execFileSync(process.execPath,['--check',serverPath],{stdio:'inherit'});
function PB1769LatinFolderEdit({customer,onSaved}){
 const alias=String(customer.folder_latin_name||'');
 return e.jsx('button',{type:'button',className:'pbR1769LatinFolderEdit',
  title:alias?'نام لاتین پوشه: '+alias:'تعیین نام لاتین پوشه‌های عکاسی',
  'aria-label':'ویرایش نام لاتین پوشه برای '+(customer.name||'عکاس'),
  onClick:async()=>{
   const answer=prompt('نام لاتین پوشه‌های این عکاسی را وارد کنید (برای تبدیل خودکار خالی بگذارید):',alias);
   if(answer===null)return;
   const value=String(answer).trim().replace(/\s+/g,' ');
   if(value&&(value.length>64||!(/^[A-Za-z0-9][A-Za-z0-9 ._-]*[A-Za-z0-9]$/.test(value)||/^[A-Za-z0-9]$/.test(value))||
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value))){
    alert('نام لاتین باید فقط از حروف انگلیسی، اعداد، فاصله، خط تیره و زیرخط تشکیل شود و حداکثر ۶۴ کاراکتر باشد.');return;
   }
   try{
    await Me('/api/lab/customers/'+customer.id,{method:'PATCH',body:JSON.stringify({folderLatinName:value})});
    await onSaved();
   }catch(error){
    alert(error?.data?.error==='invalid_folder_latin_name'?'نام لاتین پوشه معتبر نیست.':'ذخیره نام لاتین پوشه انجام نشد.');
   }
  },children:alias?'LAT: '+alias:'LAT ✎'});
}
const css='.pbR1769LatinFolderEdit{border:1px solid #c9d6ea;background:#f8faff;color:#3155a5;padding:3px 8px;border-radius:8px;font-weight:800;font-size:11px;min-height:28px;max-width:165px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;direction:ltr}.pbR1769LatinFolderEdit:hover{background:#eef3ff;border-color:#829de1}.pbR1769LatinFolderEdit:focus-visible{outline:2px solid #315efb;outline-offset:2px}';
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
let patched=0;
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const bundle=root+'/assets/index-UIRefine-v655-r84.js',page=root+'/index.html';
 if(!fs.existsSync(bundle)||!fs.existsSync(page)){if(root==='dist/web')throw Error('[R1769] missing web UI');continue}
 let ui=fs.readFileSync(bundle,'utf8');
 if(ui.includes('function PB1769LatinFolderEdit('))throw Error('[R1769] UI alias editor patched twice');
 const tableStart=ui.indexOf('function PB1585PhotographersTable(');
 const tableEnd=tableStart<0?-1:ui.indexOf('\n}',tableStart);
 if(tableStart<0||tableEnd<0||tableEnd-tableStart>22000)throw Error('[R1769] active lab photographers table missing: '+root);
 const table=ui.slice(tableStart,tableEnd+2);
 const patchedTable=once(table,'e.jsx(PB1755TemporaryNameEdit,{customer,onSaved})',
  'e.jsx(PB1755TemporaryNameEdit,{customer,onSaved}),e.jsx(PB1769LatinFolderEdit,{customer,onSaved})',
  root+' photographer row');
 ui=ui.slice(0,tableStart)+patchedTable+ui.slice(tableEnd+2)+'\n'+PB1769LatinFolderEdit.toString()+'\n';
 fs.writeFileSync(bundle,ui);
 execFileSync(process.execPath,['--check',bundle],{stdio:'inherit'});
 let html=fs.readFileSync(page,'utf8');
 if(!html.includes('pbR1769LatinFolderStyle'))
  html=once(html,'</head>','<style id="pbR1769LatinFolderStyle">'+css+'</style></head>',root+' LAT style');
 const source=/assets\/index-UIRefine-v655-r84\.js\?[^"'<>\s]*/g;
 if([...html.matchAll(source)].length!==1)throw Error('[R1769] UI bundle query missing: '+root);
 html=html.replace(source,url=>url.replace(/&latinFolder=r\d+/g,'')+'&latinFolder=r1769');
 fs.writeFileSync(page,html);
 const manifest=root+'/manifest.json';
 if(fs.existsSync(manifest)){
  const data=JSON.parse(fs.readFileSync(manifest,'utf8'));
  for(const file of ['index.html','assets/index-UIRefine-v655-r84.js']){
   const entry=data.files?.find(x=>x.name===file);
   if(!entry)throw Error('[R1769] manifest missing '+file);
   entry.sha256=sha(fs.readFileSync(root+'/'+file));
  }
  data.build=sha(Buffer.from(JSON.stringify(data.files)));
  data.generatedAt=new Date().toISOString();
  fs.writeFileSync(manifest,JSON.stringify(data));
 }
 patched++;
}
console.log('[R1769] per-lab Latin alias editor on '+patched+' photographer lists; shared identity unchanged');
