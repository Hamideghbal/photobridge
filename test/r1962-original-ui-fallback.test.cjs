'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {select}=require('../select-original-ui.cjs');

const digest=value=>crypto.createHash('sha256').update(value).digest('hex');

test('authentic pre-paging 1.0.120 manifest triggers official compatible UI fallback, not corrupt-UI failure',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pb-r1962-original-'));
  try{
    const original=path.join(temp,'original');
    const output=path.join(temp,'selected');
    fs.mkdirSync(original,{recursive:true});
    const sources={
      'index.html':'<!doctype html><html><head></head><body></body></html>',
      'desktop-overlay.js':'/* Lab desktop overlay */',
      'assets/index-UIRefine-v655-r84.js':'/* R1961 original UI: native storage supported; paging absent */',
    };
    const files=Object.entries(sources).map(([name,body])=>({
      name,url:'/lab-desktop-ui/'+name,sha256:digest(Buffer.from(body)),
    }));
    const manifest={protocol:1,channel:'lab',files,build:digest(JSON.stringify(files))};
    for(const [name,body]of Object.entries(sources)){
      const dest=path.join(original,name);
      fs.mkdirSync(path.dirname(dest),{recursive:true});
      fs.writeFileSync(dest,body);
    }
    fs.writeFileSync(path.join(original,'.pb-lab-bundle-manifest.json'),JSON.stringify(manifest));
    assert.throws(()=>select(original,output),error=>
      error?.code==='incompatible_verified_ui'&&/order pagination=false/.test(error.message));
    assert.equal(fs.existsSync(output),false);
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
