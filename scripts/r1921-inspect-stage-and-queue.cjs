'use strict';const fs=require('node:fs');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),server=fs.readFileSync('dist/api/server.js','utf8');
function snippet(label,s,token,before=1500,after=5200){const i=s.lastIndexOf(token);console.log('=== '+label+' pos='+i+' ===');console.log(JSON.stringify(i<0?'MISSING':s.slice(Math.max(0,i-before),i+after)));}
snippet('stage PATCH with local successor',ui,'It=async(le,nt,xt)=>',900,5200);
snippet('queue render pagination context',ui,'queuePageTurn ${Xe.direction}',3700,3600);
snippet('queue API use',ui,'Me("/api/lab/orders"',1400,3000);
snippet('server PATCH stage transaction',server,"if (labOrder && req.method === 'PATCH')",300,4500);
snippet('server order GET list',server,"if (req.method === 'GET' && url.pathname === '/api/lab/orders')",0,5500);
