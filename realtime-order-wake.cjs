'use strict';
// A visible order must wake its downloader without awaiting finance or sync I/O.
// Caller supplies account-scoped callbacks; never deliver a signal for a stale session.
function signalOrderEvent({account,getAccount,notify,poll,wake,live}) {
 if (!account || getAccount() !== account) return false;
 if (typeof notify === 'function') notify();
 // These operations must never hold up notification/delivery. Errors are isolated.
 for (const action of [wake,poll,live]) {
  if (typeof action !== 'function') continue;
  try { Promise.resolve(action()).catch(()=>{}); } catch { /* retry on next wake */ }
 }
 return true;
}
module.exports={signalOrderEvent};
