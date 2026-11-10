// R1769: separate orders before size subfolders, preserve historical downloaded paths.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const marker='/* PB1769 ORDER-FIRST DOWNLOAD FOLDERS */';
function once(src,from,to,label){
 const n=src.split(from).length-1;
 if(n!==1)throw Error('[R1769] '+label+' anchor count '+n);
 return src.replace(from,()=>to);
}
const BT=String.fromCharCode(96),D=String.fromCharCode(36);
const helper=[
 "function pb1769OrderFirst(order){",
 " const saved=yc(String(order?.id||''))||{};",
 " if(saved.pathLayout==='order-v2')return true;",
 " if(saved.pathLayout==='legacy'||saved.startedAt||order?.downloaded_at)return false;",
 " return true;",
 "}",
 "function pb1769OrderFolder(order){",
 " const number=String(order?.number||order?.id||'').trim();",
 " if(!number)throw Error('order_folder_number_missing');",
 " return Ya('order-'+number,'order');",
 "}"
].join('\n')+'\n';
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
let modified=0;
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const bundle=root+'/assets/index-UIRefine-v655-r84.js',page=root+'/index.html';
 if(!fs.existsSync(bundle)||!fs.existsSync(page)){
  if(root==='dist/web')throw Error('[R1769] original Lab web bundle missing');
  console.log('[R1769] no Windows UI snapshot in this build');
  continue;
 }
 let ui=fs.readFileSync(bundle,'utf8');
 if(ui.includes(marker))throw Error('[R1769] folder patch applied twice: '+root);
 const start=ui.indexOf('function Uy('),end=ui.indexOf('async function el(',start);
 if(start<0||end<=start||end-start>3000)throw Error('[R1769] size group missing '+root);
 let group=ui.slice(start,end);
 group=once(group,'T?'+BT+'order-'+D+'{T}'+BT+':""',
  '(!pb1769OrderFirst(s)&&T)?'+BT+'order-'+D+'{T}'+BT+':""','album folder suffix');
 group=once(group,'c?'+BT+'order-'+D+'{c}'+BT+':""',
  '(!pb1769OrderFirst(s)&&c)?'+BT+'order-'+D+'{c}'+BT+':""','print folder suffix');
 ui=ui.slice(0,start)+group+ui.slice(end);
 const tgStart=ui.indexOf('function Tg('),tgEnd=ui.indexOf('function Uy(',tgStart);
 if(tgStart<0||tgEnd<tgStart||tgEnd-tgStart>1100)throw Error('[R1769] lab folder name function missing '+root);
 const tg=[
 "function Tg(order){",
 " const shown=pb1769OrderFirst(order)?(order?.folder_latin_name||order?.customer_name):(order?.storage_customer_name||order?.customer_name);",
 " const name=String(shown||'مشتری').trim()||'مشتری';",
 " if(order?.source==='walkin'){",
 "  const phone=String(order?.customer_mobile||order?.walkin_customer_mobile||'').trim();",
 "  return Ya(name+(phone?'-'+phone:''),'walkin-customer');",
 " }",
 " return Ya(name,'photographer');",
 "}"
].join('\n');
 ui=ui.slice(0,tgStart)+tg+ui.slice(tgEnd);
 ui=once(ui,'function Uy(',helper+'function Uy(','new order layout helper');
 ui=once(ui,'m=await Hl(c,Tg(r)),g=await Hl(m,Uy(t,a))',
  'm=await Hl(c,Tg(r)),pb1769Dir=pb1769OrderFirst(r)?await Hl(m,pb1769OrderFolder(r)):m,g=await Hl(pb1769Dir,Uy(t,a))',
  'web browser target');
 ui=once(ui,'customerDir=await Hl(dateDir,Tg(order)),dir=await Hl(customerDir,Uy(detail,file))',
  'customerDir=await Hl(dateDir,Tg(order)),pb1769Dir=pb1769OrderFirst(order)?await Hl(customerDir,pb1769OrderFolder(order)):customerDir,dir=await Hl(pb1769Dir,Uy(detail,file))',
  'Windows native bridge target');
 ui+='\n'+marker+'\n';
 fs.writeFileSync(bundle,ui);
 execFileSync(process.execPath,['--check',bundle],{stdio:'inherit'});
 let html=fs.readFileSync(page,'utf8');
 const url=/assets\/index-UIRefine-v655-r84\.js\?[^"'<>\s]*/g;
 if([...html.matchAll(url)].length!==1)throw Error('[R1769] asset URL missing '+root);
 html=html.replace(url,match=>match.replace(/&orderFolders=r\d+/g,'')+'&orderFolders=r1769');
 fs.writeFileSync(page,html);
 const manifest=root+'/manifest.json';
 if(fs.existsSync(manifest)){
  const data=JSON.parse(fs.readFileSync(manifest,'utf8'));
  for(const file of ['index.html','assets/index-UIRefine-v655-r84.js']){
   const entry=data.files?.find(x=>x.name===file);
   if(!entry)throw Error('[R1769] Windows manifest entry missing '+file);
   entry.sha256=sha(fs.readFileSync(root+'/'+file));
  }
  data.build=sha(Buffer.from(JSON.stringify(data.files)));
  data.generatedAt=new Date().toISOString();
  fs.writeFileSync(manifest,JSON.stringify(data));
 }
 modified++;
}
if(!modified)throw Error('[R1769] no Lab bundle was updated');
console.log('[R1769] per-order download folders in '+modified+' web/Windows targets; historical paths preserved');
