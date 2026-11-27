'use strict';
const crypto=require('node:crypto');
const PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEATmNJNKt+oRyzuOKej2bXlUO0DLphWcVVSPaqyfWeBgY=\n-----END PUBLIC KEY-----\n";
function payload(m){return JSON.stringify({protocol:1,channel:'store',version:m.version,size:m.size,sha256:m.sha256})}
function valid(m,key=PUBLIC_KEY){try{return m?.protocol===1&&m.channel==='store'&&/^\d{1,5}\.\d{1,5}\.\d{1,5}$/.test(m.version)&&Number.isSafeInteger(m.size)&&m.size>0&&m.size<=2*1024**3&&/^[a-f0-9]{64}$/.test(m.sha256)&&typeof m.signature==='string'&&m.signature.length<=256&&crypto.verify(null,Buffer.from(payload(m)),key,Buffer.from(m.signature,'base64'))}catch{return false}}
function newer(a,b){if(!/^\d+\.\d+\.\d+$/.test(a)||!/^\d+\.\d+\.\d+$/.test(b))return false;const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i];return false}
module.exports={PUBLIC_KEY,payload,valid,newer};
