'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{diskProof,sourceMarker,generalSections,createUiDiagnostics}=require('../ui-diagnostics.cjs');
const ui=path.join(__dirname,'../verified-ui');
test('UI proof reports only code hashes/build metadata and identifies all General sections without account data',async()=>{
 const reads=[],store={get:key=>{reads.push(key);return null;}};const report=await diskProof({roots:[ui],version:'test-version',store});
 assert.equal(report.version,'test-version');assert.equal(report.pid,process.pid);assert.deepEqual(report.roots[0].files['assets/index-UIRefine-v655-r84.js'].generalSections,['general','hours','sms','snappbox','site','desktop']);assert.match(report.roots[0].files['assets/index-UIRefine-v655-r84.js'].servedSha256,/^[a-f0-9]{64}$/);assert.deepEqual(reads,['uiBuild','uiKnownGoodBuild','uiAppliedAt']);assert(!JSON.stringify(report).includes(ui));
 assert.deepEqual(sourceMarker('x','v').generalSections,[]);assert.deepEqual(generalSections('unrelated'),[]);
});
test('UI trace deduplicates navigation snapshots and is bounded to thirty entries',async()=>{
 let index=0;const window={isDestroyed:()=>false,webContents:{getURL:()=> 'http://127.0.0.1:43761/lab/settings',executeJavaScript:async source=>source.includes('const cleanUrl')?{page:'/lab/settings',step:index}:{}}};const diagnostics=createUiDiagnostics({getWindow:()=>window,getRoots:()=>[],store:{get:()=>null},version:'test',origin:'http://127.0.0.1:43761'});
 await diagnostics.capture();await diagnostics.capture();assert.equal((await diagnostics.collect()).timeline.length,1);
 for(index=1;index<40;index++)await diagnostics.capture();assert.equal((await diagnostics.collect()).timeline.length,30);
});
