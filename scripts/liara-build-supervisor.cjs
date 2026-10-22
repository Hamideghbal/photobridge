'use strict';
// Keep Liara's build-log stream bounded: >100 patch steps also run verbose TAP.
const {spawn}=require('node:child_process');
const readline=require('node:readline');

function runBuild({command=process.execPath,args=['--expose-gc','scripts/liara-fast-build.mjs'],cwd=process.cwd(),env=process.env,progress=console.log,error=console.error,intervalMs=12000}={}){
  return new Promise(resolve=>{
    const recent=[];
    let lastStage='starting',started=Date.now();
    const child=spawn(command,args,{cwd,env,stdio:['ignore','pipe','pipe']});
    const remember=(line,stream)=>{
      const trimmed=String(line).slice(0,2500);
      recent.push(`[${stream}] ${trimmed}`);
      if(recent.length>160)recent.shift();
      if(/^\[PhotoBridge Docker build\] (?:START|OK|FAIL)\b/.test(trimmed)){
        progress(trimmed);
        if(trimmed.includes(' START '))lastStage=trimmed.replace(/^.* START /,'');
      } else if(/^Lab UI release prepared:|^Store UI release prepared:|^\[PhotoBridge Liara Fast Build\] (?:missing|main bundle accepted)/.test(trimmed)){
        progress(trimmed.slice(0,300));
      }
    };
    readline.createInterface({input:child.stdout,crlfDelay:Infinity}).on('line',line=>remember(line,'stdout'));
    readline.createInterface({input:child.stderr,crlfDelay:Infinity}).on('line',line=>remember(line,'stderr'));
    const timer=setInterval(()=>progress(`[PhotoBridge Docker build] running ${Math.round((Date.now()-started)/1000)}s; latest stage: ${lastStage.slice(0,100)}`),intervalMs);
    timer.unref();
    let finished=false;
    const stop=(code,signal,problem)=>{
      if(finished)return;finished=true;
      clearInterval(timer);
      if(problem || code!==0 || signal){
        error(`[PhotoBridge Docker build] FAILED exit=${code===null?'null':code} signal=${signal||'none'} after ${Math.round((Date.now()-started)/1000)}s; last stage: ${lastStage}`);
        if(problem)error(String(problem.stack||problem));
        error('[PhotoBridge Docker build] Recent child output (last 160 lines):');
        for(const line of recent)error(line);
        resolve(code===null?(signal==='SIGKILL'?137:1):(code||1));
      }else{
        progress(`[PhotoBridge Docker build] SUCCESS completed in ${Math.round((Date.now()-started)/1000)}s`);
        resolve(0);
      }
    };
    child.once('error',e=>stop(null,null,e));
    child.once('close',(code,signal)=>stop(code,signal));
    // Propagate Docker shutdown to the worker rather than leaving it running.
    for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>{if(!finished)child.kill(sig);});
  });
}
if(require.main===module)runBuild().then(code=>{process.exitCode=code;});
module.exports={runBuild};
