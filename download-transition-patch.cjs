'use strict';
function patchDownloadTransition(source){if(source.includes('/* PB1530 acknowledged download transition */'))return source;const acknowledgement='   await pb1451AcknowledgeDownload(detail);';if(!source.includes(acknowledgement))return source;
 source=source.replace(acknowledgement,"   /* PB1530 acknowledged download transition */\n   const acknowledgement=await pb1451AcknowledgeDownload(detail);\n   const acknowledgedOrder={...detail.order,...acknowledgement.order};");
 const condition="if(!detail.order.downloaded_at&&!['downloaded','printing','reviewing','ready_print','printed','ready','completed'].includes(String(detail.order.status||'')))";
 if(!source.includes(condition))throw Error('download_transition_condition_incompatible');
 source=source.replace(condition,"if(!['downloaded','printing','reviewing','ready_print','printed','ready','completed'].includes(String(acknowledgedOrder.status||'')))");
 source=source.replace("if(detail.order.mode==='album')await Me('/api/lab/orders/'+le.id+'/album-download-complete',{method:'POST',body:'{}'});else await It(le,'downloaded')","if(acknowledgedOrder.mode==='album')await Me('/api/lab/orders/'+le.id+'/album-download-complete',{method:'POST',body:JSON.stringify({expectedRevision:acknowledgedOrder.document_revision,expectedUpdatedAt:acknowledgedOrder.updated_at})});else await It(acknowledgedOrder,'downloaded')");
 source=source.replaceAll('JSON.stringify({status:"ready"})','JSON.stringify({status:"ready",expectedRevision:le.document_revision,expectedUpdatedAt:le.updated_at})');
 return source;
}
module.exports={patchDownloadTransition};
