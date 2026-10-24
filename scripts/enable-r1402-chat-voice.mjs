import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1402 changed anchor: '+a.slice(0,90));return s.replace(a,b)};
let server=fs.readFileSync('dist/api/server.js','utf8');
if(!server.includes('/* PB1402 chat voice */')){
 server="import {saveChatVoice,voiceRows} from './chat-voice.js';\n/* PB1402 chat voice */\n"+server;
 server+=`\nasync function pb1402StoreVoice(rel,buffer,mime){if(storageConfigured&&s3){const key=storageKey(rel);await s3.send(new PutObjectCommand({Bucket:S3_BUCKET,Key:key,Body:buffer,ContentType:mime}));return key}if(LOCAL_UPLOAD_FALLBACK){const key=localStorageObjectKey(rel),file=localPathForKey(key);await fs.promises.mkdir(path.dirname(file),{recursive:true});await fs.promises.writeFile(file,buffer,{flag:'wx'});return key}throw Error('storage_not_configured')}\nasync function pb1402RemoveVoice(key){if(key.startsWith('local/'))await fs.promises.unlink(localPathForKey(key));else await storageDelete(key)}\nasync function pb1402Voice(req,res,labId,customerId,senderId){try{const input=await bodyJson(req,1450000);const message=await saveChatVoice({input,labId,customerId,senderId,pool,store:pb1402StoreVoice,remove:pb1402RemoveVoice});return sendJson(res,201,{message})}catch(err){return sendJson(res,err.status|| (err.message==='payload_too_large'?413:503),{error:err.status?err.message:'voice_send_failed'})}}\n`;
 const labAnchor="        const labChat = url.pathname.match(/^\\/api\\/lab\\/chat\\/([0-9a-f-]+)$/);";
 server=once(server,labAnchor,`        const voiceChat=url.pathname.match(/^\\/api\\/lab\\/chat\\/([0-9a-f-]+)\\/voice$/);\n        if(voiceChat&&req.method==='POST'){if(!(await customerBelongsToLab(labId,voiceChat[1])))return sendJson(res,404,{error:'not_found'});return pb1402Voice(req,res,labId,voiceChat[1],a.userId)}\n`+labAnchor);
 const customerAnchor="        if (req.method === 'GET' && url.pathname === '/api/customer/chat') {";
 server=once(server,customerAnchor,"        if(req.method==='POST'&&url.pathname==='/api/customer/chat/voice')return pb1402Voice(req,res,labId,a.userId,a.userId);\n"+customerAnchor);
 for(const anchor of ["        if (labChat && req.method === 'GET') {",customerAnchor]){
  const from=server.indexOf(anchor),to=server.indexOf('return sendJson(res, 200, { messages: q.rows });',from);if(to<0||to-from>1600)throw Error('R1402 changed chat read');server=server.slice(0,to)+server.slice(to).replace('return sendJson(res, 200, { messages: q.rows });','return sendJson(res, 200, { messages: voiceRows(q.rows,issueStoredPreviewUrl) });');
 }
 fs.writeFileSync('dist/api/server.js',server);
}
let ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
if(!ui.includes('/* PB1402 chat voice */')){
 const from=ui.indexOf('function aw('),to=ui.indexOf('function iw(',from);if(from<0||to<0)throw Error('R1402 missing chat');let chat=ui.slice(from,to);
 chat=once(chat,'e.jsx("p",{children:ie.message})','ie.voiceUrl?e.jsx("audio",{controls:true,preload:"none",src:ie.voiceUrl,"aria-label":"پیام صوتی"}):e.jsx("p",{children:ie.message})');
 const composer='e.jsxs("div",{className:"chatComposer",children:[';
 chat=once(chat,composer,composer+'!g&&(t==="customer"||c)&&e.jsx(PB1402Voice,{api:t==="customer"?"/api/customer/chat":`/api/lab/chat/${c.id}`,onSent:async()=>{await v();await ae();L()}},`${a.user.userId}:${a.lab?.id||""}:${t}:${c?.id||""}`),');
 ui=ui.slice(0,from)+chat+ui.slice(to)+'\n/* PB1402 chat voice */\n'+fs.readFileSync('scripts/r1402-voice-ui.js','utf8');fs.writeFileSync('dist/web/assets/index-UIRefine-v655-r84.js',ui);
}
const file='dist/web/index.html';if(fs.existsSync(file)){let html=fs.readFileSync(file,'utf8');if(!html.includes('/photobridge-r1402-voice.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1402-voice.css?v=r1402"></head>');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.replace(/&voiceChat=[^&"']*/g,'')+'&voiceChat=r1402');fs.writeFileSync(file,html)}
