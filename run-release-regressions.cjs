'use strict';
const {spawnSync}=require('node:child_process');
require('./verify-release-lock.cjs').verifySource();
const files=['release-critical.test.cjs','release-lock.test.cjs','approved-thermal-layout.test.cjs','model-dialog-patch.test.cjs','updater.test.cjs','unified-updates.test.cjs','update-install-gate.test.cjs','fast-startup-159.test.cjs'].map(file=>'test/'+file);
const run=spawnSync(process.execPath,['--test',...files],{cwd:__dirname,stdio:'inherit'});
if(run.error)throw run.error;if(run.status!==0)throw Error('mandatory_release_regressions_failed');
console.log('RELEASE_REGRESSIONS_PASS');
