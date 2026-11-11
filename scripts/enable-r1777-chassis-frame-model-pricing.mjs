/* R1777: separate per-model walk-in prices from colleague tariff. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/api/server.js';
let server=fs.readFileSync(file,'utf8');
function patchWalkin(input){
 const an="import {handleLabPrintCatalog,normalizePrintCatalog,applyPrintRates} from './lab-print-catalog.js';";
 const replace=an.replace("applyPrintRates}","applyPrintRates,applyWalkinPrintRates}");
 if(input.split(an).length!==2)throw Error("catalog import wrong");input=input.replace(an,replace);
 const start=input.indexOf("if (req.method === 'PUT' && url.pathname === '/api/lab/walkin/prices') {");
 const end=input.indexOf("if (req.method === 'PUT' && url.pathname === '/api/lab/prices') {",start+10);
 if(start<0||end<=start)throw Error("walkin segment bounds");
 let sec=input.slice(start,end);
 function one(a,b){if(sec.split(a).length!==2)throw Error("walkin anchor count "+(sec.split(a).length-1));sec=sec.replace(a,b)}
 one("                await c.query('BEGIN');","                await c.query('BEGIN');\n                const sizeIds=rows.map(r=>String(r.sizeId||'')).filter(Boolean);\n                let pb1777Catalog=null;\n                if(rows.some(r=>Object.hasOwn(r,'customRates'))){\n                    const prefs=await c.query('SELECT ui_preferences FROM labs WHERE id=$1 FOR UPDATE',[labId]);\n                    pb1777Catalog=applyWalkinPrintRates(normalizePrintCatalog(prefs.rows[0]?.ui_preferences?.printTariffCatalog),rows,sizeIds);\n                }");
 one("                await c.query('COMMIT');","                if(pb1777Catalog)await c.query(\"UPDATE labs SET ui_preferences=jsonb_set(COALESCE(ui_preferences,'{}'::jsonb),'{printTariffCatalog}',$2::jsonb,true),updated_at=now() WHERE id=$1\",[labId,JSON.stringify(pb1777Catalog)]);\n                await c.query('COMMIT');");
 input=input.slice(0,start)+sec+input.slice(end);
 return input;
}
server=patchWalkin(server);
fs.writeFileSync(file,server);
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('[R1777] walk-in model prices stored separately from colleague prices');
