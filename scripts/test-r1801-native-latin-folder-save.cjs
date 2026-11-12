'use strict';const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('dist/api/server.js','utf8'),a=source.indexOf('        /* R1801:'),b=source.indexOf('        const cm =',a);assert(a>=0&&b>a);
async function save(body,{member=true}={}){
 const {updateLabPhotographerFolderAlias}=await import('../dist/api/lab-photographer-folder-alias.js');let response;const writes=[];
 const pool={query:async(sql,args)=>{if(sql.includes('FROM lab_memberships')){assert.deepEqual(args,['lab','11111111-1111-4111-8111-111111111111']);return {rowCount:member?1:0}}writes.push({sql,args});return {rowCount:1}}};
 const ctx={req:{method:'PUT'},res:{},url:new URL('https://example.org/api/lab/photographer-folder-alias/11111111-1111-4111-8111-111111111111'),bodyJson:async()=>body,pool,labId:'lab',a:{userId:'admin'},updateLabPhotographerFolderAlias,audit:async()=>{},sendJson:(_,status,data)=>response={status,data}};
 await vm.runInNewContext('(async()=>{'+source.slice(a,b)+'})()',ctx);return {response,writes};
}
test('R1801 native settings endpoint saves and clears the scoped folder alias, accepting transport operation IDs',async()=>{
 const r=await save({folderLatinName:' Studio  103 ',desktopOperationId:'device:operation-103'});assert.equal(r.response.status,200);assert.equal(r.response.data.folderLatinName,'Studio 103');assert.equal(r.writes.length,1);assert.equal(r.writes[0].args[0],'lab_photographer_folder_alias:lab:11111111-1111-4111-8111-111111111111');
 const empty=await save({folderLatinName:''});assert.equal(empty.response.status,200);assert.match(empty.writes[0].sql,/DELETE FROM platform_settings/);
});
test('R1801 invalid labels, unrelated fields and another lab membership never write',async()=>{
 for(const body of [{folderLatinName:'CON'},{folderLatinName:'A/B'},{folderLatinName:'Good',active:false},{folderLatinName:'Good',desktopOperationId:{}},{}]){const r=await save(body);assert.equal(r.response.status,400);assert.equal(r.writes.length,0)}
 const other=await save({folderLatinName:'Good'},{member:false});assert.equal(other.response.status,404);assert.equal(other.writes.length,0);
});
async function edit({reply={ok:true,folderLatinName:'Studio 103'},refreshError=false}={}){
 let request,refreshed=0;const alerts=[],states=[];const ctx={x:{useState:v=>[v,n=>states.push(n)],useEffect:()=>{}},e:{jsx:(_,p)=>p},pb1775NativeEditDialog:async()=>'Studio 103',Me:async(url,opt)=>{request={url,opt};return reply},alert:s=>alerts.push(s)};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('scripts/r1801-latin-folder-editor.js.txt','utf8'),ctx);await ctx.PB1769LatinFolderEdit({customer:{id:'customer'},onSaved:async()=>{refreshed++;if(refreshError)throw Error('refresh failed')}}).onClick();return {request,refreshed,alerts,states};
}
test('R1801 native editor uses settings route and only shows a server-confirmed alias',async()=>{
 const r=await edit();assert.equal(r.request.url,'/api/lab/photographer-folder-alias/customer');assert.equal(r.request.opt.method,'PUT');assert.equal(r.states[1],'Studio 103');assert.equal(r.refreshed,1);assert.equal(r.alerts.length,0);
 const pending=await edit({reply:{ok:true,desktopPending:true}});assert.equal(pending.refreshed,0);assert(!pending.states.includes('Studio 103'));assert.match(pending.alerts[0],/صف/);
 const stale=await edit({refreshError:true});assert(stale.states.includes('Studio 103'));assert.match(stale.alerts[0],/ذخیره شد/);
});
