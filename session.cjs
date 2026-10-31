'use strict';
async function logout(store,sync){await sync.pause();const pending=store.rows().filter(x=>x.state==='pending').length;store.set('cookie',null);store.set('auth',null);store.set('labId',null);store.set('cacheOwner',null);sync.online=false;return{pendingSaved:pending}}
module.exports={logout};
