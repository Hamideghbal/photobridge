'use strict';
function patchNavigationHeader(source){
 if(source.includes('PB1572 reconcile header actions'))return source;
 const start="let nav=h.querySelector('.pb1147LabNav');if(!nav){",end='h.append(nav);';
 if(!source.includes(start)||!source.includes(end))return source;
 return source.replace(start,`/* PB1572 reconcile header actions */let nav=h.querySelector('.pb1147LabNav');const pb1572Signature=['.labPrintTopNav','.albumTopNav','.labArchiveHeaderBtn','.labFinanceHeaderBtn'].map(s=>Boolean(h.querySelector(s))).join('|');if(nav&&nav.dataset.pb1572Signature!==pb1572Signature){nav.remove();nav=null;}if(!nav){`).replace(end,'nav.dataset.pb1572Signature=pb1572Signature;h.append(nav);');
}
module.exports={patchNavigationHeader};
