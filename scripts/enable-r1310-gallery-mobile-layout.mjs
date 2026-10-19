import fs from 'node:fs';import path from 'node:path';
function patchViewports(dir,required=false){
const legacy=path.join(dir,'photobridge-ui-fixes-v765.js');
if(fs.existsSync(legacy)){let code=fs.readFileSync(legacy,'utf8');
if(!code.includes('const pb1310=window.pb1310PrintGeometry?.(w)')){
 const before='const safeTop=composing?241:181;\n    const bottom=78;';
 if(!code.includes(before))throw Error('R1310 mobile geometry anchor missing');
 code=code.replace(before,'const pb1310=window.pb1310PrintGeometry?.(w);\n    const safeTop=pb1310?.top??(composing?241:181);\n    const bottom=pb1310?.bottom??78;');fs.writeFileSync(legacy,code);
}
}else if(required)throw Error('R1310 missing '+legacy);
for(const name of ['photobridge-v904r100f37-store-header-core.js','photobridge-v904r100f38-header-route-isolation.js','photobridge-v904r100f39-print-actions-cleanup.js']){
 const file=path.join(dir,name);if(!fs.existsSync(file)){if(required)throw Error('R1310 missing '+file);continue;}let source=fs.readFileSync(file,'utf8');if(source.includes('pb1310=window.pb1310PrintGeometry?.(w)'))continue;
 const match=source.match(/,comp=(printComposer|orderComposer)\(\),top=comp\?241:181;/);
 if(!match||!source.includes("bottom:'78px',height:'auto'"))throw Error('R1310 alternate viewport anchor missing: '+name);
 source=source.replace(match[0],`,comp=${match[1]}(),pb1310=window.pb1310PrintGeometry?.(w),top=pb1310?.top??(comp?241:181);`).replace("bottom:'78px',height:'auto'","bottom:`${pb1310?.bottom??78}px`,height:'auto'");fs.writeFileSync(file,source);
}
}
patchViewports('dist/web',true);
const assets=['photobridge-r1310-layout.css','photobridge-r1310-layout.js'];for(const name of assets)if(!fs.existsSync('dist/web/'+name))throw Error('R1310 asset missing '+name);
function pages(dir){if(!fs.existsSync(dir))return;for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())pages(file);else if(item.name.endsWith('.html')){let html=fs.readFileSync(file,'utf8');if(!html.includes('photobridge-r1126-desktop-navigation.js'))continue;const prefix=html.match(/src=["']([^"']*)photobridge-r1126-desktop-navigation\.js/)?.[1]??'/';if(!html.includes('photobridge-r1310-layout.js')){if(!html.includes('</head>'))throw Error('R1310 missing head '+file);html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}photobridge-r1310-layout.css?v=r1310"><script defer src="${prefix}photobridge-r1310-layout.js?v=r1310"></script>\n</head>`);}
 html=html.replace(/(photobridge-(?:ui-fixes-v765|v904r100f3[789]-[^"'<>\s?]+)\.js)([^"'<>\s]*)/g,(_,name,query)=>{const clean=query.replace(/([?&])viewport=[^&]*/g,'$1').replace(/[?&]$/,'');return name+clean+(clean.includes('?')?'&':'?')+'viewport=r1310';});fs.writeFileSync(file,html);if(prefix==='./'||prefix===''){patchViewports(path.dirname(file));for(const name of assets){const destination=path.join(path.dirname(file),name);if(path.resolve(destination)!==path.resolve('dist/web/'+name))fs.copyFileSync('dist/web/'+name,destination);}}
}}}
pages('dist/web');pages('dist/api');console.log('[PhotoBridge R1310] desktop gallery aligned; mobile Print uses measured visible bounds.');
