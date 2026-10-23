import fs from 'node:fs';
const once=(text,before,after,label)=>{if(text.includes(after))return text;if(text.split(before).length!==2)throw Error('R1365 missing/ambiguous '+label);return text.replace(before,after)};
const main='dist/web/assets/index-UIRefine-v655-r84.js';let bundle=fs.readFileSync(main,'utf8');
if(!bundle.includes('function PB1365LabFeature(')){
 bundle=once(bundle,'"snappbox","site"]),m=()=>','"snappbox","site","desktop"]),m=()=>','settings keys');
 bundle=once(bundle,'["site","سایت اختصاصی"]]','["site","سایت اختصاصی"],["desktop","برنامهٔ ویندوز"]]','settings menu');
 bundle=once(bundle,'g==="site"&&e.jsx(PB1296LabSite,{})','g==="site"&&e.jsx(PB1365LabFeature,{kind:"site"}),g==="desktop"&&e.jsx(PB1365LabFeature,{kind:"desktop"})','settings content');
 bundle=once(bundle,'className:"rowActions adminRowActions",children:[e.jsx("button",{type:"button",onClick:()=>location.assign("/admin/storefront?labId="','className:"rowActions adminRowActions",children:[e.jsx(PB1365LabFeatureAdmin,{labId:q.id}),e.jsx("button",{type:"button",onClick:()=>location.assign("/admin/storefront?labId="','admin lab actions');
 bundle+='\n'+fs.readFileSync('scripts/r1365-components.js','utf8');fs.writeFileSync(main,bundle);
}
let server=fs.readFileSync('dist/api/server.js','utf8');
if(!server.includes('PB1365 optional lab services')){
 server="import {getLabFeatures,handleLabOptionalFeatures} from './lab-optional-features.js';\n"+server;
 server=once(server,'if(await handleLabSiteManagement(req,res,url,a,storefrontDependencies()))return;',`// PB1365 optional lab services: inside the existing authenticated/suspension boundary.
        if(await handleLabOptionalFeatures({req,res,url,a,pool,bodyJson,sendJson,audit,publicOrigin:new URL(PUBLIC_APP_URL).origin}))return;
        if(await handleLabSiteManagement(req,res,url,a,storefrontDependencies()))return;`,'lab feature router');
 server=once(server,'/* PB_R1099_PHOTOGRAPHER_TABS */',`if(url.pathname.startsWith('/api/admin/labs/')&&url.pathname.endsWith('/optional-features')){
        if(await handleLabOptionalFeatures({req,res,url,a,pool,bodyJson,sendJson,audit,publicOrigin:new URL(PUBLIC_APP_URL).origin}))return;
    }
    /* PB_R1099_PHOTOGRAPHER_TABS */`,'admin feature router');
 server=once(server,"if (!eligible.rowCount)\n                return sendJson(res, 403, { error: 'desktop_access_denied' });", "if (!eligible.rowCount)\n                return sendJson(res, 403, { error: 'desktop_access_denied' });\n            if(!(await getLabFeatures(pool,labId))?.desktopEnabled)return sendJson(res,403,{error:'lab_desktop_not_enabled'});",'installer gate');
 // Invoice creation and opening-debt corrections share the same customer lock.
 const start=server.indexOf('async function createOrGetInvoice('),end=server.indexOf('\nasync function ',start+30);
 if(start<0||end<0)throw Error('R1365 invoice function missing');
 const section=once(server.slice(start,end),'const order = oq.rows[0];',"const order = oq.rows[0];\n    await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[labId,String(order.customer_id)]);",'invoice customer lock');
 server=server.slice(0,start)+section+server.slice(end);fs.writeFileSync('dist/api/server.js',server);
}
let html=fs.readFileSync('dist/web/index.html','utf8');
for(const name of ['photobridge-r1137-lab-local-intake.js','photobridge-r1363-lab-queue.js','photobridge-r1363-lab-queue.css'])html=html.replace(new RegExp('('+name.replaceAll('.','\\.')+'\\?v=)[^&"\'\\s]+','g'),'$1r1365');
html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.replace(/&labOptions=[^&"']*/g,'')+'&labOptions=r1365');
if(!html.includes('/photobridge-r1365-lab-polish.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1365-lab-polish.css?v=r1365">\n</head>');
fs.writeFileSync('dist/web/index.html',html);

// Refresh the installer presentation after its component and stylesheet change.
html=html.replace(/(photobridge-r1365-lab-polish\.css\?v=r1365)(?:&installer=r(?:1369|1370|1371|1373|1374|1376|1377))*/g,"$1&installer=r1377");
html=html.replace(/&installerUi=r(?:1369|1370|1371|1373|1374|1376|1377)/g,'').replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,'$1&installerUi=r1377');
fs.writeFileSync('dist/web/index.html',html);
