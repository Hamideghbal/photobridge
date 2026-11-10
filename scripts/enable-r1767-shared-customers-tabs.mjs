// R1767: late cache barrier for the single Customers switch in both portals.
// Earlier release scripts may rewrite these query tokens; keep delivery deterministic.
import fs from 'node:fs';
const pages=['dist/web/index.html','dist/api/equipment-rental-book.html'];
function updateAsset(html,path,filename,version){
 const pattern=new RegExp('/'+filename.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=[^"\\s]+','g');
 const matches=html.match(pattern)||[];
 if(matches.length!==1)throw Error('R1767 expected one '+filename+' in '+path+', found '+matches.length);
 return html.replace(pattern,'/'+filename+'?v='+version);
}
for(const path of pages){
 let html=fs.readFileSync(path,'utf8');
 html=updateAsset(html,path,'photobridge-r1099-photographer-tabs.js','1767');
 if(path==='dist/web/index.html'){
  html=updateAsset(html,path,'photobridge-r1761-crm-nav.js','r1767');
  html=updateAsset(html,path,'photobridge-r1761-crm-nav.css','r1767');
 }
 fs.writeFileSync(path,html);
}
console.log('[R1767] shared Customers setting and both role navigation assets ready');
