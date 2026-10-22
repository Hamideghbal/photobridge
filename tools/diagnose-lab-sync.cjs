'use strict';
// Read-only diagnostic for a blocked laboratory sync queue.
// Deliberately never selects request bodies, session cookies or personal data.
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync}=require('node:sqlite');
function locate(explicit){
 if(explicit){if(!fs.existsSync(explicit))throw Error('Database not found: '+explicit);return path.resolve(explicit);}
 const appData=process.env.APPDATA;
 if(!appData||!fs.existsSync(appData))throw Error('Run from Windows or pass the full path to lab.sqlite.');
 const matches=fs.readdirSync(appData,{withFileTypes:true}).filter(e=>e.isDirectory()&&/photo.?bridge|lab.?desktop/i.test(e.name))
   .map(e=>path.join(appData,e.name,'lab.sqlite')).filter(p=>fs.existsSync(p));
 if(matches.length!==1)throw Error('Found '+matches.length+' candidate lab databases. Supply the full lab.sqlite path explicitly: '+matches.join(', '));
 return matches[0];
}
function mask(url){
 return String(url||'').split('?')[0].replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,':id').replace(/\b\d{4,}\b/g,':number').slice(0,180);
}
function summarize(file){
 const db=new DatabaseSync(file,{readOnly:true});
 try{
  const rows=db.prepare("SELECT method,url,state,error,created_at FROM outbox WHERE state IN ('pending','conflict') ORDER BY seq").all();
  const byRoute=new Map();
  for(const row of rows){const key=row.state+' '+row.method+' '+mask(row.url);byRoute.set(key,(byRoute.get(key)||0)+1)}
  const byStatus={};for(const row of rows)byStatus[row.state]=(byStatus[row.state]||0)+1;
  const state={};
  for(const key of ['nativeVersion','uiBuild','uiLastCheckedAt','uiDownloadedAt','uiAppliedAt','updateError','lastSyncReport']){
   const raw=db.prepare('SELECT value FROM settings WHERE key=?').get(key)?.value;
   try{state[key]=raw==null?null:JSON.parse(raw)}catch{state[key]=null}
  }
  if(state.lastSyncReport){const v=state.lastSyncReport;state.lastSyncReport={error:v.error||null,sent:v.sent||0,pending:v.pending||0,conflicts:v.conflicts||0,startedAt:v.startedAt||null,finishedAt:v.finishedAt||null};}
  const first=rows.slice(0,5).map(r=>{
   let errorCode=null;try{let e=JSON.parse(r.error||'null');errorCode=String(e?.error||e?.code||'').slice(0,80)||null;}catch{}
   return {method:r.method,route:mask(r.url),state:r.state,createdAt:r.created_at,errorCode};
  });
  return {database:path.basename(path.dirname(file))+'/lab.sqlite',outboxCount:rows.length,byStatus,byRoute:[...byRoute].sort((a,b)=>b[1]-a[1]).slice(0,15).map(([route,count])=>({route,count})),first,update:state};
 }finally{db.close();}
}
if(require.main===module){
 try{const output=summarize(locate(process.argv[2]));console.log(JSON.stringify(output,null,2));console.log('\nREAD ONLY: no changes were made. Share the report, not the SQLite file.');}
 catch(e){console.error('Cannot inspect laboratory sync queue: '+e.message);process.exitCode=1;}
}
module.exports={locate,summarize,mask};
