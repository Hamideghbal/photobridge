import fs from 'node:fs';import path from 'node:path';
const allowed=/\.(?:js|cjs|mjs|html|css|json)$/i,skip=new Set(['downloads','desktop-ui','lab-desktop-ui']);
let changed=0;
function walk(dir){
 if(!fs.existsSync(dir))return;
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(skip.has(entry.name))continue;
  const full=path.join(dir,entry.name);
  if(entry.isDirectory())walk(full);
  else if(entry.isFile()&&allowed.test(entry.name)&&fs.statSync(full).size<6000000){
   const content=fs.readFileSync(full,'utf8');
   if(content.includes('\r\n')){fs.writeFileSync(full,content.replace(/\r\n/g,'\n'),'utf8');changed++;}
  }
 }
}
walk('dist/api');walk('dist/web');
console.log('Windows desktop source LF normalized:',changed);
