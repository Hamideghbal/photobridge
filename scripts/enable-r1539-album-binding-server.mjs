import fs from 'node:fs';
const file='dist/api/server.js';
let s=fs.readFileSync(file,'utf8');
function once(source,a,b,label){if(source.split(a).length!==2)throw Error('R1539 album '+label+' changed');return source.replace(a,b)}
let start=s.indexOf('async function albumCatalogForLab('),end=s.indexOf('\nasync function ',start+16);
if(start<0||end<=start)throw Error('album catalog boundary');
let catalog=s.slice(start,end);
catalog=once(catalog,'const coverCatalogEnabled = labPreferences.albumCoverCatalogEnabled !== false;',
'const printTariffCatalog=normalizePrintCatalog(labPreferences.printTariffCatalog);\n    const coverCatalogEnabled = labPreferences.albumCoverCatalogEnabled !== false;','album preferences');
{
 const match=catalog.match(/return\s*\{\s*enabled:\s*Boolean\(lq\.rows\[0\]\?\.album_enabled\)\s*,\s*coverCatalogEnabled\s*,/g)||[];
 if(match.length!==1)throw Error('R1539 album catalog response changed: '+match.length);
 catalog=catalog.replace(match[0],match[0]+' printTariffCatalog,');
}
s=s.slice(0,start)+catalog+s.slice(end);
start=s.indexOf('async function albumOrderSnapshot(');end=s.indexOf('\nasync function ',start+18);
if(start<0||end<=start)throw Error('album snapshot boundary');
let body=s.slice(start,end);
const choice=[
'    // Snapshot the immutable binding id, selected label, size and exact unit price.',
"    const bindingTypeId=String(input?.bindingTypeId||'album_binding_price').trim();",
"    const bindingTypes=(catalog.printTariffCatalog?.types||[{id:'album_binding_price',kind:'binding',name:'صحافی آلبوم',active:true}]).filter(type=>type.kind==='binding'&&type.active!==false);",
'    const bindingType=bindingTypes.find(type=>String(type.id)===bindingTypeId);',
"    if(!bindingType)throw Object.assign(new Error('album_binding_invalid'),{status:400});",
"    const bindingRaw=bindingTypeId==='album_binding_price'?size.bindingPrice:catalog.printTariffCatalog?.rates?.[String(size.printSizeId||'')]?.[bindingTypeId];",
"    const bindingUnpriced=customSize||bindingRaw==null||String(bindingRaw).trim()===''||!Number.isSafeInteger(Number(bindingRaw))||Number(bindingRaw)<=0;",
"    const bindingSnapshot={id:bindingTypeId,name:String(bindingType.name||'صحافی آلبوم'),sizeId:customSize?null:String(size.printSizeId||''),unitPrice:bindingUnpriced?null:Number(bindingRaw)};",
''].join('\n');
body=once(body,'    const spreads = Math.max(1, Math.floor(Number(input?.spreads || 0)));',choice+'    const spreads = Math.max(1, Math.floor(Number(input?.spreads || 0)));','binding selection');
body=once(body,'const manualBindingRequired = Boolean(customSize);','const manualBindingRequired = Boolean(bindingUnpriced);','manual flag');
body=once(body,'const bindingPrice = customSize ? null : albumMoney(size.bindingPrice), bindingTotal = bindingPrice == null ? null : bindingPrice * spreads;','const bindingPrice = bindingUnpriced ? null : albumMoney(bindingRaw), bindingTotal = bindingPrice == null ? null : bindingPrice * spreads;','binding price');
body=once(body,'        cover: coverSnapshot,','        binding: bindingSnapshot,\n        cover: coverSnapshot,','binding snapshot');
body=once(body,"missingPaperTariff ? 'missing_print_tariff' : null","missingPaperTariff ? 'missing_print_tariff' : bindingUnpriced ? 'missing_binding_tariff' : null",'missing tariff');
s=s.slice(0,start)+body+s.slice(end);
const tick=String.fromCharCode(96),orig='description: '+tick+'صحافی آلبوم ',replacement='description: '+tick+'\u0024{String(ad?.binding?.name||\'صحافی آلبوم\').trim()} ';
s=once(s,orig,replacement,'binding invoice description');
start=s.indexOf('async function syncLabAlbumSizesFromPrintTariffs(');end=s.indexOf('\nasync function ',start+24);
if(start<0||end<=start)throw Error('album sizes sync boundary');
let sync=s.slice(start,end);
const pre=[
"    const pbCatalogRow=await client.query('SELECT ui_preferences FROM labs WHERE id=$1',[labId]).catch(()=>({rows:[]}));",
'    const pbCatalog=normalizePrintCatalog(pbCatalogRow.rows[0]?.ui_preferences?.printTariffCatalog);',
"    const customBindings=pbCatalog.types.filter(type=>type.kind==='binding'&&!type.legacy&&type.active!==false);",
''].join('\n');
sync=once(sync,'    const activePrintIds = [];',pre+'    const activePrintIds = [];','sync custom source');
sync=once(sync,'        if (binding <= 0)\n            continue;',
 '        const customAvailable=customBindings.some(type=>Number(pbCatalog.rates[String(row.print_size_id)]?.[type.id]||0)>0);\n        if(binding<=0&&!customAvailable)continue;','sync eligibility');
s=s.slice(0,start)+sync+s.slice(end);
fs.writeFileSync(file,s);
