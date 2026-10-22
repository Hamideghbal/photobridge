'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const revisionPattern=/^\d{4}-\d{2}-\d{2}-r\d+-[a-z0-9-]+$/;
const tests=['test-r1337-gallery-retouch-refresh.cjs','test-r1338-retouch-upload-progress.cjs','test-r1340-retouch-correction-only.cjs'];
const root=path.resolve(__dirname,'..');

test('real deployment revision and future releases use a stable format',()=>{
 const actual=fs.readFileSync(path.join(root,'DEPLOY_REVISION.txt'),'utf8').trim();
 for(const value of [actual,'2026-10-21-r1340-correction-only','2026-10-22-r1349-liara-final-ui-esm-cache-rebuild','2026-10-22-r1350-fix-deploy-guard','2027-01-01-r1400-future-release'])assert.match(value,revisionPattern);
 for(const invalid of ['', '2026-10-21-r1340', '2026-10-21-r1345-', '2026-10-21-rX-other', '2026-10-21-r1340-BadCase'])assert.doesNotMatch(invalid,revisionPattern);
});

test('retouch regression tests preserve cache assertions but never pin old deployment revision numbers',()=>{
 for(const name of tests){
   const source=fs.readFileSync(path.join(__dirname,name),'utf8');
   assert(source.includes("assert.match(fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim()"),name+' keeps its deploy guard');
   assert(source.includes(revisionPattern.toString()),name+' accepts valid newer releases');
   assert(!source.includes('^2026-10-21-r(?:1340|1341|1342|1343|1344|1345)-'),name+' must not hardcode release identifiers');
   assert(source.includes('retouchReload=r(?:1340|1344)'),name+' still checks stable browser cache keys');
 }
});
