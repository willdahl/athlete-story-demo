import {handleApi} from '../server/lib/story-api.mjs';

// Vercel's Web Standard Node handler reuses the same service as the Sites worker.
export default {
 async fetch(request){
  const url=new URL(request.url);
  const route=url.searchParams.get('route');
  if(url.pathname==='/api/index'&&route){
   url.pathname='/api/'+route;
   url.searchParams.delete('route');
   request=new Request(url,request);
  }
  return await handleApi(request,{...process.env,DIRECT_PHOTOS:'1'})||new Response('Not found',{status:404});
 }
};
