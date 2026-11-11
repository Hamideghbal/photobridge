const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{Worker}=require('node:worker_threads');
test('HEIC runtime pins the decoder that supports modern iPhone auxiliary images',()=>{
 const pkg=require('../package.json');
 assert.equal(pkg.overrides['heic-decode'],'2.1.0');
 assert.equal(pkg.overrides['libheif-js'],'1.23.5');
 assert.equal(require('heic-decode/package.json').version,pkg.overrides['heic-decode']);
 assert.equal(require('libheif-js/package.json').version,pkg.overrides['libheif-js']);
 assert.equal(typeof require('heic-convert'),'function');
});
test('actual iPhone HEIC regression converts to a full resolution JPEG in the production worker', {skip:!process.env.PB_HEIC_REGRESSION_FILE,timeout:180000},async()=>{
 const sharp=require('sharp'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'pb1776-heic-')),output=path.join(dir,'print.jpg');
 try{
  const input=process.env.PB_HEIC_REGRESSION_FILE,original=fs.readFileSync(input);
  const result=await new Promise((resolve,reject)=>{
   const worker=new Worker(path.resolve('dist/api/heic-worker.cjs'),{workerData:{input,output},resourceLimits:{maxOldGenerationSizeMb:512}});
   worker.once('message',resolve);worker.once('error',reject);worker.once('exit',code=>{if(code)reject(Error('worker exit '+code))});
  });
  assert.equal(result.ok,true,JSON.stringify(result));
  const meta=await sharp(output,{failOn:'error'}).metadata();
  assert.equal(meta.format,'jpeg');assert(meta.width>1000&&meta.height>1000);
  await sharp(output,{failOn:'error'}).stats();
  assert.deepEqual(fs.readFileSync(input),original,'original bytes stay intact');
  console.log('HEIC regression JPEG:',meta.width,'x',meta.height,fs.statSync(output).size,'bytes');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
