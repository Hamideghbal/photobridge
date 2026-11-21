'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const zlib=require('node:zlib');
const crypto=require('node:crypto');

const asset='assets/index-UIRefine-v655-r84.js';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  test('R1897: '+root+' serves final stage code in raw, Brotli, gzip with new cache key',()=>{
    const ui=fs.readFileSync(root+'/'+asset);
    const html=fs.readFileSync(root+'/index.html','utf8');
    const mark='/* PB1894 invoice-first server stages */';
    assert(ui.includes(mark),'built JS includes R1896 server-only stage patch');
    for(const suffix of ['.br','.gz']){
      const file=root+'/'+asset+suffix;
      if(fs.existsSync(file)){
        const decoder=suffix==='.br'?zlib.brotliDecompressSync:zlib.gunzipSync;
        const decoded=decoder(fs.readFileSync(file));
        assert(decoded.equals(ui),suffix+' must never serve stale stage logic');
      }
    }
    const urls=[...html.matchAll(/index-UIRefine-v655-r84\.js\?[^"'\s>]*/g)];
    assert.equal(urls.length,1);
    assert.match(urls[0][0],/[&]labStage=r1952$/);
    assert.doesNotMatch(urls[0][0],/labStage=r1894|labStage=r1897|labStage=r1936|labStage=r1943|labStage=r1944|labStage=r1945|labStage=r1946/);
    for(const suffix of ['.br','.gz']){
      const file=root+'/index.html'+suffix;
      if(fs.existsSync(file)){
        const decoder=suffix==='.br'?zlib.brotliDecompressSync:zlib.gunzipSync;
        assert.equal(decoder(fs.readFileSync(file)).toString('utf8'),html);
      }
    }
    const ready=ui.toString('utf8').split('un=async le=>')[1]?.split(',Cn=async')[0];
    const done=ui.toString('utf8').split('gn=async le=>')[1]?.split(',Vn=async')[0];
    assert.match(ready||'',/const pb1894ReadyResult=await It\(le,"ready"\)/);
    assert.doesNotMatch(ready||'',/if\(!await pb1450AllowStage\(le\)\)/);
    assert.doesNotMatch(done||'',/if\(!await pb1450AllowStage\(le\)\)/);
    const physical=ui.toString('utf8').split('It=async(le,nt,xt)=>')[1]?.split(',gn=async')[0];
    assert.match(physical||'',/nt==="printing"&&/,'actual physical printing guard is preserved');
    if(root.endsWith('/lab-desktop-ui')){
      const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
      for(const name of [asset,'index.html']){
        assert.equal(manifest.files.find(x=>x.name===name)?.sha256,hash(fs.readFileSync(root+'/'+name)));
      }
    }
  });
}
