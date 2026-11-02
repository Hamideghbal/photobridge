import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1535 expected client anchor: '+a.slice(0,80));return s.replace(a,b)};
const otp='/photobridge-r1535-sms-otp.js?v=r1535',watch='/photobridge-r1535-lab-session-watch.js?v=r1535';
// Website-only enhancement, after the frozen native UI snapshot.
for(const file of ['dist/web/index.html','dist/web/account-recovery.html','dist/web/lab-login-security.html','dist/api/equipment-rental-register.html','dist/api/equipment-rental-portal.html']){
 let html=fs.readFileSync(file,'utf8');if(!html.includes(otp))html=html.replace(/<script\b/,`<script defer src="${otp}"></script><script`);
 if(file.endsWith('index.html')&&!html.includes(watch))html=html.replace('</head>',`<script defer src="${watch}"></script>\n</head>`);
 html=html.replace(/photobridge-r1534-lab-login-security\.js\?v=r1534/g,'photobridge-r1534-lab-login-security.js?v=r1535').replace(/photobridge-r1393-shared-account\.js\?v=r1393/g,'photobridge-r1393-shared-account.js?v=r1535');fs.writeFileSync(file,html);
}
let file='dist/web/photobridge-r1534-lab-login-security.js',s=fs.readFileSync(file,'utf8');
if(!s.includes('/* PB1535 SMS autofill */')){
 s=once(s,'let challengeId=null,resetToken=null,busy=false;','let challengeId=null,resetToken=null,busy=false,stopOtp=()=>{};');
 s=once(s,'function clearSecrets(){challengeId=resetToken=null;','function clearSecrets(){stopOtp();challengeId=resetToken=null;');
 s=once(s,"if(!challengeId){const data=await request", "if(!challengeId){stopOtp();stopOtp=window.pbSmsOtp?.listen($('code'))||(()=>{});const data=await request");
 s=once(s,"}else{const data=await request('/api/auth/password-reset/verify'", "}else{stopOtp();const data=await request('/api/auth/password-reset/verify'");
 s=once(s,"catch(e){$('error').textContent=e.message", "catch(e){stopOtp();$('error').textContent=e.message");s+='\n/* PB1535 SMS autofill */\n';fs.writeFileSync(file,s);
}
file='dist/web/photobridge-r1393-shared-account.js';s=fs.readFileSync(file,'utf8');
if(!s.includes('/* PB1535 SMS autofill */')){
 s=once(s,'let challenge=null,resetToken=null,busy=false;','let challenge=null,resetToken=null,busy=false,stopOtp=()=>{};');
 s=once(s,'retry.onclick=()=>{if(busy)return;challenge=null;', 'retry.onclick=()=>{if(busy)return;stopOtp();challenge=null;');
 s=once(s,"if(!challenge){const result=await request", "if(!challenge){stopOtp();stopOtp=window.pbSmsOtp?.listen(code)||(()=>{});const result=await request");
 s=once(s,'if(!resetToken){const verified=await request', 'if(!resetToken){stopOtp();const verified=await request');
 s=once(s,'dialog.addEventListener(\'close\',()=>{password.value', 'dialog.addEventListener(\'close\',()=>{stopOtp();password.value');
 s=once(s,"catch(e){error.textContent=e.message", "catch(e){stopOtp();error.textContent=e.message");s+='\n/* PB1535 SMS autofill */\n';fs.writeFileSync(file,s);
}
