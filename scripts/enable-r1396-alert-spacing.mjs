import fs from 'node:fs';
const file='dist/web/index.html';let s=fs.readFileSync(file,'utf8');
for(const name of ['photobridge-r1363-lab-queue.js','photobridge-r1363-lab-queue.css','photobridge-r1372-third-header.js']){
 let found=false;s=s.replace(new RegExp('('+name.replaceAll('.','\\.')+')([^"\\\']*)','g'),(_,base,query)=>{found=true;const clean=query.replace(/&noticeSpace=[^&"']*/g,'');return base+(clean.includes('&thirdHeader=')?clean.replace('&thirdHeader=','&noticeSpace=r1396&thirdHeader='):clean+(clean.includes('?')?'&':'?')+'noticeSpace=r1396')});
 if(!found)throw Error('R1396 missing asset '+name);
}
fs.writeFileSync(file,s);
