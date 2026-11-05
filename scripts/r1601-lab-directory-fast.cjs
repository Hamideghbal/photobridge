'use strict';
const MARK='/* PB1601 parallel photographer lab directory queries */';
function patchLabDirectory(server){
 if(server.includes(MARK))return server;
 const head="if (req.method === 'GET' && url.pathname === '/api/customer/labs') {";
 const tail='const customerLabRequest = url.pathname.match(';
 const start=server.indexOf(head),end=server.indexOf(tail,start);
 if(start<0||end<=start||end-start>13000)throw Error('R1601 customer labs route not found');
 let section=server.slice(start,end);
 const once=(a,b,label)=>{
  if(section.split(a).length!==2)throw Error('R1601 labs '+label+' changed');
  section=section.replace(a,b);
 };
 once('const canDiscoverLabs = await photographerCanDiscoverLabs(a.userId);',
      'const originContextPromise=photographerInitialOriginContext(a.userId);\n            const canDiscoverLabs = await photographerCanDiscoverLabs(a.userId);','origin prefetch');
 once('const memberships = canDiscoverLabs\n                ? await pool.query(',
      'const membershipsPromise = canDiscoverLabs\n                ? pool.query(','memberships discovery');
 once(': await pool.query(',
      ': pool.query(','memberships invited');
 once('let labs = [];','let labs = [],labsPromise=Promise.resolve({rows:[]});','labs starter');
 if(section.split('const q = await pool.query(').length!==3)
    throw Error('R1601 expected 2 lab discovery query assignments');
 section=section.replaceAll('const q = await pool.query(', 'labsPromise=pool.query(');
 if(section.split('labs = q.rows;').length!==3)throw Error('R1601 expected 2 lab result assignments');
 section=section.replaceAll('labs = q.rows;','');
 once('const testLabs=await pool.query(',
      'const testLabsPromise=pool.query(','test lab fetch');
 once('const known=new Set(labs.map(row=>String(row.id)));',
      'var [memberships,labsResult,testLabs,originContext]=await Promise.all([membershipsPromise,labsPromise,testLabsPromise,originContextPromise]);\n                labs=labsResult.rows;\n                const known=new Set(labs.map(row=>String(row.id)));','parallel wait');
 once('const originContext=await photographerInitialOriginContext(a.userId);','', 'origin duplicate');
 section=section.replace(head,head+'\n            '+MARK);
 if(!section.includes('memberships:sortPrimary(memberships.rows)'))throw Error('R1601 response contract changed');
 return server.slice(0,start)+section+server.slice(end);
}
module.exports={patchLabDirectory,MARK};