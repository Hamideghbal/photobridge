'use strict';
const clocks=new WeakMap();
function beginRead(store,url){let clock=clocks.get(store);if(!clock){clock={sequence:0,committed:new Map()};clocks.set(store,clock);}return{lab:store.get('labId'),url,sequence:++clock.sequence};}
function commitRead(store,ticket,status,mime,body){if(store.get('labId')!==ticket.lab||!store.get('auth'))return false;const clock=clocks.get(store),key=ticket.lab+' '+ticket.url;if((clock?.committed.get(key)||0)>ticket.sequence)return false;store.cache(ticket.url,status,mime,body);clock.committed.set(key,ticket.sequence);return true;}
function confirmWrite(store,urls){for(const url of urls){const ticket=beginRead(store,url);clocks.get(store).committed.set(ticket.lab+' '+url,ticket.sequence);}}
module.exports={beginRead,commitRead,confirmWrite};
