'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib');
test('final web/PWA backup stays in settings and active all state is explicit',()=>{
 const file='dist/web/assets/index-UIRefine-v655-r84.js',bytes=fs.readFileSync(file),s=bytes.toString(),html=fs.readFileSync('dist/web/index.html','utf8');
 assert(s.includes('src:"/lab-data-backup.html?embedded=1"'));assert(s.includes('/* PB162 inline backup */'));
 assert(s.includes('"data-pb162-invoice-all":true'));assert(s.includes('"aria-pressed":!_pbInvAppliedFrom&&!_pbInvAppliedTo'));
 assert(html.includes('inlineBackup=r2059'));assert(html.includes('id="pb2059InlineBackupStyle"'));
 for(const [ext,decode] of [['.br',zlib.brotliDecompressSync],['.gz',zlib.gunzipSync]])if(fs.existsSync(file+ext))assert(decode(fs.readFileSync(file+ext)).equals(bytes));
});
