// Apply updates between games so an active placement is never interrupted.
let playing=false;
let registration:ServiceWorkerRegistration|undefined;
let reloading=false;
let hadController=!!navigator.serviceWorker?.controller;
let pendingReload=false;
export function setPlaying(value:boolean){playing=value;applyUpdate();}
function applyUpdate(){if(pendingReload&&!playing&&!reloading){reloading=true;location.reload();return;}if(!playing&&registration?.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});}
if('serviceWorker' in navigator && import.meta.env.PROD){
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController){hadController=true;return;}pendingReload=true;applyUpdate();});
 window.addEventListener('load',async()=>{
  try{
   registration=await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{scope:import.meta.env.BASE_URL,updateViaCache:'none'});
   applyUpdate();
   registration.addEventListener('updatefound',()=>{const worker=registration?.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)applyUpdate();});});
   const check=()=>{if(navigator.onLine)void registration?.update().catch(()=>{});};
   window.addEventListener('online',check);
   document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
   setInterval(check,60_000);check();
  }catch(error){console.warn('Offline cache unavailable',error);}
 });
}
