'use strict';
const crypto=require('node:crypto');
const PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEATmNJNKt+oRyzuOKej2bXlUO0DLphWcVVSPaqyfWeBgY=\n-----END PUBLIC KEY-----\n";
function payload(value){return JSON.stringify({protocol:1,version:value.version,size:value.size,sha256:value.sha256});}
function valid(value,key=PUBLIC_KEY){try{return value?.protocol===1&&/^\d{1,5}\.\d{1,5}\.\d{1,5}$/.test(value.version)&&Number.isSafeInteger(value.size)&&value.size>0&&value.size<=2*1024**3&&/^[a-f0-9]{64}$/.test(value.sha256)&&typeof value.signature==='string'&&value.signature.length<=256&&crypto.verify(null,Buffer.from(payload(value)),key,Buffer.from(value.signature,'base64'));}catch{return false}}
function newer(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i];return false;}
module.exports={PUBLIC_KEY,payload,valid,newer};
