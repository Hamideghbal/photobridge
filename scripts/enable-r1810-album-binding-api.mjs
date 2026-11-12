
/* R1810: isolated album binding tariff storage for colleagues and walk-in customers. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const one=(s,a,b,name)=>{const n=s.split(a).length-1;if(n!==1)throw Error('[R1810 API] '+name+' anchor '+n);return s.replace(a,b)};
const cfile='dist/api/lab-print-catalog.js';
let catalog=read(cfile);
catalog=one(catalog,'export function normalizePrintCatalog(raw){',read('scripts/r1810-walkin-album-rate-normalizer.js.txt')+'\nexport function normalizePrintCatalog(raw){','normalizer');
catalog=one(catalog,
 'albumCombinedRates:pb1805CleanCombinedRates(data.albumCombinedRates)};',
 'albumCombinedRates:pb1805CleanCombinedRates(data.albumCombinedRates),walkinAlbumCombinedRates:pb1805CleanCombinedRates(data.walkinAlbumCombinedRates),walkinAlbumBindingRates:pb1810CleanWalkinBindingRates(data.walkinAlbumBindingRates)};',
 'walk-in catalogs');
write(cfile,catalog);
const serverFile='dist/api/server.js';
let server=read(serverFile);
server=one(server,'async function albumOrderSnapshot(',read('scripts/r1810-binding-tariffs-handler.js.txt')+'\nasync function albumOrderSnapshot(','standalone safe modal save handler');
server=one(server,
 "        if (req.method === 'PUT' && url.pathname === '/api/lab/prices') {",
 "        if (req.method === 'PUT' && url.pathname === '/api/lab/album-binding-prices') {\n            return await pb1810SaveAlbumBindingPrices({req,res,pool,labId,bodyJson,sendJson,audit,userId:a.userId});\n        }\n        if (req.method === 'PUT' && url.pathname === '/api/lab/prices') {",
 'authenticated lab tariff route');
write(serverFile,server);
for(const f of [cfile,serverFile])execFileSync(process.execPath,['--check',f],{stdio:'inherit'});
console.log('[R1810] dedicated audience-safe binding tariff writes, legacy print prices preserved');
