import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const image=process.argv[2];
assert(image,'Usage: node scripts/test-docker-production-image.mjs <built-image>');
// Override the production entrypoint and disable networking: no migrations or
// production services are started while validating the shipped image.
const probe=`
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const files={};
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(entry.isFile()){let bytes=fs.readFileSync(file);if(/^dist\\/web\\/(desktop-ui|lab-desktop-ui)\\/manifest.json$/.test(file)){const manifest=JSON.parse(bytes);delete manifest.generatedAt;bytes=Buffer.from(JSON.stringify(manifest));}files[file]=crypto.createHash('sha256').update(bytes).digest('hex');}}}
for(const dir of ['dist','migrations','apps/web/public'])walk(dir);
for(const file of ['package.json','DEPLOY_REVISION.txt','scripts/migrate.mjs','scripts/ensure-sofia-demo.sql'])files[file]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for(const unwanted of ['.git','.env','.npmrc','package-lock.json','AGENTS.md','apps/store-desktop','apps/lab-desktop','scripts/liara-fast-build.mjs'])if(fs.existsSync(unwanted))throw Error('Unexpected image payload: '+unwanted);
const ort=await import('onnxruntime-node');if(typeof ort.InferenceSession.create!=='function')throw Error('ONNX CPU binding unavailable');
const sharp=(await import('sharp')).default;await sharp({create:{width:1,height:1,channels:4,background:'#fff'}}).png().toBuffer();
for(const name of ['pg','web-push','@aws-sdk/client-s3','@aws-sdk/s3-request-presigner'])await import(name);
if(typeof (await import('jsqr')).default!=='function')throw Error('QR scanner unavailable');
console.log(JSON.stringify(files));`;
const actual=JSON.parse(execFileSync('docker',['run','--rm','--network','none','--entrypoint','node',image,'--input-type=module','-e',probe],{encoding:'utf8',maxBuffer:8*1024*1024}));
const expected={};
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(entry.isFile()){let bytes=fs.readFileSync(file);if(/^dist\/web\/(desktop-ui|lab-desktop-ui)\/manifest.json$/.test(file)){const manifest=JSON.parse(bytes);delete manifest.generatedAt;bytes=Buffer.from(JSON.stringify(manifest));}expected[file]=crypto.createHash('sha256').update(bytes).digest('hex');}}}
for(const dir of ['dist','migrations','apps/web/public'])walk(dir);
for(const file of ['package.json','DEPLOY_REVISION.txt','scripts/migrate.mjs','scripts/ensure-sofia-demo.sql'])expected[file]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
assert.deepEqual(actual,expected,'Docker must ship exactly the verified production assets and runtime files');
const config=JSON.parse(execFileSync('docker',['image','inspect',image,'--format','{{json .Config}}'],{encoding:'utf8'}));
assert.deepEqual(config.Cmd,['sh','-c','node scripts/migrate.mjs && exec node --expose-gc dist/api/server.js']);
assert.equal(config.WorkingDir,'/app');assert(config.Env.includes('PORT=3000'));assert(config.Env.includes('NODE_ENV=production'));assert.equal(config.StopSignal,'SIGTERM');
console.log(`Docker payload: ${Object.keys(expected).length} matching files; ONNX, Sharp, jsQR and backend dependencies work; startup configuration preserved; no migrations executed.`);
