import fs from 'node:fs';
const file='dist/api/server.js';let s=fs.readFileSync(file,'utf8');
if(!s.includes('/* PB1370 lab installer ZIP */')){
 const start=s.indexOf('function cleanLabDesktopRelease('),end=s.indexOf('async function labDesktopReleaseSetting()',start);
 if(start<0||end<start)throw Error('R1370 missing lab release cleaner');
 const original=s.slice(start,end),before="name.toLowerCase().endsWith('.exe') ? name : `${name}.exe`";
 if(original.split(before).length!==2)throw Error('R1370 changed lab release filename');
 s=s.slice(0,start)+original.replace(before,"/\\.(exe|zip)$/i.test(name) ? name : `${name}.exe`")+s.slice(end);
 const a=s.indexOf("if (req.method === 'POST' && url.pathname === '/api/admin/lab-desktop-release/upload')"),b=s.indexOf("if (req.method === 'POST' && url.pathname === '/api/admin/lab-desktop-release/upload/complete')",a);
 if(a<0||b<a)throw Error('R1370 missing lab upload route');
 let route=s.slice(a,b);const check="if (!rawName.toLowerCase().endsWith('.exe'))";
 if(route.split(check).length!==2)throw Error('R1370 changed lab extension guard');
 route=route.replace(check,"if (!/\\.(exe|zip)$/i.test(rawName))");
 const mime="'application/x-msdos-program']";if(route.split(mime).length!==2)throw Error('R1370 changed MIME guard');
 route=route.replace(mime,"'application/x-msdos-program', 'application/zip', 'application/x-zip-compressed']");
 s=s.slice(0,a)+route+s.slice(b)+'\n/* PB1370 lab installer ZIP */\n';fs.writeFileSync(file,s);
}
