'use strict';
const stages=new Set(['printing','reviewing','needs_fix','designing','ready_print','printed','binding','ready','completed']);
function invoiceStageRequest(method,path,body={}){
 if(!['PATCH','PUT','POST'].includes(method))return null;
 const match=path.match(/^\/api\/lab\/orders\/([^/]+)(?:\/album-stage)?$/);
 if(!match||!stages.has(body.stage||body.status))return null;
 return{orderId:match[1],stage:body.stage||body.status};
}
function requiresInvoice(detail){return detail?.order?.invoice_required!==false&&!detail?.invoice?.id&&!detail?.order?.invoice_id;}
module.exports={invoiceStageRequest,requiresInvoice};
