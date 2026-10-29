const DATABASE='athlete-stories-recording-v1';
const STORE='projects';
let opening;
function database(){
 if(!globalThis.indexedDB)return Promise.reject(new Error('This browser does not allow local saving. Export your story before closing this page.'));
 if(!opening)opening=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DATABASE,1);
  request.onupgradeneeded=()=>request.result.createObjectStore(STORE,{keyPath:'id'});
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();opening=null;};resolve(db);};
  request.onerror=()=>{opening=null;reject(new Error('Local saving is unavailable. Export your story before closing this page.'));};
  request.onblocked=()=>{opening=null;reject(new Error('Close other demo tabs and try saving again.'));};
 });
 return opening;
}
async function operation(mode,work){
 const db=await database();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,mode);let result;
  const request=work(tx.objectStore(STORE));
  request.onsuccess=()=>{result=request.result;};
  tx.oncomplete=()=>resolve(result);
  tx.onerror=()=>reject(new Error(tx.error?.name==='QuotaExceededError'?'Your browser storage is full. Remove a photo or export your story.':'Could not save changes. Export your story before leaving.'));
  tx.onabort=()=>reject(new Error('Saving was interrupted. Please retry or export your story.'));
 });
}
export async function saveProject(project){
 if(!project||typeof project.id!=='string'||!project.id.trim())throw new Error('A story ID is required to save.');
 const saved=structuredClone({...project,updatedAt:new Date().toISOString()});
 await operation('readwrite',store=>store.put(saved));return saved;
}
export async function loadProject(id){return (await operation('readonly',store=>store.get(id)))??null;}
export async function listProjects(){return (await operation('readonly',store=>store.getAll())).sort((a,b)=>(b.updatedAt||b.createdAt||'').localeCompare(a.updatedAt||a.createdAt||''));}
export async function deleteProject(id){await operation('readwrite',store=>store.delete(id));}
