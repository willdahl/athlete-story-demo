import {runAgent} from './story-agent.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const uuid=value=>typeof value==='string'&&/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value);
async function db(env,path,options={}){
 const r=await fetch(env.SUPABASE_URL+'/rest/v1/'+path,{...options,signal:AbortSignal.timeout(20000),headers:{apikey:env.SUPABASE_SECRET_KEY,'Content-Type':'application/json',...options.headers}});
 if(!r.ok){const detail=await r.json().catch(()=>({}));if(detail.code==='PT409')throw Object.assign(Error('This story changed in another tab. Reopen it before saving.'),{status:409});throw Error('Cloud storage is not ready or is unavailable. Your browser copy is retained.');}
 return r.status===204?null:r.json();
}
function validateProject(p){
 if(!p||!uuid(p.id)||typeof p.name!=='string'||typeof p.event!=='string'||!Array.isArray(p.turns)||p.turns.length>120||!Array.isArray(p.moments)||p.moments.length>30||!Array.isArray(p.media)||p.media.length>12)throw Object.assign(Error('Invalid story data.'),{status:400});
 if(p.turns.some(t=>typeof t.id!=='string'||typeof t.question!=='string'||typeof t.answer!=='string'||t.answer.length>8000))throw Object.assign(Error('Invalid interview answers.'),{status:400});
 if(JSON.stringify(p).length>650000)throw Object.assign(Error('This story is too large to send. Keep photos in the photo upload step.'),{status:413});
}
async function readBody(request,limit=700000){
 if(Number(request.headers.get('Content-Length'))>limit)throw Object.assign(Error('Request too large.'),{status:413});
 const reader=request.body?.getReader();let total=0;const chunks=[];if(!reader)throw Error('Missing request body.');
 while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>limit){await reader.cancel();throw Object.assign(Error('Request too large.'),{status:413});}chunks.push(value);}
 const data=new Uint8Array(total);let offset=0;for(const c of chunks){data.set(c,offset);offset+=c.length;}return data;
}
export async function handleApi(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/'))return null;
 // Public fictional demo namespace; never expose previously account-scoped stories.
 const owner='shared-fictional-demo-v1';
 const configured=Boolean(env.OPENROUTER_API_KEY&&env.SUPABASE_URL&&env.SUPABASE_SECRET_KEY);
 if(path==='/api/session')return json({liveAvailable:configured,sharedDemo:true,...(env.DIRECT_PHOTOS==='1'?{directPhotos:true}:{})});
 if(!configured)return json({error:'Live services are not configured. Mock mode remains available.'},503);
 if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed.'},405);
 if(request.method==='POST'&&(request.headers.get('Origin')!==url.origin||request.headers.get('X-Story-Request')!=='1'))return json({error:'This request must come from the story app.'},403);
 try{
  const ownerFilter='owner_id=eq.'+encodeURIComponent(owner);
  if(path==='/api/stories'&&request.method==='GET')return json(await db(env,`athlete_stories?${ownerFilter}&select=id,document,version&order=updated_at.desc&limit=100`));
  if(path==='/api/stories'&&request.method==='POST'){
   const {project,version}=JSON.parse(new TextDecoder().decode(await readBody(request)));
   validateProject(project);
   if(!Number.isInteger(version)||version<0) return json({error:'Invalid story version.'},400);
   const next=await db(env,'rpc/save_athlete_story',{method:'POST',body:JSON.stringify({p_owner:owner,p_id:project.id,p_document:project,p_version:version})});
   return json({version:next});
  }
  if(path==='/api/agent'&&request.method==='POST'){
   const {action,project}=JSON.parse(new TextDecoder().decode(await readBody(request)));
   if(!['question','draft'].includes(action))return json({error:'Unknown interview action.'},400);
   validateProject(project);
   if(!await db(env,'rpc/reserve_athlete_ai_call',{method:'POST',body:JSON.stringify({p_owner:owner})}))return json({error:'The shared demo has reached its 40 live requests for today. You can still review, edit and use mock mode.'},429);
   const result=await runAgent(action,project,env);return json(result);
  }
  const photo=path.match(/^\/api\/photos\/([\da-f-]+)\/([\da-f-]+)$/i);
  if(photo&&uuid(photo[1])&&uuid(photo[2])){
   // Use the shared demo namespace; ignore caller-supplied identities.
   const key=[encodeURIComponent(owner),photo[1],photo[2]].join('/');
   const headers={apikey:env.SUPABASE_SECRET_KEY,Authorization:`Bearer ${env.SUPABASE_SECRET_KEY}`};
   if(env.DIRECT_PHOTOS==='1'){
    if(request.method==='GET'){
     const r=await fetch(env.SUPABASE_URL+'/storage/v1/object/sign/athlete-photos/'+key,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:300}),signal:AbortSignal.timeout(20000)});
     if(!r.ok)return json({error:'Photo unavailable.'},404);
     const data=await r.json();
     return new Response(null,{status:302,headers:{Location:env.SUPABASE_URL+'/storage/v1'+data.signedURL,'Cache-Control':'no-store'}});
    }
    const {type,size}=JSON.parse(new TextDecoder().decode(await readBody(request,2000)));
    if(!/^image\/(jpeg|png|webp|gif|avif)$/.test(type||''))return json({error:'Choose a supported image.'},400);
    if(!Number.isInteger(size)||size<=0||size>8*1024*1024)return json({error:'Choose an image up to 8 MB.'},413);
    const r=await fetch(env.SUPABASE_URL+'/storage/v1/object/upload/sign/athlete-photos/'+key,{method:'POST',headers:{...headers,'Content-Type':'application/json','x-upsert':'true'},body:'{}',signal:AbortSignal.timeout(20000)});
    if(!r.ok)throw Error('Could not prepare the photo upload. Your browser copy is retained.');
    const data=await r.json();
    return json({uploadUrl:env.SUPABASE_URL+'/storage/v1'+data.url,url:path});
   }
   if(request.method==='GET'){
    const r=await fetch(env.SUPABASE_URL+'/storage/v1/object/athlete-photos/'+key,{headers,signal:AbortSignal.timeout(20000)});
    if(!r.ok)return json({error:'Photo unavailable.'},404);
    return new Response(r.body,{headers:{'Content-Type':r.headers.get('Content-Type')||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
   }
   const type=request.headers.get('Content-Type');
   if(!/^image\/(jpeg|png|webp|gif|avif)$/.test(type||''))return json({error:'Choose a supported image.'},400);
   const body=await readBody(request,8*1024*1024);
   const r=await fetch(env.SUPABASE_URL+'/storage/v1/object/athlete-photos/'+key,{method:'POST',headers:{...headers,'Content-Type':type,'x-upsert':'true'},body,signal:AbortSignal.timeout(30000)});
   if(!r.ok)throw Error('Photo upload failed. The original is still saved in this browser.');
   return json({url:path});
  }
  return json({error:'Not found.'},404);
 }catch(e){return json({error:e.message||'The service could not complete this request.'},e.status||502);}
}
