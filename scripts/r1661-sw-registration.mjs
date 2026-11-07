/* R1667: preserve earlier worker URL revisions while attaching invoice overlay revision.
   This helper works on prebuilt and already-revised registration URLs. */
export function withInvoiceServiceWorkerRevision(source) {
  const swAssignment=/(\bconst\s+SW\s*=\s*)(['"])(\/photobridge-sw-v710\.js(?:\?[^'"\r\n]*)?)\2(\s*;)/g;
  const matches=[...source.matchAll(swAssignment)];
  if(matches.length!==1)throw Error('R1661 SW registration count '+matches.length);
  return source.replace(swAssignment,(_match,prefix,quote,rawUrl,suffix)=>{
    const question=rawUrl.indexOf('?');
    const path=question<0?rawUrl:rawUrl.slice(0,question);
    const query=question<0?'':rawUrl.slice(question+1);
    const params=query.split('&').filter(value=>value&&!/^invoiceModal=/.test(value));
    params.push('invoiceModal=r1661');
    return prefix+quote+path+'?'+params.join('&')+quote+suffix;
  });
}
