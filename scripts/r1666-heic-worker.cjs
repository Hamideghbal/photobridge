'use strict';
const fs=require('node:fs/promises'),{parentPort,workerData}=require('node:worker_threads');
(async()=>{
 const convert=require('heic-convert'),source=await fs.readFile(workerData.input);
 if(source.length>100*1024*1024)throw Error('heic_source_too_large');
 const output=await convert({buffer:source,format:'JPEG',quality:0.98});
 if(!output?.length||output[0]!==255||output[1]!==216)throw Error('invalid_jpeg');
 await fs.writeFile(workerData.output,Buffer.from(output));
 parentPort.postMessage({ok:true});
})().catch(e=>parentPort.postMessage({ok:false,error:String(e?.message||e).slice(0,350)}));
