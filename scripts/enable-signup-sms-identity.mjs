import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync}from'node:child_process';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('Signup SMS anchor: '+a.slice(0,100));return s.replace(a,b)};
let p='dist/api/shared-credentials.js',s=fs.readFileSync(p,'utf8');
s=s.replace(/export async function prepareSignupCredential\([\s\S]*?\n}\n/,'').replace(/export async function finishSignupCredential\([^\n]*\n/,'');s+='\n'+fs.readFileSync('scripts/signup-sms-credentials.js.txt','utf8');fs.writeFileSync(p,s);
p='dist/api/server.js';s=fs.readFileSync(p,'utf8');s=once(s,'credentialRows,matchesBusinessPassword,businessLoginState,','credentialRows,signupSmsIdentity,signupCredentialPasswordHash,matchesBusinessPassword,businessLoginState,');
s=once(s,'JSON.stringify(payload || {}), passwordHash(password), cfg.provider','JSON.stringify(payload || {}), await signupCredentialPasswordHash(pool,payload,password,passwordHash), cfg.provider');
for(const path of ['equipment-rental-trial','lab-trial']){const start=s.indexOf("url.pathname === '/api/public/"+path+"')"),end=s.indexOf("url.pathname === '/api/public/"+path+"/verify'",start);let route=s.slice(start,end);const a=route.indexOf('        const credentialMatches ='),b=route.indexOf('        if (!existing && password.length',a);if(a<0||b<a)throw Error('Signup identity route '+path);route=route.slice(0,a)+`        let existing;try{existing=signupSmsIdentity(credentialRecords)}catch(error){return sendJson(res,error.status||409,{error:error.message})}
`+route.slice(b);s=s.slice(0,start)+route+s.slice(end);}
// Existing non-photographer accounts also add the photographer role by SMS.
{const a=s.indexOf("url.pathname === '/api/public/photographer-signup')"),b=s.indexOf("url.pathname === '/api/public/photographer-signup/verify'",a);let route=s.slice(a,b);if(!route.includes('if (!existing && password.length < 8)'))route=once(route,'if (password.length < 8)','if (!existing && password.length < 8)');s=s.slice(0,a)+route+s.slice(b);}
{const a=s.indexOf('existingCredentialUserId: existingUser'),start=s.lastIndexOf('if (password.length < 8)',a);if(start<0||a-start>2000)throw Error('Invite password guard');let c=s.slice(start,a);c=once(c,'if (password.length < 8)','if (!existingUser && password.length < 8)');c=once(c,'if (password !== confirmPassword)','if (!existingUser && password !== confirmPassword)');s=s.slice(0,start)+c+s.slice(a);}
s='const signupAccountLookups=new Map();\n'+s;
const anchor="    if (req.method === 'POST' && url.pathname === '/api/public/lab-trial') {";
s=once(s,anchor,`    if(req.method==='POST'&&url.pathname==='/api/public/signup-account'){
      const now=Date.now(),key=requestIpHash(req);for(const[k,v]of signupAccountLookups)if(v.until<now)signupAccountLookups.delete(k);
      const limit=signupAccountLookups.get(key)||{count:0,until:now+60000};if(++limit.count>30)return sendJson(res,429,{error:'rate_limited'});if(signupAccountLookups.size<10000||signupAccountLookups.has(key))signupAccountLookups.set(key,limit);else return sendJson(res,429,{error:'rate_limited'});
      const body=await bodyJson(req),mobile=normalizeMobile(String(body.mobile||''));
      if(!/^09\\d{9}$/.test(mobile))return sendJson(res,400,{error:'invalid_mobile'});
      const rows=await credentialRows(pool,mobile);
      res.setHeader('Cache-Control','no-store');
      return sendJson(res,200,{existingAccount:rows.length>0,canVerify:rows.some(row=>row.active===true)});
    }
`+anchor);fs.writeFileSync(p,s);execFileSync(process.execPath,['--check',p]);
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 p=root+'/assets/index-UIRefine-v655-r84.js';s=fs.readFileSync(p,'utf8');s=once(s,'if(t.password!==t.confirmPassword)','if(!window.pbSignupExisting?.(t.mobile)&&t.password!==t.confirmPassword)');s=once(s,'if(!t.password){m("رمز عبور را وارد کن.")','if(!window.pbSignupExisting?.(t.mobile)&&!t.password){m("رمز عبور را وارد کن.")');s=once(s,'if(!J&&(l.password||l.confirmPassword)&&l.password!==l.confirmPassword)','if(!J&&!window.pbSignupExisting?.(l.mobile)&&(l.password||l.confirmPassword)&&l.password!==l.confirmPassword)');fs.writeFileSync(p,s);
 fs.copyFileSync('scripts/signup-sms-ui.js',root+'/photobridge-signup-sms.js');p=root+'/index.html';s=fs.readFileSync(p,'utf8').replace('</head>','<script defer src="/photobridge-signup-sms.js?v=r1623"></script></head>').replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,'$1&signupSms=r1623');fs.writeFileSync(p,s);
}
p='dist/api/equipment-rental-register.html';s=fs.readFileSync(p,'utf8').replace('</head>','<script defer src="/photobridge-signup-sms.js?v=r1623"></script></head>');fs.writeFileSync(p,s);
const root='dist/web/lab-desktop-ui',mp=root+'/manifest.json',m=JSON.parse(fs.readFileSync(mp)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');for(const name of ['assets/index-UIRefine-v655-r84.js','index.html','photobridge-signup-sms.js']){let item=m.files.find(x=>x.name===name);if(!item){item={name,url:'/lab-desktop-ui/'+name};m.files.push(item)}item.sha256=hash(fs.readFileSync(root+'/'+name))}m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(mp,JSON.stringify(m));
