'use strict';
const {describeConflict}=require('./conflict-context.cjs');
const {DatabaseSync}=require('node:sqlite'),crypto=require('node:crypto');const now=()=>new Date().toISOString(),uid=()=>crypto.randomUUID();
class LabStore{
 constructor(file){this.db=new DatabaseSync(file);this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');this.db.exec(`CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);CREATE TABLE IF NOT EXISTS cache(lab TEXT NOT NULL,url TEXT NOT NULL,status INTEGER NOT NULL,mime TEXT NOT NULL,body TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(lab,url));CREATE TABLE IF NOT EXISTS outbox(seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,lab TEXT NOT NULL,method TEXT NOT NULL,url TEXT NOT NULL,body TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'pending',error TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);`);if(!this.get('deviceId'))this.set('deviceId',uid())}
 get(k){const r=this.db.prepare('SELECT value FROM settings WHERE key=?').get(k);return r?JSON.parse(r.value):null}set(k,v){this.db.prepare('INSERT OR REPLACE INTO settings VALUES(?,?)').run(k,JSON.stringify(v))}
 transaction(fn){this.db.exec('BEGIN IMMEDIATE');try{const out=fn();this.db.exec('COMMIT');return out}catch(e){this.db.exec('ROLLBACK');throw e}}
 cache(url,status,mime,body){const lab=this.get('labId');if(!lab)return;this.db.prepare('INSERT OR REPLACE INTO cache VALUES(?,?,?,?,?,?)').run(lab,url,status,mime,body,now());this.set('lastSync',now())}
 cached(url){const lab=this.get('labId');if(!lab)return null;return this.db.prepare('SELECT * FROM cache WHERE lab=? AND url=?').get(lab,url)||null}
 rows(){
  const lab=this.get('labId')||'';
  // Older desktop builds could queue the print-alert heartbeat while offline.
  // It is transient presence state, never an order or user edit, so retire any
  // legacy rows before they can block work or appear as a lab conflict.
  if(lab)this.db.prepare("UPDATE outbox SET state='discarded',error=NULL,updated_at=? WHERE lab=? AND method='POST' AND state IN ('pending','conflict') AND (url='/api/lab/print-alert/presence' OR url LIKE '/api/lab/print-alert/presence?%')").run(now(),lab);
  return this.db.prepare("SELECT * FROM outbox WHERE lab=? AND state IN ('pending','conflict') ORDER BY seq").all(lab).map(x=>({...x,body:JSON.parse(x.body),error:x.error?JSON.parse(x.error):null}))
 }
 enqueue(method,url,body){const lab=this.get('labId');if(!lab)throw Error('offline_setup_required');const id=uid(),payload=body&&typeof body==='object'&&!Array.isArray(body)?{...body}:body;this.db.prepare('INSERT INTO outbox(id,lab,method,url,body,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(id,lab,method,url,JSON.stringify(payload??{}),now(),now());return{id,queued:true,offline:true}}
 done(id){this.db.prepare("UPDATE outbox SET state='done',updated_at=? WHERE id=?").run(now(),id)}
 conflict(id,error){this.db.prepare("UPDATE outbox SET state='conflict',error=?,updated_at=? WHERE id=?").run(JSON.stringify(error||{}),now(),id)}
 retry(id){this.db.prepare("UPDATE outbox SET state='pending',error=NULL,updated_at=? WHERE id=?").run(now(),id)}
 discard(id){this.db.prepare("UPDATE outbox SET state='discarded',updated_at=? WHERE id=?").run(now(),id)}
 archiveConflict(id){const lab=this.get('labId');if(!lab)return false;const result=this.db.prepare("UPDATE outbox SET state='discarded',updated_at=? WHERE id=? AND lab=? AND state='conflict'").run(now(),id,lab);return result.changes===1;}
 status(){const rows=this.rows();return{labId:this.get('labId'),pending:rows.filter(x=>x.state==='pending').length,conflicts:rows.filter(x=>x.state==='conflict').map(x=>({id:x.id,method:x.method,url:x.url,error:x.error,createdAt:x.created_at,updatedAt:x.updated_at,context:describeConflict(x,this)})),lastSync:this.get('lastSync')}}
}
module.exports={LabStore};
