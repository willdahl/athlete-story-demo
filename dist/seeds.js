import {proposeMoments,isStoryAnswer} from './interview.js';
export const SEEDS=[{id:'alex',title:'Make your version of Alex’s story',description:'The original roleplay, reviewed moments, training ledger, and illustrations. Start anywhere and make your own copy.'},{id:'first-5k',title:'Build the first-5K story',description:'A mock interview about becoming a runner, unexpected cheering, and returning that support. No photos or training totals yet.'}];
export function instantiateSeed(template,stage='interview'){
 const p=structuredClone(template),id=crypto.randomUUID(),now=new Date().toISOString();
 const turnIds=new Map(p.turns.map((t,i)=>[t.id,`${id}:turn:${i}`]));
 const momentIds=new Map(p.moments.map((m,i)=>[m.id,`${id}:moment:seed-${i}`]));
 p.turns=p.turns.map(t=>({...t,id:turnIds.get(t.id)}));
 p.moments=p.moments.map(m=>({...m,id:momentIds.get(m.id),sourceTurnIds:m.sourceTurnIds.map(id=>turnIds.get(id)),approvalOrigin:'seed'}));
 p.media=p.media.map((a,i)=>({...a,id:`${id}:media:${i}`,momentId:momentIds.get(a.momentId)}));
 p.trainingMomentId=momentIds.get(p.trainingMomentId);
 p.overviewSourceTurnIds=(p.overviewSourceTurnIds||[]).map(id=>turnIds.get(id));
 Object.assign(p,{id,revision:1,sample:true,stage,createdAt:now,finalApproved:false,sourceChanges:{},seedBaseline:true});
 if(!p.moments.length)p.moments=proposeMoments(p).map(m=>({...m,approved:true,approvalOrigin:'seed'}));
 p.seedBaselineMoments=structuredClone(p.moments);
 return p;
}
export async function loadSeed(key,stage){
 if(!SEEDS.some(s=>s.id===key))throw Error('Unknown walkthrough.');
 const response=await fetch(`./seeds/${key}.json`);if(!response.ok)throw Error('Could not load this walkthrough.');
 return instantiateSeed(await response.json(),stage);
}
export function updateAnswer(project,id,answer,storyUse){
 const turn=project.turns.find(t=>t.id===id);if(!turn)return false;
 const nextUse=storyUse??turn.storyUse;
 if(turn.answer===answer&&turn.storyUse===nextUse)return false;
 project.sourceChanges||={};project.sourceChanges[id]||={answer:turn.answer,storyUse:turn.storyUse};
 turn.answer=answer;turn.storyUse=nextUse;
 project.needsRegeneration=true;project.finalApproved=false;delete project.pendingMomentUpdate;
 for(const m of project.moments)if(m.sourceTurnIds.includes(id))m.approved=false;
 // A curated overview must not silently retain claims from an edited source.
 if(project.overviewSourceTurnIds?.includes(id))delete project.overviewText;
 return true;
}
export function proposeUpdate(project){
 const changed=new Set(Object.keys(project.sourceChanges||{}));
 if(!changed.size)return proposeMoments(project);
 const existing=project.moments||[],covered=new Set(existing.flatMap(m=>m.sourceTurnIds));
 const proposed=existing.flatMap(m=>{
  if(!m.sourceTurnIds.some(id=>changed.has(id)))return [structuredClone(m)];
  const turns=m.sourceTurnIds.map(id=>project.turns.find(t=>t.id===id)).filter(isStoryAnswer);
  if(!turns.length)return [];
  return [{...structuredClone(m),text:turns.map(t=>t.answer).join('\n\n'),sourceTurnIds:turns.map(t=>t.id),approved:false,revision:(m.revision||1)+1,narrativeFormat:'verbatim',sourceKind:'interview_answers',edited:false}];
 });
 const uncovered=project.turns.filter(t=>changed.has(t.id)&&!covered.has(t.id));
 for(const m of proposeMoments({...project,turns:uncovered}))proposed.push({...m,id:`${project.id}:moment:added-${crypto.randomUUID()}`});
 return proposed;
}
export function changeRows(before,after){
 const ids=new Set([...before.map(m=>m.id),...after.map(m=>m.id)]);
 return [...ids].map(id=>({before:before.find(m=>m.id===id),after:after.find(m=>m.id===id)})).filter(r=>!r.before||!r.after||r.before.text!==r.after.text||r.before.title!==r.after.title);
}
