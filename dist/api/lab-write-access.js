// Shared policy: expiry limits mutations; history reads and renewal stay available.
export function labWriteAccess(lab, now=Date.now()) {
 if(!lab)return {allowed:false,reason:'lab_inactive'};
 if(lab.suspended)return {allowed:false,reason:'lab_suspended'};
 if(lab.active!==true)return {allowed:false,reason:'lab_inactive'};
 for(const [key,before] of [['active_from',true],['active_until',false]]){
  if(lab[key]!=null){const t=Date.parse(lab[key]);if(!Number.isFinite(t))return {allowed:false,reason:'subscription_unverified'};if(before?now<t:now>=t)return {allowed:false,reason:before?'subscription_not_started':'subscription_expired'};
  }
 }
 return {allowed:true,reason:null};
}
export function labWriteExempt(method, pathname){
 if(['GET','HEAD','OPTIONS'].includes(method))return true;
 // Account renewal and local-device presence are not new lab business.
 return /^\/api\/lab\/subscription(?:\/|$)/.test(pathname)||['/api/lab/download-device','/api/lab/storage-target','/api/lab/activation-request','/api/lab/print-alert/presence','/api/lab/storage-target/hello','/api/lab/storage-target/activate'].includes(pathname);
}
