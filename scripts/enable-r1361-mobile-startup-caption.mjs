/**
 * R1361: PWA-only startup handoff. Leave Android/iOS system splash untouched.
 * Show the REAL PhotoBridge aperture/bridge mark at a readable size while
 * the web document is actually empty; disappear as soon as React renders.
 * Do not reuse the stretched cursive/wordmark raster for the caption.
 */
import fs from 'node:fs';
import sharp from 'sharp';
const base='dist/web/';
const original=base+'photobridge-brand-script-r1285.png';
const size=await sharp(original).metadata();
if(size.width!==1254||size.height!==1254||!size.hasAlpha) throw Error('[R1361] authentic logo shape changed; review crop before release');
const crop={left:Math.round(size.width*.078),top:Math.round(size.height*.174),width:Math.round(size.width*.844),height:Math.round(size.height*.423)};
const artWidth=920,artHeight=Math.round(artWidth*crop.height/crop.width);
const {data,info}=await sharp(original).extract(crop).resize(artWidth,artHeight).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(info.channels!==4)throw Error('[R1361] missing original logo alpha');
let visible=0;
for(let i=0;i<data.length;i+=4){
 if(data[i+3]){data[i]=255;data[i+1]=255;data[i+2]=255;visible++;}
}
if(visible<data.length/4*.05)throw Error('[R1361] logo alpha unexpectedly empty');
const symbol='photobridge-mobile-launch-symbol-r1361.png';
await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png({compressionLevel:9}).toFile(base+symbol);

const file=base+'index.html';
let html=fs.readFileSync(file,'utf8');
if(html.includes('pb1479Identity')&&html.includes('photobridge-launch-mark-r1479.png')){
 console.log('[R1361] Current branded mobile startup handoff already present; older splash patch skipped.');
} else {
if(html.includes('<div id="pbAppSplashV780"'))throw Error('[R1361] legacy duplicate splash is back');
const styleId='pbR1361MobileSplashStyle';
const style=`<style id="${styleId}">
#pbR1361MobileSplash{display:none}
@media (display-mode:standalone) and (max-width:820px){
 html:has(#root:empty) #pbR1361MobileSplash{display:flex}
}
html.pbR1361IosStandalone:has(#root:empty) #pbR1361MobileSplash{display:flex}
html.pbR1361Embedded #pbR1361MobileSplash{display:none!important}
#pbR1361MobileSplash{position:fixed;inset:0;z-index:2147483200;box-sizing:border-box;
 align-items:center;justify-content:center;flex-direction:column;gap:10px;
 padding:24px;background:#2674ff;color:#fff;pointer-events:none}
#pbR1361MobileSplash img{width:min(84vw,360px);max-width:100%;height:auto;
 display:block;object-fit:contain;flex:0 0 auto}
#pbR1361MobileSplash span{display:block;white-space:nowrap;text-align:center;
 color:#fff;font-family:Arial,Helvetica,system-ui,sans-serif;font-style:normal;
 font-variant:normal;font-size:clamp(25px,7vw,34px);font-weight:600;
 letter-spacing:-.025em;line-height:1.05;transform:none;text-shadow:none;
 font-stretch:normal}
</style><script id="pbR1361StandaloneBoot">try{if(window!==window.top)document.documentElement.classList.add('pbR1361Embedded');else if(navigator.standalone===true)document.documentElement.classList.add('pbR1361IosStandalone')}catch{}</script>`;
const markup=`<div id="pbR1361MobileSplash" role="status" aria-label="در حال آماده‌سازی PhotoBridge"><img src="/${symbol}" alt="" width="920" height="${artHeight}"><span>PhotoBridge</span></div>`;
html=html.replace(/<style id="pbR1361MobileSplashStyle">[\s\S]*?<\/style><script id="pbR1361StandaloneBoot">[\s\S]*?<\/script>/g,'');
html=html.replace(/<div id="pbR1361MobileSplash"[\s\S]*?<\/div>/g,'');
if(!html.includes('<body><div id="root"></div>'))throw Error('[R1361] expected single React root not found');
html=html.replace('</head>',style+'</head>');
html=html.replace('<body><div id="root"></div>','<body>'+markup+'<div id="root"></div>');
if((html.match(/id="pbR1361MobileSplash"/g)||[]).length!==1)throw Error('[R1361] duplicate startup handoff');
fs.writeFileSync(file,html);
console.log('[R1361] Mobile standalone startup uses enlarged original PhotoBridge mark and a separate white, un-stretched caption.');
}
