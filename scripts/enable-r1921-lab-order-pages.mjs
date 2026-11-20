import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const serverFile='dist/api/server.js',marker='/* PB1921 LAB ORDER PAGE */';
let s=fs.readFileSync(serverFile,'utf8');
if(!s.includes(marker)){
 const anchor="if (labOrder && req.method === 'DELETE')";
 if(s.split(anchor).length!==2)throw Error('R1921 authenticated lab-order API anchor changed; refuse to inject unscoped pagination');
 const addition=`// ${marker}
            if (req.method === 'GET' && url.pathname === '/api/lab/orders/page') {
                const {labOrderPage}=await import('./lab-order-pages.cjs');
                let pageResult;
                try {
                    pageResult=await labOrderPage(pool,labId,{
                        page:url.searchParams.get('page')||'1',
                        tab:url.searchParams.get('tab')||'flow',
                        mode:url.searchParams.get('mode')||'print',
                        search:url.searchParams.get('search')||''
                    });
                } catch(error) {return sendJson(res,error.status||500,{error:error.message||'order_page_failed'});}
                return sendJson(res,200,pageResult);
            }
            `;
 s=s.replace(anchor,addition+anchor);
 fs.writeFileSync(serverFile,s);
}
execFileSync(process.execPath,['--check',serverFile],{stdio:'inherit'});
console.log('R1921 lab orders page endpoint present');
