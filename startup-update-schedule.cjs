'use strict';
// Automatic UI checks are non-critical work. Manual update commands bypass this scheduler.
function createStartupUpdateSchedule({ready,foreground,busy,run,delay=2500,now=Date.now,setTimer=setTimeout,clearTimer=clearTimeout}){
 let timer=null,stopped=false,lastStarted=null;
 function schedule(){
  if(stopped||!ready()||!foreground()||timer!==null)return false;
  if(lastStarted!==null&&now()-lastStarted<60000)return false;
  timer=setTimer(()=>{
   timer=null;
   if(stopped||!ready()||!foreground()||busy())return;
   lastStarted=now();
   void Promise.resolve().then(run).catch(()=>{});
  },delay);
  timer?.unref?.();
  return true;
 }
 function stop(){stopped=true;if(timer!==null)clearTimer(timer);timer=null}
 return {schedule,stop};
}
module.exports={createStartupUpdateSchedule};
