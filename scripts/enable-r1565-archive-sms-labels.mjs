import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const native='dist/web/lab-desktop-ui',asset='assets/index-UIRefine-v655-r84.js';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1565 anchor '+a.slice(0,90));return s.replace(a,b)};
for(const root of ['dist/web',native]){
 let s=fs.readFileSync(root+'/'+asset,'utf8');
 if(!s.includes('/* PB1565 browser recovery routes */')){
 s=once(s,"const result=await Me(path+'/download',{method,body:JSON.stringify(body || {})});","const livePath=window.pbNativeStorage||path.endsWith('/download-receipt')?path+'/download':path;\n  const result=await Me(livePath,{method,body:JSON.stringify(body || {})});");
 s=once(s,"Me('/api/lab/orders/'+result.order.id+'/download')","Me('/api/lab/orders/'+result.order.id+(window.pbNativeStorage?'/download':''))");
 s=once(s,"Me('/api/lab/orders/'+draft.id+'/download?recovery='","Me('/api/lab/orders/'+draft.id+(window.pbNativeStorage?'/download':'')+'?recovery='");
 s=once(s,"const downloaded=await Dg(prepared,value=>progress?.(value));","const downloaded=await Dg(prepared,value=>progress?.(value));\n      await pb1451AcknowledgeDownload(prepared);");
 s+='\n/* PB1565 browser recovery routes */\n';fs.writeFileSync(root+'/'+asset,s);
 }
 const discount=root+'/photobridge-r1038-subscription-discounts.js';let d=fs.readFileSync(discount,'utf8');d=d.replace("+'٪';","+'٪ تخفیف';").replace('width:49px!important','width:75px!important').replace('8px 69px','8px 95px');fs.writeFileSync(discount,d);
 const index=root+'/index.html';let h=fs.readFileSync(index,'utf8');h=h.replace(/((?:index-UIRefine-v655-r84|photobridge-r1038-subscription-discounts)\.js\?[^"']*)/g,u=>u.includes('&fixes=r1565')?u:u+'&fixes=r1565');fs.writeFileSync(index,h);
 execFileSync(process.execPath,['--check',root+'/'+asset]);
}
fs.writeFileSync('dist/api/sms-message-units.js',fs.readFileSync('scripts/r1565-sms-units.js.txt'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),path=native+'/manifest.json',m=JSON.parse(fs.readFileSync(path,'utf8'));for(const name of [asset,'photobridge-r1038-subscription-discounts.js','index.html'])m.files.find(f=>f.name===name).sha256=hash(fs.readFileSync(native+'/'+name));m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(path,JSON.stringify(m));
console.log('[R1565] Browser recovery routes, explicit discount and full lab SMS names');
