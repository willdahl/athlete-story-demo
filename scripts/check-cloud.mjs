// Explicit integration check: creates a small synthetic QA story and image.
// Run with node --env-file=.env.local scripts/check-cloud.mjs.
import assert from 'node:assert/strict';
import {handleApi} from '../server/lib/story-api.mjs';
const id=crypto.randomUUID(),asset=crypto.randomUUID(),owner='qa-'+crypto.randomUUID();
const env=process.env;
const nativeFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{console.log("Checking",options.method||"GET",new URL(url).pathname);const r=await nativeFetch(url,{...options,signal:AbortSignal.timeout(20000)});console.log("HTTP",r.status);return r;};
const p={id,name:'Integration check',event:'Synthetic QA story',turns:[],moments:[],media:[],mode:'live'};
const request=(path,method='GET',body,as=owner,type='application/json')=>new Request('https://test.example'+path,{method,headers:{'oai-authenticated-user-id':as,Origin:'https://test.example','X-Story-Request':'1','Content-Type':type},body:body===undefined?undefined:type==='application/json'?JSON.stringify(body):body});
let r=await handleApi(request('/api/stories','POST',{project:p,version:0}),env);assert.equal(r.status,200,await r.clone().text());assert.equal((await r.json()).version,1);
r=await handleApi(request('/api/stories'),env);assert.ok((await r.json()).some(row=>row.id===id));
r=await handleApi(request('/api/stories','GET',undefined,owner+'-other'),env);assert.ok((await r.json()).some(row=>row.id===id));
r=await handleApi(request('/api/stories','POST',{project:{...p,event:'Saved revision'},version:1}),env);assert.equal((await r.json()).version,2);
r=await handleApi(request('/api/stories','POST',{project:p,version:1}),env);assert.equal(r.status,409);
const photo=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7N0AAAAASUVORK5CYII=','base64');
r=await handleApi(request(`/api/photos/${id}/${asset}`,'POST',photo,owner,'image/png'),env);assert.equal(r.status,200,await r.clone().text());
r=await handleApi(request(`/api/photos/${id}/${asset}`),env);assert.equal(r.status,200);assert.equal((await r.arrayBuffer()).byteLength,photo.length);
r=await handleApi(request(`/api/photos/${id}/${asset}`,'GET',undefined,owner+'-other'),env);assert.equal(r.status,200);
r=await fetch(env.SUPABASE_URL+'/rest/v1/athlete_stories?select=id',{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY}});assert.ok([401,403].includes(r.status),'Public key must not read stories');
console.log('PASS: cloud save/reload, shared anonymous access, optimistic conflicts, shared demo photo upload/retrieval and public-key access denial.');
