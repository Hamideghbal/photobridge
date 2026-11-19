import crypto from 'node:crypto';
// Public Ed25519 key already embedded in installed PhotoBridge Lab executables.
// Never store, upload, rotate, or manufacture the ORIGINAL publisher PRIVATE key
// in site source; an old client must still verify signed update JSONs.
export const LAB_UPDATE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEATmNJNKt+oRyzuOKej2bXlUO0DLphWcVVSPaqyfWeBgY=\n-----END PUBLIC KEY-----\n";
export function validLabUpdatePair(update,release,{publicKey=LAB_UPDATE_PUBLIC_KEY}={}){
 if(!update||typeof update!=='object'||Array.isArray(update))return false;
 if(update.protocol!==1||!/^\d{1,5}\.\d{1,5}\.\d{1,5}$/.test(String(update.version||'')))return false;
 if(!Number.isSafeInteger(update.size)||update.size<10_000_000||update.size>2*1024**3)return false;
 if(!/^[a-f0-9]{64}$/.test(String(update.sha256||''))||
    typeof update.signature!=='string'||update.signature.length>256)return false;
 if(!release||update.version!==release.version||update.size!==Number(release.bytes||0)||!release.objectKey)return false;
 const payload=JSON.stringify({protocol:1,version:update.version,size:update.size,sha256:update.sha256});
 try{return crypto.verify(null,Buffer.from(payload),publicKey,Buffer.from(update.signature,'base64'))}catch{return false}
}
export async function checkLabInstallerBytes(stream,{size,sha256}){
 if(!stream||typeof stream[Symbol.asyncIterator]!=='function')throw Error('installer_stream_unavailable');
 const hash=crypto.createHash('sha256');let bytes=0;
 for await(const part of stream){
  const chunk=Buffer.from(part);bytes+=chunk.length;
  if(bytes>size)throw Error('installer_size_mismatch');
  hash.update(chunk);
 }
 if(bytes!==size||hash.digest('hex')!==sha256)throw Error('installer_checksum_mismatch');
 return true;
}
