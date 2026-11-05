'use strict';
const MARK='/* PB1601 same active lab enters print without reloading its React page */';
function patchActiveLabEntry(js){
 if(js.includes(MARK))return js;
 const old='if(String(S)===String((a==null?void 0:a.activeLabId)||"")){location.assign("/photographer/orders/flow?workspace=print");return}';
 const replacement='if(String(S)===String((a==null?void 0:a.activeLabId)||"")){'+
   'if(String((t==null?void 0:t.id)||"")!==String(S)){location.assign("/photographer/orders/flow?workspace=print");return}'+
   'const pb1601Target=new URL("/photographer/orders/flow?workspace=print",location.origin);'+
   'if(new URLSearchParams(location.search).get("pbDesktopContent")==="1")pb1601Target.searchParams.set("pbDesktopContent","1");'+
   'history.pushState(null,"",pb1601Target.pathname+pb1601Target.search);'+
   'window.dispatchEvent(new PopStateEvent("popstate"));return}';
 if(js.split(old).length!==2)throw Error('R1601 selected-lab entry anchor changed');
 js=js.replace(old,replacement);
 return js+'\n'+MARK+'\n';
}
module.exports={patchActiveLabEntry,MARK};