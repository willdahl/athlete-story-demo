import test from 'node:test';
import assert from 'node:assert/strict';
import {storyModel,renderJourney,locationOf,safePhoto} from '../dist/viewer.js';
const project={name:'Rider',event:'My ride',why:'My own reason',activity:'cycling',moments:[{id:'one',title:'The start',text:'I began alone.',approved:true,sourceTurnIds:['t']},{id:'two',title:'Private draft',text:'Do not display',approved:false}],turns:[{id:'t',questionId:'why',answer:'I began alone.'}],media:[],metrics:{}};
test('only approved moments and their images appear; absent geography is never invented',()=>{const html=renderJourney(project);assert.match(html,/Journey moments/);assert.match(html,/locations not added/);assert.doesNotMatch(html,/Do not display|Private draft|journey-map"/);assert.equal(storyModel(project).points.length,0);});
test('coordinates must be finite numeric latitude and longitude, including valid zero',()=>{assert.deepEqual(locationOf({latitude:0,longitude:0}),[0,0]);for(const m of [{latitude:91,longitude:0},{latitude:0,longitude:181},{latitude:'47',longitude:0},{latitude:NaN,longitude:0},{latitude:47}])assert.equal(locationOf(m),null);});
test('a moment gets a supporter pane only from explicit supplied context',()=>{assert.doesNotMatch(renderJourney(project,'one'),/supporter-pane/);const p=structuredClone(project);Object.assign(p.moments[0],{supportText:'My friend was waiting.',supportName:'Jo',latitude:47,longitude:-122});const html=renderJourney(p,'one');assert.match(html,/supporter-pane/);assert.match(html,/My friend was waiting/);assert.match(html,/journey-map/);assert.deepEqual(storyModel(p).points[0].position,[47,-122]);});
test('user copy and media cannot inject markup or remote images',()=>{const p=structuredClone(project);p.moments[0].text='<script>oops</script>';p.name='<img src=x>';const html=renderJourney(p,'one');assert.doesNotMatch(html,/<script>|<img src=x>/);assert.match(html,/&lt;script&gt;/);assert.equal(safePhoto('https://example.com/private.jpg'),'');assert.equal(safePhoto('javascript:alert(1)'),'');});

test('training detail preserves photo, chart and ride history and does not invent missing sessions',async()=>{
 const {readFile}=await import('node:fs/promises');const {renderTrainingDetail}=await import('../dist/viewer.js');
 const p=JSON.parse(await readFile(new URL('../dist/seeds/alex.json',import.meta.url)));p.trainingSessions=JSON.parse(await readFile(new URL('../dist/stp/data.json',import.meta.url))).rides;
 const html=renderTrainingDetail(p,1);assert.match(html,/20 weeks of showing up/);assert.match(html,/<img/);assert.match(html,/training-sessions/);assert.match(html,/2026-02-21/);assert.match(html,/data-training-week/);
 const sparse={name:'Test',moments:[],turns:[],media:[],metrics:{trainingDays:3}};assert.doesNotMatch(renderTrainingDetail(sparse),/<svg|training-sessions/);
});
