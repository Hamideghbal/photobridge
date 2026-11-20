'use strict';const fs=require('node:fs');
for(const [file,needles] of [
 ['dist/web/assets/index-UIRefine-v655-r84.js',['async function Tt(','function Tt(','const Tt=','onClick:()=>Tt(','setInterval(refresh,3000)','pb1753VisibleLabOrders','data.orders||[]','ready_print','labOrderCard']],
 ['dist/api/server.js',["if (labOrder && req.method === 'PATCH')","if (labOrder && req.method === 'DELETE')","'/api/lab/orders'","'/api/lab/archive'","order_status_events","labOrders"]]
 ]){
 const s=fs.readFileSync(file,'utf8');console.log('SOURCE '+file+' '+s.length);
 for(const needle of needles){const matches=[];let i=-1;while((i=s.indexOf(needle,i+1))>=0){matches.push(i);if(matches.length>=4)break;}
 console.log('NEEDLE '+JSON.stringify(needle)+' matches '+matches.length);
 for(const i of matches)console.log('EXCERPT '+JSON.stringify(s.slice(Math.max(0,i-350),Math.min(s.length,i+1350))));
 }
}
