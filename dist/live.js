let session;
export async function liveSession(){
 try{const r=await fetch('/api/session');if(!r.ok)return {liveAvailable:false};session=await r.json();return session;}catch{return {liveAvailable:false};}
}
async function api(path,body,options={}){
 const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Story-Request':'1',...options.headers},body:options.raw||JSON.stringify(body)});
 const data=await response.json();if(!response.ok)throw Error(data.error||'The live service could not complete this request.');return data;
}
export function agentProject(project){
 return {...project,media:(project.media||[]).map(({dataUrl,...a})=>a),overviewPhoto:undefined,momentHistory:undefined,pendingMomentUpdate:undefined};
}
export async function callAgent(action,project){return api('/api/agent',{action,project:agentProject(project)});}
export async function saveCloud(project){
 const copy=structuredClone(project);
 const state=await liveSession();
 for(const asset of copy.media){
  if(asset.dataUrl?.startsWith('data:image/')){
   const blob=await (await fetch(asset.dataUrl)).blob();
   const path=`/api/photos/${copy.id}/${asset.id}`;
   let result;
   if(state.directPhotos){
    result=await api(path,{type:blob.type,size:blob.size});
    const upload=await fetch(result.uploadUrl,{method:'PUT',headers:{'Content-Type':blob.type},body:blob});
    if(!upload.ok)throw Error('Photo upload failed. The original remains in this browser.');
   }else result=await api(path,null,{headers:{'Content-Type':blob.type},raw:blob});
   if(copy.overviewPhoto===asset.dataUrl)copy.overviewPhoto=result.url;
   asset.dataUrl=result.url;
  }
 }
 const {version}=await api('/api/stories',{project:copy,version:copy.cloudVersion||0});
 return {...copy,cloudVersion:version};
}
export async function cloudStories(){
 const state=await liveSession();if(!state.liveAvailable)return [];
 const response=await fetch('/api/stories');const data=await response.json();if(!response.ok)throw Error(data.error);
 return data.map(row=>({...row.document,cloudVersion:row.version}));
}
