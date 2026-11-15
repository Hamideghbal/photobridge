// R1864: mirror the visible binding option when storing or submitting an
// album. R1539 displays the first active binding if the default is inactive,
// while the raw React state retains the old default until onChange fires.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const asset='assets/index-UIRefine-v655-r84.js';
const helper=[
"function PB1864AlbumBindingId(settings,requested){",
"  const active=(settings?.printTariffCatalog?.types||[]).filter(type=>type&&type.kind==='binding'&&type.active!==false);",
"  const found=active.find(type=>String(type.id)===String(requested))||active[0];",
"  return String(found?.id||'album_binding_price');",
"}"
].join('\n');
function once(source,oldValue,newValue,description){
  const n=source.split(oldValue).length-1;
  if(n!==1)throw Error('[R1864] '+description+' anchor count '+n);
  return source.replace(oldValue,newValue);
}
const effective='PB1864AlbumBindingId(l,pb1539Binding)';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const file=root+'/'+asset;
  let source=fs.readFileSync(file,'utf8');
  const start=source.indexOf('function Kv('),end=source.indexOf('function ',start+12);
  if(start<0||end<=start)throw Error('[R1864] missing album component '+root);
  let kv=source.slice(start,end);
  if(!kv.includes('pb1539Chosen=pb1539Bindings.find(')
    ||!kv.includes('className:"pb1539BindingField"')
    ||!kv.includes('value:String(pb1539Chosen.id)'))
    throw Error('[R1864] binding UI structure changed '+root);
  kv=once(kv,'ue=()=>({bindingTypeId:pb1539Binding,sizeId:m,',
    'ue=()=>({bindingTypeId:'+effective+',sizeId:m,','draft');
  kv=once(kv,'const b=JSON.stringify({bindingTypeId:pb1539Binding,sizeId:m,',
    'const b=JSON.stringify({bindingTypeId:'+effective+',sizeId:m,','auto-save');
  kv=once(kv,'albumData:{bindingTypeId:pb1539Binding,sizeId:Q?',
    'albumData:{bindingTypeId:'+effective+',sizeId:Q?','submit');
  kv=once(kv,
    'if(!pb1539Bindings.some(gt=>String(gt.id)===String(pb1539Binding)))return alert("ابتدا نوع صحافی را انتخاب کن.");',
    'if(!pb1539Bindings.some(gt=>String(gt.id)===String('+effective+')))return alert("ابتدا نوع صحافی را انتخاب کن.");',
    'validation');
  if(!kv.includes('pb1539SetBinding(id)')||kv.includes('albumData:{bindingTypeId:pb1539Binding'))
    throw Error('[R1864] binding selection regression '+root);
  source=source.slice(0,start)+kv+source.slice(end)+'\n'+helper+'\n';
  fs.writeFileSync(file,source);
  execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
  const index=root+'/index.html';
  let html=fs.readFileSync(index,'utf8');
  html=once(html,'</head>','<meta name="pb-album-binding-fix" content="r1864"></head>',root+' cache marker');
  html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&albumBindingFix=r1864')?url:url+'&albumBindingFix=r1864');
  fs.writeFileSync(index,html);
}
const native='dist/web/lab-desktop-ui',manifestPath=native+'/manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
for(const name of [asset,'index.html']){
  const row=manifest.files.find(x=>x.name===name);
  if(!row)throw Error('[R1864] Windows manifest missing '+name);
  row.sha256=sha(fs.readFileSync(native+'/'+name));
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=sha(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log('[R1864] album binding displayed option equals draft, validation and submit, web/native');
