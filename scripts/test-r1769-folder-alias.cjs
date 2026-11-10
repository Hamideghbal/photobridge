'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const server=fs.readFileSync('dist/api/server.js','utf8');
const modulePath='../dist/api/lab-photographer-folder-alias.js';
test('R1769: Latin names accept safe user-provided Windows folder labels',async()=>{
 const {normalizeLabPhotographerFolderAlias:clean}=await import(modulePath);
 for(const value of ['My Studio','Mahan_2026','A','Studio-17','Atelier 2026','Atelier.Test'])
  assert.equal(clean(value),value);
 for(const invalid of ['آرمان','ABC/XYZ','Hi\\There','CON','lpt2','A|B','a:b','..','ab.','a ','a?b','a'.repeat(65),3])
  if(invalid==='a ')assert.equal(clean(invalid),'a');else assert.equal(clean(invalid),null,JSON.stringify(invalid));
 assert.equal(clean(''),'');
 assert.equal(clean('    '),'');
});
test('R1769: a lab cannot create or edit an alias without its own customer membership',async()=>{
 const {updateLabPhotographerFolderAlias:save}=await import(modulePath);
 const calls=[],pool={query:async(sql,args)=>{calls.push({sql,args});return {rowCount:sql.includes('FROM lab_memberships')?0:1}}};
 const out=await save({pool,labId:'lab-A',userId:'photographer-A',alias:'Own Name'});
 assert.deepEqual(out,{ok:false,error:'customer_not_found',status:404});
 assert.equal(calls.length,1);assert.match(calls[0].sql,/lab_id=\$1 AND user_id=\$2 AND role='customer'/);
 assert.deepEqual(calls[0].args,['lab-A','photographer-A']);
});
test('R1769: one per-lab per-photographer setting is saved; empty name deletes only its scoped key',async()=>{
 const {updateLabPhotographerFolderAlias:save,labPhotographerFolderAliasKey:key}=await import(modulePath);
 const calls=[],pool={query:async(sql,args)=>{calls.push({sql,args});return {rowCount:1}}};
 const a=await save({pool,labId:'lab-A',userId:'p1',alias:'Shadi Studio'});
 assert.deepEqual(a,{ok:true,name:'Shadi Studio'});
 assert(calls[1].sql.includes('INSERT INTO platform_settings'));
 assert.equal(calls[1].args[0],key('lab-A','p1'));
 assert.deepEqual(JSON.parse(calls[1].args[1]),{folderLatinName:'Shadi Studio'});
 assert.notEqual(key('lab-A','p1'),key('lab-B','p1'));
 const b=await save({pool,labId:'lab-A',userId:'p1',alias:'  '});
 assert.deepEqual(b,{ok:true,name:''});
 assert.match(calls.at(-1).sql,/DELETE FROM platform_settings WHERE key=\$1/);
 assert.equal(calls.at(-1).args[0],key('lab-A','p1'));
});
test('R1769: Lab customer edit, order API and financial account identity are separately scoped',()=>{
 assert.match(server,/PB1769 LAB LATIN FOLDER ALIAS/);
 assert.match(server,/updateLabPhotographerFolderAlias\(\{pool,labId,userId:cm\[1\],alias:b.folderLatinName\}\)/);
 assert.match(server,/temporary_name_editable,\(SELECT NULLIF\(BTRIM\(ps.value->>'folderLatinName'\)/);
 assert.equal((server.match(/storage_customer_name/g)||[]).length,2);
 assert.equal((server.match(/folder_latin_name,u.email customer_email/g)||[]).length,2);
 assert.match(server,/PB_R1768_INVITED_STUDIO_DISPLAY/);
 const patch=fs.readFileSync('scripts/enable-r1769-folder-alias.mjs','utf8');
 assert(!/UPDATE users SET|UPDATE invoices SET|ALTER TABLE/.test(patch));
 const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 assert.match(ui,/function PB1769LatinFolderEdit\(/);
 assert.match(ui,/e.jsx\(PB1769LatinFolderEdit,\{customer,onSaved\}\)/);
});
