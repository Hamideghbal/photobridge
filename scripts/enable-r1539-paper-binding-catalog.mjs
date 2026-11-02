import fs from 'node:fs';
const server='dist/api/server.js',ui='dist/web/assets/index-UIRefine-v655-r84.js';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,v)=>fs.writeFileSync(p,v);
function replaceOne(s,a,b,label){if(s.split(a).length!==2)throw Error('R1539 '+label+' changed');return s.replace(a,b)}
let s=read(server);
if(!s.includes('/* PB1539 paper and binding catalogs */')){
 s="import {handleLabPrintCatalog,normalizePrintCatalog,applyPrintRates} from './lab-print-catalog.js';\n/* PB1539 paper and binding catalogs */\n"+s;
 const route="        if (req.method === 'PUT' && url.pathname === '/api/lab/prices') {";
 s=replaceOne(s,route,"        if(await handleLabPrintCatalog({req,res,url,pool,labId,bodyJson,sendJson,audit,userId:a.userId}))return;\n"+route,'catalog route');
 const a=s.indexOf(route),b=s.indexOf("        if (req.method === 'PUT' && url.pathname === '/api/lab/hours')",a);
 if(a<0||b<=a)throw Error('R1539 lab prices endpoint missing');
 let body=s.slice(a,b);
 body=replaceOne(body,"                const sizeIds = rows.map((r) => String(r.sizeId || '')).filter(Boolean);",
  "                const sizeIds = rows.map((r) => String(r.sizeId || '')).filter(Boolean);\n                let pb1539Catalog=null;\n                if(rows.some(r=>r&&Object.hasOwn(r,'customRates'))){\n                    const preferences=await c.query('SELECT ui_preferences FROM labs WHERE id=$1 FOR UPDATE',[labId]);\n                    pb1539Catalog=applyPrintRates(normalizePrintCatalog(preferences.rows[0]?.ui_preferences?.printTariffCatalog),rows,sizeIds);\n                }",'catalog update before rows');
 body=replaceOne(body,"                await syncLabAlbumSizesFromPrintTariffs(c, labId);",
 "                if(pb1539Catalog)await c.query(\"UPDATE labs SET ui_preferences=jsonb_set(COALESCE(ui_preferences,'{}'::jsonb),'{printTariffCatalog}',$2::jsonb,true),updated_at=now() WHERE id=$1\",[labId,JSON.stringify(pb1539Catalog)]);\n                await syncLabAlbumSizesFromPrintTariffs(c, labId);",'atomic persistence');
 s=s.slice(0,a)+body+s.slice(b);
 write(server,s);
}
