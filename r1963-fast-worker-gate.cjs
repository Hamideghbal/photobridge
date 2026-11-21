'use strict';
// Native-only; never infer a fast worker from the EXE version alone.
function eligible(source,version){
 if(typeof source!=='string'||!source.includes('pb1908FastArrival')||!source.includes('onOrderArrived'))return false;
 const m=String(version||'').match(/^1\.0\.(\d+)$/);if(!m)return false;
 const n=Number(m[1]);return [104,105,106,108].includes(n)||(n>=117&&n<=999);
}
module.exports={eligible};
