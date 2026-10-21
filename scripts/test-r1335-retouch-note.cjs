const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const server=fs.readFileSync('dist/api/server.js','utf8'),bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
for(const note of ['', 'اصلاح نور'])test('selected retouch photo accepts note '+JSON.stringify(note),async()=>{
 const start=server.indexOf('        const requested =',server.indexOf('const publicGalleryApproval'));
 const end=server.indexOf("            await audit(undefined, row.lab_id, decision === 'approve'",start);
 const src=server.slice(start,end)+'return {ok:true};}finally{c.release();}';
 const writes=[];const c={release(){},query:async(sql,args)=>{writes.push({sql,args});if(sql.includes('SELECT * FROM photographer_gallery_orders'))return {rowCount:1,rows:[{id:'order',status:'awaiting_approval'}]};if(sql.includes('SELECT DISTINCT media_id'))return {rows:[{media_id:'photo'}]};if(sql.includes('max(round)'))return {rows:[{max_round:0}]};return {rows:[],rowCount:1};}};
 const context={b:{revisions:[{mediaId:'photo',note}]},decision:'changes',pool:{connect:async()=>c},publicGalleryApproval:['','','order'],row:{id:'gallery'},crypto:{randomUUID:()=> 'revision'},res:{},sendJson:(_,status,data)=>({status,data})};vm.createContext(context);vm.runInContext('this.run=async()=>{'+src+'}',context);
 const result=await context.run();assert.equal(result.ok,true);assert.equal(writes.find(x=>x.sql.includes('INSERT INTO photographer_gallery_revision_requests')).args[4],note);assert(writes.some(x=>x.sql.includes("status='retouching'")));assert(!writes.some(x=>x.sql.includes("status='completed'")));
});
for(const decision of ['changes','approve'])test('customer decision '+decision+' with checked photo and empty note',async()=>{
 let posts=0,notices=[];const start=bundle.indexOf('pt=async Ee=>{')+3,end=bundle.indexOf(',ot=x.useMemo',start);assert(start>3&&end>start);
 const context={fe:{id:'order'},ot:[{mediaId:'photo'}],E:new Set(['photo']),T:{},window:{pb1113GalleryNotice:x=>notices.push(x),pb1113GalleryConfirm:async()=>true,scrollTo(){}},f(){},Me:async(_,opts)=>{posts++;assert.equal(JSON.parse(opts.body).revisions[0].note,'');},t:'gallery',l:'code',k(){},C(){},ie:async()=>{}};
 vm.createContext(context);vm.runInContext('this.run='+bundle.slice(start,end),context);await context.run(decision);
 assert.equal(posts,decision==='changes'?1:0);if(decision==='approve')assert.match(notices[0],/تیک اصلاح/);
});
test('final approval disabled while revisions selected; textarea optional',()=>{assert(bundle.includes('disabled:p||!ot.length||E.size>0'));assert(bundle.includes('توضیح اصلاح همین عکس (اختیاری)'));});
