import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const name='photobridge-r1137-lab-local-intake.js',native='dist/web/lab-desktop-ui';
for(const root of ['dist/web',native]){
 const file=root+'/'+name;let s=fs.readFileSync(file,'utf8');
 if(!s.includes('/* PB1551 walk-in album binding */')){
  const once=(a,b)=>{if(s.split(a).length!==2)throw Error('R1551 changed anchor: '+a);s=s.replace(a,b)};
  once(" const sizeOptions=Array.isArray(album.sizes)?album.sizes:[];",` const sizeOptions=Array.isArray(album.sizes)?album.sizes:[];
 const bindingCatalog=album.printTariffCatalog||{types:[{id:'album_binding_price',kind:'binding',name:'صحافی آلبوم'}],rates:{}};
 const bindingTypes=(bindingCatalog.types||[]).filter(type=>type.kind==='binding'&&type.active!==false);
 const bindingSelect=field(grid,'نوع صحافی',select(bindingTypes.map(type=>[String(type.id),String(type.name)])));
 bindingSelect.setAttribute('aria-label','نوع صحافی');
 function pb1551Binding(){return bindingTypes.find(type=>String(type.id)===bindingSelect.value)}
 function pb1551BindingPrice(size){const type=pb1551Binding(),raw=type?.id==='album_binding_price'?size?.bindingPrice:bindingCatalog.rates?.[String(size?.printSizeId||'')]?.[type?.id];return raw!=null&&String(raw).trim()!==''&&Number.isSafeInteger(Number(raw))&&Number(raw)>0?Number(raw):null;}`);
  once(" function collect(){\n  const size=sizeOptions", " function collect(){\n  if(!pb1551Binding())throw Error('نوع صحافی آلبوم را انتخاب کن.');\n  const size=sizeOptions");
  once('generalNotes:generalNotes.value.trim()};', 'generalNotes:generalNotes.value.trim(),bindingTypeId:bindingSelect.value};');
  once('const binding=size?.bindingPrice;', 'const binding=pb1551BindingPrice(size);');
  once("rows.push(['صحافی '+list.length+' لت'", "rows.push([(pb1551Binding()?.name||'صحافی')+' '+list.length+' لت'");
  s+='\n/* PB1551 walk-in album binding */\n';fs.writeFileSync(file,s);
 }
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const htmlFile=root+'/index.html';let html=fs.readFileSync(htmlFile,'utf8');
 html=html.replace(/(photobridge-r1137-lab-local-intake\.js\?[^"']*)/g,url=>url.includes('&binding=r1551')?url:url+'&binding=r1551');fs.writeFileSync(htmlFile,html);
}
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),file=native+'/manifest.json',m=JSON.parse(fs.readFileSync(file,'utf8'));
for(const key of [name,'index.html']){const row=m.files.find(f=>f.name===key);if(!row)throw Error('R1551 manifest entry missing');row.sha256=hash(fs.readFileSync(native+'/'+key));}
m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(file,JSON.stringify(m));
console.log('[R1551] Walk-in album binding selector',m.build.slice(0,12));
