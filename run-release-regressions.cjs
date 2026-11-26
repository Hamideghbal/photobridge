'use strict';
const {spawnSync}=require('node:child_process'),path=require('node:path');
require('./verify-release-lock.cjs').verifySource();
const files=['release-critical.test.cjs','release-lock.test.cjs','approved-thermal-layout.test.cjs','model-dialog-patch.test.cjs','updater.test.cjs','unified-updates.test.cjs','update-install-gate.test.cjs','fast-startup-159.test.cjs','fast-views-159.test.cjs','dashboard-160.test.cjs','finance-161.test.cjs','finance-162.test.cjs'].map(file=>'test/'+file);
const databaseFiles=new Set(['test/update-install-gate.test.cjs','test/fast-views-159.test.cjs']);
const sqliteNode=process.env.PB_LAB_SQLITE_TEST_NODE||process.execPath;
function checked(exe,args){
 const run=spawnSync(exe,args,{cwd:__dirname,stdio:'inherit'});
 if(run.error)throw run.error;if(run.status!==0)throw Error('mandatory_release_regressions_failed');
}
if(sqliteNode!==process.execPath){
 // Do not rebuild or replace the native binding used by the installer.
 // Prove that the installed binding can actually open a database first.
 if(!path.isAbsolute(sqliteNode))throw Error('sqlite_test_node_must_be_absolute');
 checked(sqliteNode,['-e',"if(process.versions.modules!=='93')throw Error('expected_sqlite_abi_93');const {LabStore}=require('./store.cjs');const s=new LabStore(':memory:');try{s.set('labId','probe');if(s.get('labId')!=='probe')throw Error('sqlite_probe_failed');console.log('SQLITE_NATIVE_ABI_PASS '+process.versions.modules)}finally{s.db.close()}"]);
 checked(process.execPath,['--test',...files.filter(file=>!databaseFiles.has(file))]);
 checked(sqliteNode,['--require',path.join(__dirname,'test','native-regression-preload.cjs'),'--test',...files.filter(file=>databaseFiles.has(file))]);
}else{
 // Standard Node 22 developer/CI runs need a compatible installed SQLite binding.
 checked(process.execPath,['--test',...files]);
}
console.log('RELEASE_REGRESSIONS_PASS');
