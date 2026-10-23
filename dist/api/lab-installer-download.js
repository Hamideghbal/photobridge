import {pipeline} from 'node:stream/promises';
export async function serveLabInstaller(req,res,url,release,{stat,getObject,sendJson}){
 const status=url.pathname.endsWith('/status');let meta;
 try{meta=await stat(release.objectKey);if(!(Number(meta?.ContentLength)>0))throw Error('empty');}catch{return sendJson(res,status?200:503,status?{available:false,source:'admin-upload',error:'desktop_release_unavailable'}:{error:'desktop_release_unavailable'});}
 if(status)return sendJson(res,200,{available:true,version:release.version,size:Number(meta.ContentLength),source:'admin-upload',sha256:null});
 const size=Number(meta.ContentLength),range=String(req.headers.range||'').trim();let bounds;
 if(range){const m=range.match(/^bytes=(\d+)-(\d*)$/);if(!m||Number(m[1])>=size||(m[2]&&Number(m[2])<Number(m[1]))){res.writeHead(416,{'content-range':`bytes */${size}`});return res.end()}bounds=`bytes=${m[1]}-${Math.min(size-1,m[2]?Number(m[2]):size-1)}`;}
 const headers={'content-type':/\.zip$/i.test(release.name)?'application/zip':'application/octet-stream','content-disposition':`attachment; filename*=UTF-8''${encodeURIComponent(release.name)}`,'cache-control':'private, no-store','x-content-type-options':'nosniff','accept-ranges':'bytes'};
 if(req.method==='HEAD'){res.writeHead(200,{...headers,'content-length':String(size)});return res.end()}
 let object;try{object=await getObject(release.objectKey,bounds);if(!object?.Body||typeof object.Body.pipe!=='function')throw Error('missing_body');}catch{return sendJson(res,503,{error:'desktop_release_unavailable'})}
 if(object.ContentRange)headers['content-range']=object.ContentRange;
 if(Number.isFinite(Number(object.ContentLength)))headers['content-length']=String(object.ContentLength);
 res.writeHead(object.ContentRange?206:200,headers);
 try{await pipeline(object.Body,res)}catch{res.destroy?.()}
}
