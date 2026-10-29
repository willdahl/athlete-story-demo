import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/index.mjs';
import {handleApi} from '../server/lib/story-api.mjs';
const env={DIRECT_PHOTOS:'1',OPENROUTER_API_KEY:'secret-model',SUPABASE_URL:'https://db.example',SUPABASE_SECRET_KEY:'secret-db'};
const path='/api/photos/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222';
const request=(body)=>new Request('https://story.example'+path,{method:'POST',headers:{Origin:'https://story.example','X-Story-Request':'1','Content-Type':'application/json'},body:JSON.stringify(body)});
test('Vercel rewrite reaches existing API without sign-in',async()=>{
 const r=await handler.fetch(new Request('https://story.example/api/index?route=session'));
 assert.equal(r.status,200);assert.equal((await r.json()).directPhotos,true);
});
test('direct upload rejects unsupported types and oversized files before signing',async()=>{
 assert.equal((await handleApi(request({type:'image/svg+xml',size:10}),env)).status,400);
 assert.equal((await handleApi(request({type:'image/png',size:9*1024*1024}),env)).status,413);
});
test('direct uploads scope tokens to demo paths and never expose server keys',async()=>{
 const original=globalThis.fetch;let seen;
 globalThis.fetch=async(url,options)=>{seen={url,options};return Response.json({url:'/object/upload/sign/athlete-photos/example?token=scoped-upload'});};
 try{const r=await handleApi(request({type:'image/png',size:6*1024*1024}),env);assert.equal(r.status,200);const data=await r.json();assert.equal(data.url,path);assert.match(seen.url,/shared-fictional-demo-v1/);assert.match(data.uploadUrl,/scoped-upload/);assert.doesNotMatch(JSON.stringify(data),/secret-db|secret-model/);}finally{globalThis.fetch=original;}
});
test('photo delivery redirects rather than proxying large image bodies',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({signedURL:'/object/sign/athlete-photos/example?token=scoped-read'});
 try{const r=await handleApi(new Request('https://story.example'+path),env);assert.equal(r.status,302);assert.match(r.headers.get('Location'),/^https:\/\/db.example\/storage\/v1\/object\/sign\//);assert.equal(await r.text(),'');}finally{globalThis.fetch=original;}
});
