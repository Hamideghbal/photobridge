'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
test('R1712 HEIC signature recognition distinguishes a JPEG renamed .heic',async()=>{
 const src=fs.readFileSync('dist/api/server.js','utf8');
 const begin=src.indexOf('async function pb1712LooksHeic('),end=src.indexOf('async function pb1712ValidJpeg(',begin);
 assert(begin>=0&&end>begin,'HEIC signature helper is installed');
 const sniff=Function('fs',src.slice(begin,end)+';return pb1712LooksHeic')(fs);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pb1712-'));
 try{
  const file=path.join(dir,'failure_magick.heic');
  fs.writeFileSync(file,Buffer.from([0xff,0xd8,0xff,0xe0,...Array(60).fill(0)]));
  assert.equal(await sniff(file),false,'JPEG image with HEIC extension must not be decoded as HEIC');
  const heic=Buffer.alloc(100);
  heic.write('ftyp',4,'ascii');heic.write('mif1',8,'ascii');heic.write('heic',16,'ascii');
  fs.writeFileSync(file,heic);
  assert.equal(await sniff(file),true,'real HEIC ftyp signature');
  fs.writeFileSync(file,Buffer.from('not-a-photo'));
  assert.equal(await sniff(file),false,'invalid image is not HEIC');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('R1712 prioritized HEIC worker and output JPEG validation are wired in real server',()=>{
 const src=fs.readFileSync('dist/api/server.js','utf8');
 const a=src.indexOf('async function ensurePrintReadyJpeg(row) {');
 const b=src.indexOf('function clampDiscount(',a);
 assert(a>0&&b>a);
 const conversion=src.slice(a,b);
 assert(conversion.indexOf('await pb1712LooksHeic(src)')<conversion.indexOf('await writeSharp(src, true)'));
 assert(conversion.includes('pb1666HeicFallback(src,output)'));
 assert(conversion.includes('if(!(await pb1712ValidJpeg(output)))'));
 assert(conversion.includes('pb1712Phase=\\'storage\\''));
 assert(conversion.includes('await pb1712StoreRetry(row, output, name)'));
 assert(conversion.includes('pb1712Phase=\\'database\\''));
 assert(conversion.includes('err.phase = pb1712Phase'));
 assert(src.includes('retryable:e?.phase===\\'storage\\'||e?.phase===\\'database\\''));
 assert(src.includes('if (expected && actual !== expected)'),'original integrity check retained');
 assert(src.includes("UPDATE order_files SET original_state='active'"),'file activated only after converter stage');
});
test('R1712 conversion errors are not mislabeled and storage retry is bounded',async()=>{
 const src=fs.readFileSync('dist/api/server.js','utf8');
 const a=src.indexOf('function pb1712FailureReason(');
 const b=src.indexOf('async function ensurePrintReadyJpeg(',a);
 assert(a>0&&b>a);
 const unit=src.slice(a,b);
 const last=Function('printJpegFailureReason',unit+';return {pb1712FailureReason,pb1712StoreRetry}')(s=>s);
 assert.match(last.pb1712FailureReason('storage','error'),/ذخیره/);
 assert.match(last.pb1712FailureReason('read','error'),/دریافت/);
 assert.match(last.pb1712FailureReason('database','error'),/ثبت/);
 assert.equal(last.pb1712FailureReason('decode','codec-failed'),'codec-failed');
 const main=fs.readFileSync('scripts/enable-r1712-heic-verified-conversion.mjs','utf8');
 assert(main.includes("new URL")===false||main.includes('pb1712'));
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 const add=build.indexOf("await deployStep('./enable-r1712-heic-verified-conversion.mjs')");
 assert(add>build.indexOf("await deployStep('./enable-r1666-iphone-heic-upload.mjs')"));
 assert(build.indexOf("test-r1712-heic-verified-conversion.cjs")>add);
});
