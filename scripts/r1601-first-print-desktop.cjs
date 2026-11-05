'use strict';
const MARK='/* PB1601 warm first photographer print frame */';
function patchDesktop(nav){
 if(nav.includes(MARK))return nav;
 const start=nav.indexOf(' function open(key,push=true){');
 const end=nav.indexOf(' const utilityPages=',start);
 if(start<0||end<=start)throw Error('R1601 desktop print open function changed');
 let region=nav.slice(start,end);
 const oldHead=' function open(key,push=true){\n  if(selected===key)return;\n  let panel=panels.get(key);if(!panel){';
 const newHead=' function pb1601EnsurePanel(key){\n  let panel=panels.get(key);if(!panel){';
 if(region.split(oldHead).length!==2)throw Error('R1601 desktop print open head not unique');
 region=region.replace(oldHead,newHead);
 const oldMake="panel=document.createElement('section');panel.className='pb1126ContentPanel';panel.dataset.panel=key;";
 if(region.split(oldMake).length!==2)throw Error('R1601 desktop Print section not unique');
 region=region.replace(oldMake,oldMake+"panel.hidden=true;");
 const oldShow='  closePanels();panel.hidden=false;selected=key;';
 const newShow='  return panel;\n }\n function open(key,push=true){\n  if(selected===key)return;\n  const panel=pb1601EnsurePanel(key);\n'+oldShow;
 if(region.split(oldShow).length!==2)throw Error('R1601 desktop Print panel visibility anchor not unique');
 region=region.replace(oldShow,newShow);
 if(!region.includes("frame.src=restoredPrint||")&&!region.includes("frame.src=(key==='store'?"))
   throw Error('R1601 desktop Print iframe startup changed');
 nav=nav.slice(0,start)+region+nav.slice(end);
 const originalRender='  const native=nativeHeader(currentDocument()||document)||nativeHeader(document);if(!native)return;';
 if(nav.split(originalRender).length!==2)throw Error('R1601 desktop main auth render changed');
 nav=nav.replace(originalRender,originalRender+'\n  pb1601ScheduleWarmPrint();');
 const prewarm=[
 ' '+MARK,
 ' let pb1601WarmScheduled=false;',
 ' function pb1601WarmPrint(){',
 "  if(panels.has('print')||selected!==null||document.hidden||",
 "      !/^\\/photographer(?:\\/|$)/.test(location.pathname)||",
 "      !nativeHeader(document))return;",
 '  try{',
 "   const panel=pb1601EnsurePanel('print');",
 '   panel.hidden=true;',
 "   window.PB1601PrintWarmStatus='warming';",
 "   const frame=panel.querySelector('iframe');",
 "   frame?.addEventListener('load',()=>{if(panel.isConnected)window.PB1601PrintWarmStatus='loaded'},{once:true});",
 "  }catch(err){window.PB1601PrintWarmStatus='error';console.warn('[PhotoBridge] Print prewarm failed',err?.message||err)}",
 ' }',
 ' function pb1601ScheduleWarmPrint(){',
 "  if(pb1601WarmScheduled||panels.has('print')||selected!==null)return;",
 '  pb1601WarmScheduled=true;',
 '  setTimeout(()=>{',
 '   const ready=()=>{pb1601WarmScheduled=false;pb1601WarmPrint()};',
 "   if(typeof window.requestIdleCallback==='function')window.requestIdleCallback(ready,{timeout:2500});",
 '   else setTimeout(ready,800);',
 '  },1050);',
 ' }',
 ].join('\n')+'\n';
 const at=nav.indexOf(' function schedule(){');
 if(at<0)throw Error('R1601 desktop schedule anchor missing');
 nav=nav.slice(0,at)+prewarm+nav.slice(at);
 return nav;
}
module.exports={patchDesktop,MARK};