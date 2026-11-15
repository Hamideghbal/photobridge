// Liara's qualified bucket-domain proxy validates the original virtual-host signature.
// Replace only the browser-facing hostname, preserving the original key and signed query.
export function browserStorageUrl(signedUrl, {publicUrl='',originEndpoint,bucket}={}) {
  if(!String(publicUrl||'').trim())return signedUrl;
  const invalid=()=>{throw new Error('storage_browser_host_invalid')};
  let target,source,origin;
  try{target=new URL(String(publicUrl).trim());source=new URL(signedUrl);origin=new URL(originEndpoint)}catch{invalid()}
  if(target.protocol!=='https:'||target.username||target.password||target.port||target.pathname!=='/'||target.search||target.hash)invalid();
  if(origin.protocol!=='https:'||origin.username||origin.password||origin.port||origin.pathname!=='/'||origin.search||origin.hash)invalid();
  if(source.protocol!=='https:'||source.username||source.password||source.port||source.hash||source.hostname!==String(bucket).trim()+'.'+origin.hostname||!source.searchParams.get('X-Amz-Signature'))invalid();
  source.hostname=target.hostname;
  return source.href;
}

export function browserStorageHostname(publicUrl='') {
  if(!String(publicUrl||'').trim())return null;
  try {const url=new URL(String(publicUrl).trim());return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&url.pathname==='/'&&!url.search&&!url.hash?url.hostname:null}catch{return null}
}
