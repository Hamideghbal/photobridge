'use strict';
// Display connectivity independently from the completion of bulk synchronization.
// null = not yet confirmed; false = known transport failure; true = verified connection.
function connectionStatus({network,online,paused=false,signedIn=true,error=null,startupProbeFailed=false,transportOffline=false}){
 if(network===false||transportOffline)return false;
 if(!signedIn||paused)return null;
 if(online===true)return true;
 if(startupProbeFailed||error==='internet_offline'||error==='server_unavailable')return false;
 return null;
}
function connectionLabel(value){return value===true?'آنلاین · متصل به اینترنت':value===false?'آفلاین · بدون اتصال به اینترنت':'در حال بررسی اتصال';}
module.exports={connectionStatus,connectionLabel};
