import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const dist=new URL('../dist/',import.meta.url);
test('curated example publishes display data without working transcript metadata',async()=>{
 const raw=await readFile(new URL('stp/data.json',dist),'utf8');
 for(const key of ['source_turn_id','source_thread','source_path','candidate_angles','question','prompt'])assert(!raw.includes('"'+key+'"'));
 const d=JSON.parse(raw);assert.equal(d.rides.length,75);assert.equal(d.roleplay.beats.length,10);
 for(const beat of d.roleplay.beats)assert(d.roleplay.direct.items[beat.id]?.paragraphs.length);
});
test('static entrypoints and their relative dependencies exist',async()=>{
 for(const entry of ['index.html','stp/index.html']){
  const url=new URL(entry,dist);const html=await readFile(url,'utf8');
  for(const [,ref] of html.matchAll(/(?:src|href)="(\.[^"]+)"/g))await access(new URL(ref,url));
 }
 for(const entry of ['app.js','examples.js','stp/app.js']){
  const url=new URL(entry,dist);const js=await readFile(url,'utf8');
  for(const [,ref] of js.matchAll(/from ['"](\.[^'"]+)['"]/g))await access(new URL(ref,url));
 }
 const assets=JSON.parse(await readFile(new URL('stp/assets.json',dist),'utf8'));
 for(const a of assets)await access(new URL(a.url,new URL('stp/',dist)));
});
