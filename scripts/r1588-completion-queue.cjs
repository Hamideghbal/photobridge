'use strict';

/**
 * Serialize only the final server acknowledgement; preserve concurrent S3 PUTs.
 * A temporary 502/503/504/429 or failed fetch can safely retry confirmation for
 * JPEG originals using the SAME fileId. Never re-PUT or re-presign a file.
 * Non-JPEG print conversion is not auto-retried because an upstream timeout
 * may leave that expensive conversion still processing on the server.
 */
function PB1588makeCompletionQueue({complete, assertActive, sleep, maxRetries=2}) {
  if(typeof complete!=='function'||typeof assertActive!=='function'||typeof sleep!=='function')
    throw new TypeError('completion queue requires complete/assertActive/sleep functions');
  if(!Number.isInteger(maxRetries)||maxRetries<0||maxRetries>3)
    throw new RangeError('invalid completion retry count');
  let tail=Promise.resolve();
  const safeJpeg=file=>{
    const type=String(file?.type||'').toLowerCase();
    const name=String(file?.name||'');
    return type==='image/jpeg'||type==='image/jpg'||/\.jpe?g$/i.test(name);
  };
  const transient=error=>{
    const status=Number(error?.status||0);
    if([429,502,503,504].includes(status))return true;
    return !status && /^(TypeError|NetworkError)$/i.test(String(error?.name||'')) &&
      /fetch|network|connection/i.test(String(error?.message||''));
  };
  return function verify(fileId,file) {
    const task=tail.then(async()=>{
      assertActive();
      for(let n=0;n<=maxRetries;n++){
        assertActive();
        try { return await complete(fileId, file); }
        catch(error){
          if(n===maxRetries||!safeJpeg(file)||!transient(error))throw error;
          await sleep(700*(2**n));
        }
      }
    });
    // A failed confirmation never poisons the queue for other already-started
    // uploads. The original caller still receives the same rejection.
    tail=task.then(()=>{},()=>{});
    return task;
  };
}
module.exports={PB1588makeCompletionQueue};
