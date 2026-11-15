'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),https=require('node:https'),{execFileSync}=require('node:child_process');
// A real local HTTPS 303 avoids Playwright's redirect-chain routing bypass.
// The temporary self-signed certificate belongs only to this loopback fixture.
exports.createHandoffServer=async function createHandoffServer(shopId,onHandoff){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pb-handoff-'));let tls;
 try{
  execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',path.join(dir,'key.pem'),'-out',path.join(dir,'cert.pem'),'-days','1','-subj','/CN=localhost'],{stdio:'ignore'});
  tls={key:fs.readFileSync(path.join(dir,'key.pem')),cert:fs.readFileSync(path.join(dir,'cert.pem'))};
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
 const failures=[],requests=[];let origin;
 const server=https.createServer(tls,async(req,res)=>{
  try{
   const url=new URL(req.url,origin);if(url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}requests.push({method:req.method,path:url.pathname});
   if(url.pathname==='/api/auth/equipment-site-handoff'){
    assert.equal(req.method,'POST');const chunks=[];for await(const chunk of req)chunks.push(chunk);
    onHandoff(new URLSearchParams(Buffer.concat(chunks).toString()),req);
    res.writeHead(303,{location:origin+'/equipment-rental/book?panel=rental&pbDirectShop='+shopId,'cache-control':'no-store'});res.end();return;
   }
   assert.equal(url.pathname,'/equipment-rental/book');assert.equal(req.method,'GET','303 must turn POST into GET');assert.equal(url.searchParams.get('pbDirectShop'),shopId);
   res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end('<!doctype html><html><head><meta charset="utf-8"></head><body><main id="officeReached">Office</main></body></html>');
  }catch(error){failures.push(error);res.writeHead(500);res.end('fixture assertion failed')}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='https://photobridge.ir';
 return {origin,chromiumArgs:['--no-proxy-server','--host-resolver-rules=MAP photobridge.ir 127.0.0.1:'+server.address().port],verify(){assert.deepEqual(failures,[]);assert.deepEqual(requests.slice(0,2),[{method:'POST',path:'/api/auth/equipment-site-handoff'},{method:'GET',path:'/equipment-rental/book'}])},async close(){server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}};
};
