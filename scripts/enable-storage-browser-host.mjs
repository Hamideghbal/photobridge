import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const file='dist/api/server.js';let api=fs.readFileSync(file,'utf8');
function once(source,old,value){if(source.split(old).length!==2)throw Error('Storage browser host source anchor changed');return source.replace(old,value)}
api="import {browserStorageUrl,browserStorageHostname} from './storage-browser-host.mjs';\n"+api;
api=once(api,"const S3_REGION = process.env.S3_REGION || 'default';","const S3_REGION = process.env.S3_REGION || 'default';\nconst S3_BROWSER_URL = String(process.env.S3_BROWSER_URL || '').trim();");
api=once(api,"const client = action === 'download' ? s3Download : s3;","const client = action === 'download' && !S3_BROWSER_URL ? s3Download : s3;");
api=once(api,'return await getSignedUrl(client, command, { expiresIn: 900 });','const signed = await getSignedUrl(client, command, { expiresIn: 900 });\n        return browserStorageUrl(signed, {publicUrl:S3_BROWSER_URL, originEndpoint:S3_ENDPOINT, bucket:S3_BUCKET});');
api=once(api,"storageMode: storageConfigured ? 'object' : LOCAL_UPLOAD_FALLBACK ? 'local' : 'none', payments:","storageMode: storageConfigured ? 'object' : LOCAL_UPLOAD_FALLBACK ? 'local' : 'none', storageBrowserHost: browserStorageHostname(S3_BROWSER_URL), payments:");
fs.copyFileSync('scripts/storage-browser-host.mjs','dist/api/storage-browser-host.mjs');fs.writeFileSync(file,api);execFileSync(process.execPath,['--check',file]);console.log('Browser storage hostname supported; internal storage operations remain on their configured endpoint.');
