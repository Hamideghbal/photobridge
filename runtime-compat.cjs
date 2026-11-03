'use strict';
function install(){
 const web=require('undici'),streams=require('node:stream/web');
 if(!AbortSignal.any)AbortSignal.any=signals=>{const controller=new AbortController(),list=Array.from(signals),listeners=[];for(const signal of list)if(!(signal instanceof AbortSignal))throw TypeError('Expected AbortSignal');const clear=()=>{for(const[signal,listener]of listeners)signal.removeEventListener('abort',listener);};for(const signal of list){if(signal.aborted){controller.abort(signal.reason);clear();break;}const listener=()=>{controller.abort(signal.reason);clear();};listeners.push([signal,listener]);signal.addEventListener('abort',listener,{once:true});}return controller.signal;};
 if(!globalThis.structuredClone)globalThis.structuredClone=value=>{const v8=require('node:v8');return v8.deserialize(v8.serialize(value));};
 for(const key of ['fetch','Headers','Request','Response','FormData'])if(!globalThis[key])globalThis[key]=web[key];
 for(const key of ['ReadableStream','WritableStream','TransformStream'])if(!globalThis[key])globalThis[key]=streams[key];
 if(!globalThis.Blob)globalThis.Blob=require('node:buffer').Blob;
 if(!globalThis.File)globalThis.File=web.File;
 if(!Response.json)Response.json=(data,options={})=>{const headers=new Headers(options.headers);if(!headers.has('content-type'))headers.set('content-type','application/json');return new Response(JSON.stringify(data),{...options,headers});};
}
function electronFetch(net,url,options={}){
 return new Promise((resolve,reject)=>{
  if(options.signal?.aborted){reject(options.signal.reason||Error('request_aborted'));return;}
  const request=net.request({url,method:options.method||'GET',redirect:'manual',useSessionCookies:false});let settled=false,controller;
  const cleanup=()=>options.signal?.removeEventListener('abort',abort);
  const fail=error=>{cleanup();if(settled){try{controller?.error(error)}catch{}}else{settled=true;reject(error);}};
  const abort=()=>{request.abort();fail(options.signal.reason||Error('request_aborted'));};
  options.signal?.addEventListener('abort',abort,{once:true});
  try{
   for(const[k,v]of new Headers(options.headers))request.setHeader(k,v);
   request.on('redirect',()=>{request.abort();fail(Error('unexpected_redirect'));});
   request.on('error',fail);
   request.on('response',response=>{
    const headers=new Headers();for(const[k,values]of Object.entries(response.headers))for(const v of Array.isArray(values)?values:[values])headers.append(k,String(v));
    const body=new ReadableStream({start(c){controller=c;response.on('data',chunk=>c.enqueue(new Uint8Array(chunk)));response.on('end',()=>{cleanup();c.close();});response.on('error',fail);},cancel(){cleanup();request.abort();}});
    settled=true;resolve(new Response([101,204,205,304].includes(response.statusCode)||options.method==='HEAD'?null:body,{status:response.statusCode,headers}));
   });
   if(options.body!=null)request.write(options.body);request.end();
  }catch(error){request.abort();fail(error);}
 });
}
module.exports={install,electronFetch};
