'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {Script}=require('node:vm');

test('R1990: R1307 writer accepts the R1989 multi-line click proxy and retains blue/white state',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'photobridge-r1990-'));
  try{
    const dir=path.join(tmp,'dist','web');
    fs.mkdirSync(dir,{recursive:true});
    const src=fs.readFileSync('dist/web/photobridge-r1126-desktop-navigation.js','utf8');
    fs.writeFileSync(path.join(dir,'photobridge-r1126-desktop-navigation.js'),src);
    fs.writeFileSync(path.join(dir,'index.html'),'<script defer src="/photobridge-r1126-desktop-navigation.js?v=r1989"></script>');
    const writer=path.resolve('scripts/enable-r1307-desktop-print-controls.mjs');
    execFileSync(process.execPath,[writer],{cwd:tmp,timeout:20000});
    const result=fs.readFileSync(path.join(dir,'photobridge-r1126-desktop-navigation.js'),'utf8');
    const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
    assert.doesNotThrow(()=>new Script(result));
    assert.match(result,/function livePrintControl\(key\)/);
    assert.match(result,/const printKey=active==='print'\?printControlKey\(original\):null/);
    assert.match(result,/const target=printKey\?livePrintControl\(printKey\):original/);
    assert.match(result,/press\(copy\);target\.click\(\)/);
    if(src.includes('pb1989Active')){
      assert.match(result,/button\.dataset\.pb1989Active=String\(selected\)/);
      assert.match(result,/button\.classList\.toggle\('active',selected\)/);
      assert.match(result,/button\.setAttribute\('aria-pressed',String\(selected\)\)/);
    }
    assert.match(html,/printNav=r1307/);
    // The build supervisor can rerun after a restart; this must not append another proxy.
    execFileSync(process.execPath,[writer],{cwd:tmp,timeout:20000});
    assert.equal(fs.readFileSync(path.join(dir,'photobridge-r1126-desktop-navigation.js'),'utf8'),result);
    assert.equal(fs.readFileSync(path.join(dir,'index.html'),'utf8'),html);
  }finally{fs.rmSync(tmp,{recursive:true,force:true})}
});
