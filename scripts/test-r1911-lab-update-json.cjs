'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),
 crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {Readable}=require('node:stream');
const moduleLoad=()=>import('../dist/api/lab-desktop-update-manifest.js');
function testPair(){
 const bytes=Buffer.alloc(10_000_010,0x55),keys=crypto.generateKeyPairSync('ed25519'),
 version='1.0.105',hash=crypto.createHash('sha256').update(bytes).digest('hex');
 const pair={protocol:1,version,size:bytes.length,sha256:hash};
 pair.signature=crypto.sign(null,Buffer.from(JSON.stringify(pair)),keys.privateKey).toString('base64');
 const release={version,bytes:bytes.length,objectKey:'platform/lab-desktop/1.0.105/signed.exe'};
 return {bytes,keys,pair,release};
}
test('site accepts only original-key-signed JSON bound to the exact named EXE version and size',async()=>{
 const {validLabUpdatePair}=await moduleLoad();
 const {keys,pair,release}=testPair(),opts={publicKey:keys.publicKey};
 assert(validLabUpdatePair(pair,release,opts));
 for(const diff of [
   {...pair,version:'1.0.104'},{...pair,size:pair.size-1},{...pair,sha256:'a'.repeat(64)},
   {...pair,signature:Buffer.alloc(64).toString('base64')},{...pair,protocol:2},{...pair,signature:''}
 ])assert(!validLabUpdatePair(diff,release,opts),'forged or mismatched update must not be offered to installed clients');
 assert(!validLabUpdatePair(pair,{...release,objectKey:null},opts));
 assert(!validLabUpdatePair(pair,{...release,bytes:pair.size+1},opts));
 assert(!validLabUpdatePair(pair,{...release,version:'1.0.106'},opts));
 assert(!validLabUpdatePair(pair,release),'test private key cannot impersonate actual publisher key');
});
test('publisher-signed JSON is insufficient unless actual uploaded installer bytes match SHA256',async()=>{
 const {checkLabInstallerBytes}=await moduleLoad(),{bytes,pair}=testPair();
 const parts=[bytes.subarray(0,16384),bytes.subarray(16384)];
 assert(await checkLabInstallerBytes(Readable.from(parts),pair));
 await assert.rejects(checkLabInstallerBytes(Readable.from([bytes.subarray(0,-1)]),pair),/installer_checksum_mismatch/);
 await assert.rejects(checkLabInstallerBytes(Readable.from([Buffer.alloc(bytes.length,0)]),pair),/installer_checksum_mismatch/);
 await assert.rejects(checkLabInstallerBytes(Readable.from([Buffer.alloc(bytes.length+1)]),pair),/installer_size_mismatch/);
});
test('update route is authenticated, updater is opt-in, and existing photo download and installer routes remain untouched',()=>{
 const server=fs.readFileSync(path.join(__dirname,'../dist/api/server.js'),'utf8');
 assert(server.includes('/* R1911 SIGNED LAB WINDOWS UPDATE JSON */'));
 assert(server.includes("url.pathname === '/api/lab/desktop-installer/update'"));
 assert(server.includes("url.pathname === '/api/admin/lab-desktop-release/update-manifest'"));
 assert(server.includes("validLabUpdatePair(candidate,current)"));
 assert(server.includes("await checkLabInstallerBytes(object?.Body,candidate)"));
 assert(server.includes("SELECT 1 FROM labs l JOIN lab_memberships"));
 assert(server.includes("return sendJson(res,200,{update})"));
 assert(server.includes("|| url.pathname === '/api/lab/desktop-installer/status'"));
 assert(server.includes("url.pathname === '/api/admin/lab-desktop-release/upload'"));
 assert(server.includes("url.pathname === '/api/admin/lab-desktop-release/upload/complete'"));
 // A fresh installer upload must NOT inherit the previous version's signed JSON.
 assert(server.includes("updateManifest: validLabUpdatePair(x.updateManifest"));
});
