const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('dist/api/server.js','utf8');const start=source.indexOf("    if (url.pathname === '/api/lab/profile-image'");const end=source.indexOf("        if (req.method === 'GET' && url.pathname === '/api/lab/desktop-access')",start);const code=source.slice(start,end);
test('lab profile image inherits lab admin guard and isolates lab keys',async()=>{
 const scope=source.slice(source.lastIndexOf("if (url.pathname.startsWith('/api/lab/'))",start),start);assert(scope.includes("requireRole(a, 'lab_admin')"));assert(scope.includes('a?.labId'));
 for(const labId of ['lab-a','lab-b']){let key,result;await Function('url','req','labId','pool','res','sendJson',`return(async()=>{${code}})()` )({pathname:'/api/lab/profile-image'},{method:'GET'},labId,{query:async(sql,args)=>{key=args[0];return{rows:[{value:{imageData:'saved'}}]}}},{},(_,status,body)=>result={status,body});assert.equal(key,'lab_profile_image:'+labId);assert.equal(result.body.imageData,'saved');}
});
test('lab avatar validates image bytes before storing under its own lab',async()=>{
 for(const valid of [true,false]){const writes=[];let result;await Function('url','req','labId','pool','res','sendJson','bodyJson','sharp','Buffer',`return(async()=>{${code}})()` )({pathname:'/api/lab/profile-image'},{method:'PUT'},'lab-a',{query:async(sql,args)=>writes.push(args)},{},(_,status,body)=>result={status,body},async()=>({imageData:valid?'data:image/jpeg;base64,YWJj':'invalid'}),()=>({metadata:async()=>({format:'jpeg',width:192,height:192})}),Buffer);assert.equal(result.status,valid?200:400);assert.equal(writes.length,valid?1:0);if(valid)assert.equal(writes[0][0],'lab_profile_image:lab-a');}
});
