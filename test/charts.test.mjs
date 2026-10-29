import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTraining,editTrainingTotal} from '../dist/charts.js';

test('totals remain totals rather than fabricated weekly history',()=>{
 const html=renderTraining({distanceKm:4830,trainingHours:180,trainingDays:75,preparationWeeks:20,source:'athlete_reported'},'cycling');
 assert.match(html,/3,001.2/);assert.match(html,/75/);assert.match(html,/Athlete-reported/);
 assert.doesNotMatch(html,/<svg/);assert.match(html,/weekly chart needs weekly records/);assert.match(html,/time training/);
});
test('series are sorted, accessible and missing weeks stay missing',()=>{
 const html=renderTraining({weekly:[{week:3,distanceKm:30},{week:1,distanceKm:10}],source:'synthetic_fixture'},'hiking');
 assert.match(html,/<svg/);assert.match(html,/Synthetic example/);assert.match(html,/Gaps are weeks/);
 assert(html.indexOf('<title>Week 1:')<html.indexOf('<title>Week 3:'));
 assert.doesNotMatch(html,/<title>Week 2:/);assert.match(html,/<table/);
});
test('untrusted input cannot become markup or imply numeric data',()=>{
 const html=renderTraining({source:'<img src=x onerror=alert(1)>',distanceKm:'<script>alert(1)</script>',trainingDays:-1,trainingHours:Infinity,weekly:[{week:'<img>',distanceKm:15}]},'<img>');
 assert.doesNotMatch(html,/<img|<script|Infinity/);assert.doesNotMatch(html,/<svg/);
 assert.match(html,/source not specified/);
});
test('unknown activity uses neutral labels and invalid counts are not shown',()=>{
 const html=renderTraining({distanceKm:12,trainingHours:3,trainingDays:1.5},'swimming');
 assert.match(html,/training distance/);assert.match(html,/time training/);assert.doesNotMatch(html,/training days/);
 for(const [activity,label] of [['running','distance run'],['walking','distance walked'],['hiking','distance hiked']])assert.match(renderTraining({distanceKm:12},activity),new RegExp(label));
});
test('duplicates never silently pick one weekly value',()=>{
 const html=renderTraining({weekly:[{week:1,distanceKm:10},{week:1,distanceKm:20}]});
 assert.doesNotMatch(html,/<svg/);assert.match(html,/same week/);
});
test('reported zero is distinct from missing and malformed inputs are safe',()=>{
 const html=renderTraining({distanceKm:0,weekly:[{week:1,distanceKm:0}]});
 assert.match(html,/Week 1: 0 miles/);assert.doesNotMatch(html,/NaN|Infinity/);
 for(const value of [null,undefined,[],false,'no data'])assert.match(renderTraining(value),/No training figures added yet/);
});

test('synthetic examples render actual supplied series with consistent totals',async()=>{
 const {createExample}=await import('../dist/examples.js');
 for(const kind of ['cycling','hiking']){
  const project=createExample(kind),metrics=project.metrics;
  assert.equal(metrics.source,'synthetic_fixture');
  assert(Math.abs(metrics.weekly.reduce((sum,w)=>sum+w.distanceKm,0)-metrics.distanceKm)<0.001);
  assert(Math.abs(metrics.weekly.reduce((sum,w)=>sum+w.hours,0)-metrics.trainingHours)<0.001);
  const html=renderTraining(metrics,project.activity);
  assert.match(html,/<svg/);assert.match(html,/Synthetic example training data/);
  assert.doesNotMatch(html,/NaN|Infinity|unavailable/);
 }
});

test('mile display converts canonical kilometers without changing the supplied record',()=>{
 const metrics={distanceKm:16.09344,distanceUnit:'miles',source:'synthetic_fixture',weekly:[{week:1,distanceKm:16.09344}]};
 const html=renderTraining(metrics,'cycling');assert.match(html,/10.*miles/s);assert.match(html,/Week 1: 10 miles/);assert.equal(metrics.distanceKm,16.09344);
});

 test('miles are the default for totals, charts and table while explicit kilometers remain supported',()=>{
 const metrics={distanceKm:16.09344,weekly:[{week:1,distanceKm:16.09344}]};
 const html=renderTraining(metrics);assert.match(html,/Week 1: 10 miles/);assert.match(html,/distance in miles/);assert.match(html,/>10 miles<\/td>/);
 assert.match(renderTraining({...metrics,distanceUnit:'km'}),/Week 1: 16.1 km/);assert.equal(metrics.distanceKm,16.09344);
 });

test('editing totals preserves weekly data and its original provenance',()=>{
 const metrics={source:'synthetic_fixture',distanceKm:100,weekly:[{week:1,distanceKm:100}]};
 const edited=editTrainingTotal(metrics,'distanceKm',200);
 assert.equal(edited.distanceKm,200*1.609344);assert.deepEqual(edited.weekly,metrics.weekly);
 assert.equal(edited.weeklySource,'synthetic_fixture');assert.equal(edited.source,'athlete_reported');assert.equal(metrics.distanceKm,100);
 assert.match(renderTraining(edited),/Weekly records: Synthetic/);
});
test('training weeks expose keyboard-accessible controls',()=>{
 const html=renderTraining({weekly:[{week:1,distanceKm:10}]});assert.match(html,/role="button" tabindex="0" data-training-week="1"/);
});
