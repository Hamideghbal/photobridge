const mobileFiles=['photobridge-v904r100f40-mobile-polish.js','photobridge-ui-fixes-v755.js'];
function verifyCompactAssets({page,app,mobile,header}){
 const scripts=[...page.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(match=>match[1]);
 const checks={entry:page.includes('printRecovery=r1858'),primary:app.includes('PB1858resume'),photoStates:app.includes('pb1858PhotoState'),noDuplicateQueue:!app.includes("className:'pb1854File'"),mobile:mobile.includes('syncPrintActions'),header:header.includes('syncPrintActions'),referencedVersions:scripts.filter(url=>mobileFiles.some(file=>url.includes(file))).every(url=>url.includes('printActions=r1858'))};
 if(Object.values(checks).some(value=>!value))throw Error('Live compact mobile actions mismatch: '+JSON.stringify(checks));
 return checks;
}
module.exports={verifyCompactAssets};
