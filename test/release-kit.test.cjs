'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {prepare}=require('../prepare-next-version.cjs');
const {inspect,verifySignedRelease}=require('../release-kit.cjs');
const {PUBLIC_KEY}=require('../update-trust.cjs');
test('full source includes native downloader, alerts, updater, signed manifest tooling and exact pinned UI',()=>{
 const info=inspect(path.join(__dirname,'..'));
 assert.equal(info.version,require('../package.json').version);
 assert.equal(info.uiFiles>100,true,'no partial native UI snapshot');
 assert.match(info.uiBuild,/^[a-f0-9]{64}$/);
});
test('next version is strictly increasing and never silently reuses 1.0.104',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-release-version-'));
 try{
  fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({version:'1.0.104'}));
  fs.writeFileSync(path.join(root,'package-lock.json'),JSON.stringify({version:'1.0.104',packages:{'':{version:'1.0.104'}}}));
  assert.throws(()=>prepare('1.0.104',{root}),/release_version_must_increase/);
  assert.throws(()=>prepare('1.0.99',{root}),/release_version_must_increase/);
  assert.equal(prepare('1.0.105',{root}),'1.0.105');
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'))).packages[''].version,'1.0.105');
  assert.throws(()=>prepare('1.0.105',{root}),/release_version_must_increase/);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('a missing or forged unsigned updater JSON must NOT count as signed production update',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-release-json-'));
 try{
  fs.mkdirSync(path.join(root,'release'));
  fs.writeFileSync(path.join(root,'release','PhotoBridge-Lab-Setup-1.0.105-x64.exe'),Buffer.alloc(16,1));
  assert.throws(()=>verifySignedRelease(root,'1.0.105'),/signed_update_json_missing/);
  fs.writeFileSync(path.join(root,'release','PhotoBridge-Lab-Update-1.0.105.json'),JSON.stringify({protocol:1,version:'1.0.105',size:16,sha256:crypto.createHash('sha256').update(Buffer.alloc(16,1)).digest('hex'),signature:Buffer.alloc(64).toString('base64')}));
  assert.throws(()=>verifySignedRelease(root,'1.0.105'),/signed_update_manifest_invalid/);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('source snapshots never include private keys, compiled artifacts or session data via git listing',()=>{
 const {listTracked}=require('../release-kit.cjs');
 const tracked=listTracked(path.join(__dirname,'..'));
 assert(tracked.includes('main.cjs')&&tracked.includes('alert-renderer.js')&&tracked.includes('release-kit.cjs'));
 assert(!tracked.some(name=>name.startsWith('node_modules/')||name.startsWith('release/')||name.startsWith('.publisher/')||name.endsWith('.pem')||name.endsWith('.pfx')));
 assert.match(PUBLIC_KEY,/BEGIN PUBLIC KEY/);
});
