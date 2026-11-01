'use strict';
const marker='/* PB1530 website verified-download stage revision */';
function patchSiteDownloadTransition(source){
 if(source.includes(marker))return source;
 const start=source.indexOf('Vn=async(le,options={})=>');
 const end=start<0?-1:source.indexOf(',un=async le=>',start);
 if(start<0||end<0)throw Error('r1530_site_download_handler_not_found');
 let handler=source.slice(start,end);
 const once=(from,to)=>{
  if(handler.split(from).length!==2)throw Error('r1530_incompatible_anchor:'+from.slice(0,80));
  handler=handler.replace(from,to);
 };
 once('   await pb1451AcknowledgeDownload(detail);',
  '   '+marker+'\n   const acknowledgement=await pb1451AcknowledgeDownload(detail);\n   const acknowledgedOrder={...detail.order,...(acknowledgement?.order||{})};');
 once("if(!detail.order.downloaded_at&&!['downloaded','printing','reviewing','ready_print','printed','ready','completed'].includes(String(detail.order.status||'')))",
  "if(!['downloaded','printing','reviewing','ready_print','printed','ready','completed'].includes(String(acknowledgedOrder.status||'')))");
 once("if(detail.order.mode==='album')await Me('/api/lab/orders/'+le.id+'/album-download-complete',{method:'POST',body:'{}'});else await It(le,'downloaded')",
  "if(acknowledgedOrder.mode==='album')await Me('/api/lab/orders/'+le.id+'/album-download-complete',{method:'POST',body:JSON.stringify({expectedRevision:acknowledgedOrder.document_revision,expectedUpdatedAt:acknowledgedOrder.updated_at})});else await It(acknowledgedOrder,'downloaded')");
 return source.slice(0,start)+handler+source.slice(end);
}
module.exports={patchSiteDownloadTransition,marker};
