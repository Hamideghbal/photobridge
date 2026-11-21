'use strict';
const fs=require('node:fs'),path=require('node:path'),perf=require('node:perf_hooks');
const TYPES=new Set(['tab_first_paint_ms','tab_first_dom_ms','tab_dom_mutations','stage_first_paint_ms','stage_first_dom_ms','paged_network_ms','paged_memory_hit_ms','stage_proxy_ms','native_api_ms','renderer_longtask_ms','renderer_heap_mb','renderer_cpu_pct','renderer_private_mb']);
const quantile=(values,q)=>{if(!values.length)return null;const a=[...values].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor((a.length-1)*q))]};
function createRecorder({dir,intervalMs=30000,clock=()=>Date.now(),schedule=true}={}){
 const samples=new Map();let priorCpu=process.cpuUsage(),priorAt=clock(),timer=null,loop=null;
 try{loop=perf.monitorEventLoopDelay({resolution:20});loop.enable()}catch{}
 function record(type,value){if(!TYPES.has(type))return false;const n=Number(value);if(!Number.isFinite(n)||n<0||n>60000)return false;let a=samples.get(type);if(!a){a=[];samples.set(type,a)}if(a.length>=512)a.shift();a.push(Math.round(n*10)/10);return true}
 function report(){const now=clock(),cpu=process.cpuUsage(),elapsed=Math.max(1,(now-priorAt)*1000),units=cpu.user-priorCpu.user+cpu.system-priorCpu.system;priorCpu=cpu;priorAt=now;const m=process.memoryUsage(),timings={};for(const [t,a]of samples)timings[t]={count:a.length,p50:quantile(a,.5),p95:quantile(a,.95),max:Math.max(...a)};samples.clear();let p95=null;try{const value=loop.percentile(95)/1e6;p95=Number.isFinite(value)?Math.round(value*10)/10:null;loop.reset()}catch{}return{at:new Date(now).toISOString(),type:'native_perf_30s',mainCpuPct:Math.round(units/elapsed*1000)/10,mainRssMB:Math.round(m.rss/1048576),mainHeapMB:Math.round(m.heapUsed/1048576),mainEventLoopP95Ms:p95,timings}}
 function flush(){const data=report();if(dir){const file=path.join(dir,'lab-performance-'+new Date(clock()).toISOString().slice(0,10)+'.jsonl');void fs.promises.appendFile(file,JSON.stringify(data)+'\n').catch(()=>{})}return data}
 if(schedule){timer=setInterval(flush,intervalMs);timer.unref?.()}
 function stop(){if(timer)clearInterval(timer);try{loop?.disable()}catch{}}
 return{record,report,flush,stop};
}
module.exports={createRecorder,TYPES};
