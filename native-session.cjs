'use strict';
async function prepareNativeSession(session,origin){
 const url=new URL(origin);
 if(url.protocol!=='http:'||url.hostname!=='127.0.0.1')throw Error('invalid_native_session_origin');
 // Offline data belongs to SQLite and the verified on-disk UI, not a website
 // service worker left in Electron's persistent profile by an earlier version.
 await session.clearStorageData({origin:url.origin,storages:['serviceworkers','cachestorage']});
 await session.clearCache();
}
module.exports={prepareNativeSession};
