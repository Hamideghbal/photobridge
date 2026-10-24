const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const server=fs.readFileSync('dist/api/server.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const p=ui.indexOf('function Hf('),q=ui.indexOf('function bc(',p),r=ui.indexOf('function aw(',q),e=ui.indexOf('function iw(',r);
const photographer=ui.slice(p,q),shell=ui.slice(q,r),chat=ui.slice(r,e);

test('confirmed photographer lab changes emit account-scoped lab context',()=>{
 assert.ok(p>=0&&q>p);
 assert.match(photographer,/f\(P\),P\?\.lab\?\.id&&window\.dispatchEvent\(new CustomEvent\("pb-customer-active-lab"/);
 assert.match(photographer,/userId:String\(t\.user\.userId\|\|t\.user\.id\),lab:P\.lab/);
 assert.match(photographer,/b!==ie\.current\|\|oe&&String\(/,'stale lab switch guard must remain');
});

test('chat switches identity, label, messages and unread scope on lab selection',()=>{
 assert.ok(r>q&&e>r);
 assert.match(shell,/pbSetLab\(d\.lab\)/);
 assert.match(shell,/me:pbChatMe,collapsed:l,setCollapsed:m/);
 assert.match(shell,/pbChatMe=t==="customer"\?\{\.\.\.a,lab:pbChatLab\}:a/);
 assert.match(shell,/pbChatLab\?\.id\|\|a\.user\.labId/);
 assert.match(shell,/pbChatLab\?\.service_only/);
 assert.match(chat,/lablink_chat_seen_\$\{t\}_\$\{a\.user\.userId\}\$\{t==="customer"\?"_"\+/);
 assert.match(chat,/pbAccount=/);
 assert.match(chat,/pbSeenKey=/);
 assert.match(chat,/\/api\/customer\/chat/);
 const match=shell.match(/const changed=event=>\{([\s\S]*?)\};window\.addEventListener\("pb-customer-active-lab",changed\)/);
 assert.ok(match,'account-scoped event listener exists');
 const selected=[];
 const handler=new Function('a','pbSetLab','const changed=event=>{'+match[1]+'};return changed')({user:{userId:'my-user'}},value=>selected.push(value));
 handler({detail:{userId:'another-user',lab:{id:'wrong',name:'wrong'}}});
 handler({detail:{userId:'my-user',lab:{id:'lab-2',name:'Lab 2'}}});
 assert.equal(selected.length,1,'do not accept lab events from other accounts');
 assert.equal(selected[0].id,'lab-2');
 assert.match(shell,/removeEventListener\("pb-customer-active-lab",changed\)/);
});

test('lab entry avoids duplicate contact fetch and unnecessary open-customer polling',()=>{
 assert.match(chat,/const startup=setTimeout\(check,t==="lab"\?650:0\)/);
 assert.match(chat,/t==="lab"&&s\?12e3:5e3/);
 assert.match(chat,/if\(t!=="customer"\|\|s\)\$\(\)\.catch/);
 assert.doesNotMatch(chat,/ae\(\)\.catch\(\(\)=>\{\}\),\$\(\)\.catch/);
 assert.match(chat,/clearTimeout\(startup\);clearInterval\(ie\)/);
 assert.match(chat,/pb1405Unread/);
});

test('last chat message for each photographer comes from one scoped LATERAL lookup',()=>{
 const start=server.indexOf("if (req.method === 'GET' && url.pathname === '/api/lab/chat/contacts')");
 const end=server.indexOf('const labChat =',start);
 assert.ok(start>=0&&end>start);
 const query=server.slice(start,end);
 assert.equal((query.match(/LEFT JOIN LATERAL/g)||[]).length,1);
 assert.equal((query.match(/FROM chat_messages cm/g)||[]).length,1);
 assert.match(query,/WHERE cm\.lab_id=\$1 AND cm\.customer_id=u\.id/);
 assert.match(query,/WHERE m\.lab_id=\$1 AND m\.role='customer'/);
 for(const col of ['last_message','last_message_at','last_sender_id'])assert.match(query,new RegExp('AS '+col));
 assert.match(query,/ORDER BY last_message_at DESC NULLS LAST,m\.created_at DESC/);
 assert.match(query,/return sendJson\(res, 200, \{ contacts: q\.rows \}\)/);
});

test('version markers confirm scoped release and no duplicate transformations',()=>{
 assert.equal(ui.split('/* PB1409 lab context and chat startup */').length-1,1);
 assert.equal(server.split('/* PB1409 efficient lab chat contacts */').length-1,1);
 assert.match(html,/activeLabChat=r1409/);
 assert.match(ui,/\/\* PB1407 chat header and collapse \*\//);
 assert.match(ui,/\/\* PB1406 compact lab chat \*\//);
});
