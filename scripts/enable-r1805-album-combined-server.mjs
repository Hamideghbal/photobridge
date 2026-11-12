
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const one=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error('[R1805] '+label+' anchor '+n);return s.replace(a,b);};
const region=(s,a,b,fn,label)=>{const i=s.indexOf(a),j=i<0?-1:s.indexOf(b,i+a.length);if(i<0||j<=i)throw Error('[R1805] '+label+' bounds');return s.slice(0,i)+fn(s.slice(i,j))+s.slice(j);};
let catalog=read('dist/api/lab-print-catalog.js');
catalog=one(catalog,'export function normalizePrintCatalog(raw){',read('scripts/r1805-combined-album-prices.js.txt')+'\nexport function normalizePrintCatalog(raw){','catalog helpers');
catalog=one(catalog,'albumPricingMode:data.albumPricingMode==="combined"?"combined":"separate"};','albumPricingMode:data.albumPricingMode==="combined"?"combined":"separate",albumCombinedRates:pb1805CleanCombinedRates(data.albumCombinedRates)};','persist three prices');
catalog=one(catalog,"export function applyPrintRates(catalog,rows,sizeIds){return applyAudienceRates(catalog,rows,sizeIds,'colleague')}","export function applyPrintRates(catalog,rows,sizeIds){return pb1805ApplyCombinedRates(applyAudienceRates(catalog,rows,sizeIds,'colleague'),rows,sizeIds)}",'save three rates atomically');
catalog=one(catalog,"if(!['binding','chassis','frame'].includes(kind))fail('print_catalog_invalid_kind');","if(!['binding','chassis','frame'].includes(kind))fail('print_catalog_invalid_kind');\n if(kind==='binding'&&catalog.albumPricingMode==='combined')fail('album_binding_model_locked');",'one binding model in combined mode');
write('dist/api/lab-print-catalog.js',catalog);
let server=read('dist/api/server.js');
server=one(server,"if(rows.some(r=>r&&Object.hasOwn(r,'customRates')))","if(rows.some(r=>r&&(Object.hasOwn(r,'customRates')||Object.hasOwn(r,'combinedAlbumRates'))))",'prices save detects combined rates');
server=region(server,'async function syncLabAlbumSizesFromPrintTariffs(','async function albumCoverCatalogV2ForLab(',s=>{
 s=one(s,'if(binding<=0&&!customAvailable)continue;',"const pb1805Combined=pbCatalog.albumPricingMode==='combined'&&['luster','silk','metallic'].some(p=>Number(pbCatalog.albumCombinedRates?.[String(row.print_size_id)]?.[p]||0)>0);\n        if(binding<=0&&!customAvailable&&!pb1805Combined)continue;",'combined size eligibility');
 return s;
},'album-size sync');
server=region(server,'async function albumOrderSnapshot(','\nasync function ',s=>{
 s=one(s,"const bindingTypeId=String(input?.bindingTypeId||'album_binding_price').trim();","const pb1805ModeActive=(existingPricingMode??catalog.printTariffCatalog?.albumPricingMode)==='combined';\n    const bindingTypeId=pb1805ModeActive?'album_binding_price':String(input?.bindingTypeId||'album_binding_price').trim();",'force one combined model');
 s=one(s,"const bindingUnpriced=customSize||bindingRaw==null||String(bindingRaw).trim()===''||!Number.isSafeInteger(Number(bindingRaw))||Number(bindingRaw)<=0;","const bindingUnpriced=customSize||(!pb1805ModeActive&&(bindingRaw==null||String(bindingRaw).trim()===''||!Number.isSafeInteger(Number(bindingRaw))||Number(bindingRaw)<=0));",'combined not tied to old single price');
 s=one(s,"unitPrice:bindingUnpriced?null:Number(bindingRaw)","unitPrice:pb1805ModeActive?null:bindingUnpriced?null:Number(bindingRaw)",'frozen binding model label');
 s=one(s,'    const knownPrintTotal = paperBreakdown.reduce((n, x) => n + Number(x.lineTotal || 0), 0);',[
 '    const knownPrintTotal = paperBreakdown.reduce((n, x) => n + Number(x.lineTotal || 0), 0);',
 '    const pb1805StoredRates=catalog.printTariffCatalog?.albumCombinedRates?.[String(size.printSizeId||"")]||{};',
 '    const pb1805CombinedBreakdown=pb1795Combined?paperBreakdown.map(row=>{',
 '      const raw=customSize?null:pb1805StoredRates[row.paperType],n=raw==null||raw===""?NaN:Number(raw);',
 '      const valid=Number.isSafeInteger(n)&&n>0;',
 '      return {...row,unitPrice:valid?n:null,lineTotal:valid?n*row.count:null};',
 '    }):[];',
 '    const pb1805CombinedMissing=pb1795Combined&&(customSize||!pb1805CombinedBreakdown.length||pb1805CombinedBreakdown.some(row=>row.unitPrice==null));',
 '    const pb1805CombinedTotal=pb1805CombinedBreakdown.reduce((n,row)=>n+Number(row.lineTotal||0),0);'
 ].join('\n'),'actual paper-specific combined rates');
 s=one(s,'const manualBindingRequired = Boolean(bindingUnpriced);','const manualBindingRequired = Boolean(pb1795Combined?pb1805CombinedMissing:bindingUnpriced);','manual mode requires every chosen paper tariff');
 s=one(s,'const bindingPrice = bindingUnpriced ? null : albumMoney(bindingRaw), bindingTotal = bindingPrice == null ? null : bindingPrice * spreads;','const bindingPrice = pb1795Combined?(pb1805CombinedMissing?null:pb1805CombinedBreakdown.length===1?pb1805CombinedBreakdown[0].unitPrice:null):(bindingUnpriced?null:albumMoney(bindingRaw)), bindingTotal = pb1795Combined?(pb1805CombinedMissing?null:pb1805CombinedTotal):(bindingPrice==null?null:bindingPrice*spreads);','weighted total');
 s=one(s,"manualReason: customSize ? 'custom_size'","manualReason: pb1805CombinedMissing ? 'missing_combined_paper_tariff' : customSize ? 'custom_size'",'manual reason');
 s=one(s,"albumPricingMode:pb1795Combined?'combined':'separate',","albumPricingMode:pb1795Combined?'combined':'separate',\n            combinedPaperBreakdown:pb1795Combined?pb1805CombinedBreakdown:undefined,",'frozen three paper-specific rows');
 return s;
},'album pricing snapshot');
server=region(server,'const paperBreakdown = Array.isArray(ad?.paperBreakdown) && ad.paperBreakdown.length','const needManualCover =',s=>{
 const re=/            if \(bindingUnit > 0 \|\| needManualBinding\)\s+items\.push\(\{ kind: 'album_binding',[^\n]+\}\);/g;
 const found=[...s.matchAll(re)];
 if(found.length!==1)throw Error('[R1805] actual binding invoice row anchor '+found.length);
 const old=found[0][0];
 const newer=[
 '            if(pb1795Combined&&!needManualBinding&&Array.isArray(pricing.combinedPaperBreakdown)&&pricing.combinedPaperBreakdown.length){',
 '                for(const row of pricing.combinedPaperBreakdown){',
 '                    const qty=Math.max(0,Math.floor(Number(row?.count||0))),unit=Math.max(0,Math.round(Number(row?.unitPrice||0)));',
 '                    if(!qty||!unit)continue;',
 '                    items.push({kind:"album_binding",description:"چاپ و صحافی · "+String(ad?.size?.label||"").trim()+" · کاغذ "+String(row.paperTypeLabel||invoicePrintTypeLabel(row.paperType)||row.paperType||"").trim(),quantity:qty,unitPrice:unit,lineTotal:unit*qty});',
 '                }',
 '            }else'+old.trimStart()
 ].join('\n');
 return s.replace(old,newer);
},'album invoice');
server=one(server,'sizes = (albumBase.sizes || []).filter((x) => x.active !== false && Number(x.bindingPrice || 0) > 0), extras =','sizes = (albumBase.sizes || []).filter((x) => x.active !== false && (Number(x.bindingPrice || 0) > 0 || (albumBase.printTariffCatalog?.albumPricingMode==="combined" && ["luster","silk","metallic"].some(p=>Number(albumBase.printTariffCatalog?.albumCombinedRates?.[String(x.printSizeId||"")]?.[p]||0)>0)))), extras =','album settings accept priced combined sizes');
server=one(server,'SELECT id,label FROM lab_album_sizes WHERE lab_id=$1 AND active=true AND binding_price>0 ORDER BY sort_order,label','SELECT id,label FROM lab_album_sizes WHERE lab_id=$1 AND active=true ORDER BY sort_order,label','cover prices for active combined-only album sizes');
server=one(server,'sizeIdsByLabel.set(cleanText(row.label), String(row.id));','if(sizeNames.includes(cleanText(row.label)))sizeIdsByLabel.set(cleanText(row.label), String(row.id));','keep allowed size labels');
write('dist/api/server.js',server);
for(const file of ['dist/api/server.js','dist/api/lab-print-catalog.js'])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('[R1805] validated 3-paper combined album rates, single model and frozen invoice price breakdown');
