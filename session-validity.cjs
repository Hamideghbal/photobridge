'use strict';
async function revokedResponse(response,url,{anonymous=false}={}){
 if(anonymous)return false;
 const pathname=new URL(url,'https://photobridge.ir').pathname;
 if(pathname!=='/api/auth/me'&&!pathname.startsWith('/api/lab/'))return false;
 if(response.status===401)return true;
 if(pathname==='/api/auth/me'&&response.ok){try{const data=await response.clone().json();return data===null;}catch{}}
 return false;
}
function expireSession(store,sync){
 if(!store.get('auth'))return false;
 // Do not await sync.pause(): the rejection may come from that very flight.
 if(sync){sync.paused=true;sync.online=false;sync.lastError='login_required';}
 store.transaction(()=>{store.set('cookie',null);store.set('auth',null);store.set('labId',null);store.set('cacheOwner',null);store.set('sessionExpired',true);});
 return true;
}
module.exports={revokedResponse,expireSession};
