/* R1967 — Lab archive daily finance (read-only), mobile statuses and manual intake shortcut. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const once=(text,oldValue,newValue,label)=>{
 const count=text.split(oldValue).length-1;
 if(count!==1)throw Error('[R1967] '+label+' anchor count '+count);
 return text.replace(oldValue,newValue);
};
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const apiFile='dist/api/server.js';
let server=fs.readFileSync(apiFile,'utf8');
if(!server.includes('/* PB1967 archive day financial summary, strictly scoped to lab */')){
 const helper=String.raw`
/* PB1967 archive day financial summary, strictly scoped to lab */
function pb1967JalaliArchiveDay(day){
 const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day||''));
 if(!match)return null;
 const jy=Number(match[1]),jm=Number(match[2]),jd=Number(match[3]);
 if(jy<1300||jy>1700||jm<1||jm>12||jd<1||jd>31)return null;
 let gy=jy+621,gm=jm+2;
 if(jm===10)gm=12;
 if(jm===11){gy++;gm=1;}
 if(jm===12){gy++;gm=2;}
 const anchor=Date.UTC(gy,gm-1,15,8),calendar=new Intl.DateTimeFormat('en-US-u-ca-persian',{
  timeZone:'Asia/Tehran',year:'numeric',month:'numeric',day:'numeric'
 });
 for(let n=-48;n<=48;n++){
  const date=new Date(anchor+n*86400000);
  const parts=Object.fromEntries(calendar.formatToParts(date).filter(p=>['year','month','day'].includes(p.type)).map(p=>[p.type,Number(p.value)]));
  if(parts.year===jy&&parts.month===jm&&parts.day===jd)return date.toISOString().slice(0,10);
 }
 return null;
}
`;
 server=once(server,'async function archiveOrdersForLab(',helper+'async function archiveOrdersForLab(','calendar date conversion');
 const anchor="        if (req.method === 'GET' && url.pathname === '/api/lab/archive') {";
 const route=String.raw`
        if(req.method==='GET'&&url.pathname==='/api/lab/archive/day-finance'){
            const day=String(url.searchParams.get('day')||''),gregorian=pb1967JalaliArchiveDay(day);
            if(!gregorian)return sendJson(res,400,{error:'invalid_archive_day'});
            const params=[labId,gregorian];
            const [invoiceQuery,paymentQuery]=await Promise.all([
                pool.query(\`
                  SELECT i.id,i.number,i.total,i.issued_at,
                    COALESCE(NULLIF(o.walkin_customer_name,''),NULLIF(u.name,''),'مشتری آزاد') customer_name,
                    COALESCE((SELECT sum(CASE WHEN fc.correction_kind='invoice_increase' THEN fc.amount WHEN fc.correction_kind='invoice_decrease' THEN -fc.amount ELSE 0 END)
                     FROM finance_corrections fc WHERE fc.lab_id=i.lab_id AND fc.target_type='invoice' AND fc.target_id=i.id),0)::bigint correction
                  FROM invoices i
                  LEFT JOIN orders o ON o.id=i.order_id AND o.lab_id=i.lab_id
                  LEFT JOIN users u ON u.id=i.customer_id
                  WHERE i.lab_id=$1
                    AND i.issued_at>=($2::date::timestamp AT TIME ZONE 'Asia/Tehran')
                    AND i.issued_at<(($2::date+1)::timestamp AT TIME ZONE 'Asia/Tehran')
                  ORDER BY i.issued_at DESC,i.number DESC
                \`,params),
                pool.query(\`
                  SELECT count(*)::int count,COALESCE(sum(amount),0)::bigint total
                  FROM finance_payments
                  WHERE lab_id=$1
                    AND paid_at>=($2::date::timestamp AT TIME ZONE 'Asia/Tehran')
                    AND paid_at<(($2::date+1)::timestamp AT TIME ZONE 'Asia/Tehran')
                \`,params)
            ]);
            const invoices=invoiceQuery.rows.map(row=>({
                id:row.id,number:row.number,customerName:row.customer_name,
                amount:Number(row.total||0)+Number(row.correction||0)
            }));
            return sendJson(res,200,{
                day,invoiceCount:invoices.length,
                invoices,invoiceTotal:invoices.reduce((sum,item)=>sum+item.amount,0),
                paymentCount:Number(paymentQuery.rows[0]?.count||0),
                paymentTotal:Number(paymentQuery.rows[0]?.total||0),
                basis:{invoices:'issued_at',payments:'paid_at',timeZone:'Asia/Tehran'}
            });
        }
`.replaceAll('\\`','`');
 server=once(server,anchor,route+anchor,'read-only authenticated Lab archive finance endpoint');
 fs.writeFileSync(apiFile,server);
}
execFileSync(process.execPath,['--check',apiFile],{stdio:'inherit'});

const asset='assets/index-UIRefine-v655-r84.js';
const jsName='photobridge-r1967-lab-archive-mobile.js';
const cssName='photobridge-r1967-lab-archive-mobile.css';
const onsiteJs='photobridge-r1969-lab-onsite-order.js';
const onsiteCss='photobridge-r1969-lab-onsite-order.css';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/'+asset;
 let ui=fs.readFileSync(file,'utf8');
 const target='onClick:()=>F(be),children:[e.jsx("b",{children:V(fe.day)})';
 const patched='onClick:()=>{F(be);if(t==="lab")window.dispatchEvent(new CustomEvent("pb1967-lab-archive-day",{detail:{day:be,role:t}}))},children:[e.jsx("b",{children:V(fe.day)})';
 if(!ui.includes(patched))ui=once(ui,target,patched,'archive day click in '+root);
 fs.writeFileSync(file,ui);
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 fs.writeFileSync(root+'/'+jsName,fs.readFileSync('scripts/r1967-lab-archive-mobile.js'));
 fs.writeFileSync(root+'/'+cssName,fs.readFileSync('scripts/r1967-lab-archive-mobile.css'));
 fs.writeFileSync(root+'/'+onsiteJs,fs.readFileSync('scripts/r1969-lab-onsite-order.js'));
 fs.writeFileSync(root+'/'+onsiteCss,fs.readFileSync('scripts/r1969-lab-onsite-order.css'));
 execFileSync(process.execPath,['--check',root+'/'+onsiteJs],{stdio:'inherit'});
 let html=fs.readFileSync(root+'/index.html','utf8');
 const link='<link rel="stylesheet" href="/'+cssName+'?v=r1967">';
 const script='<script src="/'+jsName+'?v=r1969" defer></script>';
 const onsiteLink='<link rel="stylesheet" href="/'+onsiteCss+'?v=r1969">';
 const onsiteScript='<script src="/'+onsiteJs+'?v=r1969" defer></script>';
 if(!html.includes(link))html=once(html,'</head>',link+'</head>','mobile/finance CSS '+root);
 if(!html.includes(script))html=once(html,'</body>',script+'</body>','mobile/finance JS '+root);
 if(!html.includes(onsiteLink))html=once(html,'</head>',onsiteLink+'</head>','onsite intake CSS '+root);
 if(!html.includes(onsiteScript))html=once(html,'</body>',onsiteScript+'</body>','onsite intake JS '+root);
 const pattern=/index-UIRefine-v655-r84[.]js[?][^"'\s>]+/g;
 if((html.match(pattern)||[]).length!==1)throw Error('[R1967] bundle URL missing '+root);
 html=html.replace(pattern,url=>url.includes('labDaily=r1968')?url:url.replace(/^([^?]+\?[^&]+)&/,'$1&labDaily=r1968&'));
 fs.writeFileSync(root+'/index.html',html);
 if(root.endsWith('/lab-desktop-ui')){
  const manifestFile=root+'/manifest.json';
  const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
  if(manifest.channel!=='lab'||manifest.protocol!==1||!Array.isArray(manifest.files))throw Error('[R1967] invalid native manifest');
  for(const name of [asset,jsName,cssName,onsiteJs,onsiteCss,'index.html']){
   const bytes=fs.readFileSync(root+'/'+name);
   let row=manifest.files.find(entry=>entry.name===name);
   if(!row){row={name,url:'/lab-desktop-ui/'+name};manifest.files.push(row);}
   row.sha256=sha(bytes);
  }
  manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  manifest.build=sha(JSON.stringify(manifest.files));
  manifest.generatedAt=new Date().toISOString();
  fs.writeFileSync(manifestFile,JSON.stringify(manifest));
 }
}
console.log('[R1967] Lab day-finance API, archive dialog and mobile queue controls installed on web and Windows');
