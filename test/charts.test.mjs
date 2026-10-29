import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTraining} from '../dist/charts.js';

test('totals remain totals rather than fabricated weekly history',()=>{
 const html=renderTraining({distanceKm:4830,trainingHours:180,trainingDays:75,preparationWeeks:20,source:'athlete_reported'},'cycling');
 assert.match(html,/4,830/);assert.match(html,/75/);assert.match(html,/Athlete-reported/);
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
 assert.match(html,/Week 1: 0 km/);assert.doesNotMatch(html,/NaN|Infinity/);
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
