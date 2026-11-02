'use strict';
const fontPath='/desktop/ui-assets/vazirmatn.woff2';
function injectNativeFont(html){
 const tags='<link rel="preload" href="'+fontPath+'" as="font" type="font/woff2" crossorigin><style id="pbNativeLocalFont">@font-face{font-family:Vazirmatn;src:url("'+fontPath+'") format("woff2");font-style:normal;font-weight:100 900;font-display:swap}</style>';
 return html.includes('id="pbNativeLocalFont"')?html:html.replace(/<head(?:\s[^>]*)?>/i,head=>head+tags);
}
function patchNativeFontCss(css){
 return css.replace(/@import\s*(?:url\(\s*)?["'](https:\/\/fonts\.googleapis\.com\/[^"']+)["']\s*\)?\s*;/gi,(rule,url)=>{
  try{const families=new URL(url).searchParams.getAll('family');return families.length&&families.every(f=>/^Vazirmatn(?::|$)/.test(f))?'/* Native Vazirmatn is bundled; no remote font import. */':rule;}catch{return rule;}
 });
}
module.exports={fontPath,injectNativeFont,patchNativeFontCss};
