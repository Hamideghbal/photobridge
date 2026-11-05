'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const builder=fs.readFileSync(path.join(__dirname,'liara-fast-build.mjs'),'utf8');

test('R1596: emergency rollback leaves experimental Lab flight out of Liara build',()=>{
  assert.doesNotMatch(builder,/await deployStep\(['"]\.\/enable-r1593-lab-card-flight\.mjs['"]\)/);
  assert.doesNotMatch(builder,/runR1314\([^;]+test-r1594-lab-card-flight\.cjs/);
  assert.match(builder,/Experimental Lab card-flight overlay\/JS stage patches disabled/);
});

test('R1596: active browser and Windows bundles do not contain experimental Lab flight patches',()=>{
  for(const dir of ['dist/web','dist/web/lab-desktop-ui']){
    const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
    const ui=fs.readFileSync(path.join(dir,'assets/index-UIRefine-v655-r84.js'),'utf8');
    assert.doesNotMatch(html,/photobridge-r1593-lab-card-flight\.js/,'R1593 script should not load in '+dir);
    assert.doesNotMatch(ui,/PB1593 confirmed lab stage flights/,'R1593 bundle patch should be excluded in '+dir);
  }
});
