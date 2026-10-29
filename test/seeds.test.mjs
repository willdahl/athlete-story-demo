import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {instantiateSeed,updateAnswer,proposeUpdate,changeRows} from '../dist/seeds.js';
import {isStoryAnswer,proposeMoments} from '../dist/interview.js';
import {renderJourney,safePhoto} from '../dist/viewer.js';
const alex=JSON.parse(await readFile(new URL('../dist/seeds/alex.json',import.meta.url),'utf8'));
const fivek=JSON.parse(await readFile(new URL('../dist/seeds/first-5k.json',import.meta.url),'utf8'));
test('seed copies have independent identities with intact source and photo associations',()=>{
 const before=JSON.stringify(alex),a=instantiateSeed(alex),b=instantiateSeed(alex);
 assert.notEqual(a.id,b.id);assert.notEqual(a.turns[0].id,b.turns[0].id);
 for(const m of a.moments)assert.ok(m.sourceTurnIds.every(id=>a.turns.some(t=>t.id===id)));
 for(const photo of a.media){assert.ok(a.moments.some(m=>m.id===photo.momentId));assert.ok(safePhoto(photo.dataUrl));}
 a.turns[0].answer='changed';assert.equal(JSON.stringify(alex),before);assert.notEqual(b.turns[0].answer,'changed');
 assert.equal(a.moments.length,10);assert.equal(a.metrics.preparationWeeks,20);assert.equal(a.metrics.trainingDays,75);
});
test('5K retains original conversational replies but never drafts them into story',()=>{
 const p=instantiateSeed(fivek);assert.equal(p.turns.length,12);assert.equal(p.media.length,0);assert.equal(p.moments.length,7);
 assert.ok(p.turns.some(t=>t.answer==='Skip'));assert.ok(p.turns.some(t=>t.answer==='I just did'));
 for(const m of p.moments){assert.doesNotMatch(m.text,/\bSkip\b|I just did|singiths/);assert.ok(m.sourceTurnIds.every(id=>isStoryAnswer(p.turns.find(t=>t.id===id))));}
 assert.equal(p.metrics.distanceKm,undefined);assert.equal(p.metrics.trainingDays,undefined);
});
test('editing one source updates only linked moments and keeps photos, order, and old draft until applied',()=>{
 const p=instantiateSeed(alex),target=p.moments.find(m=>m.navigationLabel==='Celebration'),sourceId=target.sourceTurnIds[1];
 const old=structuredClone(p.moments),photoIds=p.media.map(a=>a.id);
 assert.ok(updateAnswer(p,sourceId,'I was tired and glad to sit with my friends.'));
 const draft=proposeUpdate(p);assert.equal(p.moments.find(m=>m.id===target.id).text,target.text);
 assert.equal(draft.length,old.length);assert.deepEqual(draft.map(m=>m.id),old.map(m=>m.id));
 assert.equal(changeRows(old,draft).length,1);assert.match(draft.find(m=>m.id===target.id).text,/glad to sit/);assert.equal(draft.find(m=>m.id===target.id).approved,false);
 assert.equal(draft[0].text,old[0].text);assert.deepEqual(p.media.map(a=>a.id),photoIds);assert.ok(p.needsRegeneration);
});
test('reviewing a previously excluded reflection creates a new sourced draft',()=>{
 const p=instantiateSeed(fivek),turn=p.turns.find(t=>t.questionId==='reflection');
 updateAnswer(p,turn.id,'I want to cheer for my friends too.','include');const draft=proposeUpdate(p);
 assert.equal(draft.length,8);assert.ok(draft.some(m=>m.text==='I want to cheer for my friends too.'&&m.sourceTurnIds.includes(turn.id)&&!m.approved));
});
test('curated Alex wording is not displayed as a verbatim athlete quotation',()=>{
 const p=instantiateSeed(alex);assert.match(renderJourney(p,p.moments[0].id),/journey-reflection/);assert.match(renderJourney(p),/Published STP course/);
});
test('short conversational commands are excluded without discarding substantive answers',()=>{
 assert.equal(isStoryAnswer({answer:'Skip'}),false);assert.equal(isStoryAnswer({answer:'I just did.'}),false);
 assert.equal(isStoryAnswer({answer:'I skipped breakfast but finished the race.'}),true);
 assert.equal(proposeMoments({id:'p',turns:[{id:'1',questionId:'reflection',answer:'See my answers and help me to draw any insights'}]}).length,0);
});
