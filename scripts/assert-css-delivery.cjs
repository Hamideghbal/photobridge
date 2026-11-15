'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
// The final performance build replaces individual links with one hashed bundle.
// Keep checking the exact source/version and that the entrypoint loads its bundle.
module.exports=function assertCssDelivery(html,expected){
 if(html.includes(expected))return;
 const manifest=JSON.parse(fs.readFileSync('dist/web/assets/photobridge-boot-manifest.json','utf8'));
 assert(manifest.sources.some(source=>source===expected||source.startsWith(expected+'&')),'missing boot CSS '+expected);
 assert(html.includes('/assets/'+manifest.boot),'entrypoint must load the hashed CSS bundle');
 const bundled=fs.readFileSync('dist/web/assets/'+manifest.boot,'utf8');
 assert(bundled.includes('/* '+expected.split('?')[0].replace(/^\//,'')+' */'),'bundle must contain the declared CSS source '+expected);
};
