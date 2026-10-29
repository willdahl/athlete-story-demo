import test from 'node:test';
import assert from 'node:assert/strict';
import { COVERAGE, getNextQuestion, proposeMoments } from '../dist/interview.js';
import { createExample } from '../dist/examples.js';

const answer = (p, text) => {
  const q = getNextQuestion(p);
  assert(q);
  p.turns.push({ id: 'turn-' + p.turns.length, questionId: q.id, question: q.text, answer: text });
  return q;
};

test('coverage uses the nine agreed areas in order', () => {
  assert.deepEqual(COVERAGE.map(c => c.id), ['summary', 'why', 'context', 'training', 'leadup', 'experience', 'outcome', 'after', 'reflection']);
});

test('different athlete answers select relevant follow-ups without assuming support', () => {
  const withWhy = why => ({ id: 'p', turns: [{ id: 't1', questionId: 'summary', answer: 'A ride.' }, { id: 't2', questionId: 'why', answer: why }] });
  assert.match(getNextQuestion(withWhy('My friends were part of why I wanted to do it.')).id, /people$/);
  assert.match(getNextQuestion(withWhy('I was returning after an injury.')).id, /return$/);
  assert.match(getNextQuestion(withWhy('It was my first attempt.')).id, /first$/);
  const neutral = getNextQuestion(withWhy('I wanted a day outside.'));
  assert.equal(neutral.id, 'context');
  assert.doesNotMatch(neutral.text, /friend|setback|injury/i);
});

test('simulation terminates within twelve turns even when every follow-up rule matches', () => {
  const p = { id: 'p', turns: [] };
  while (getNextQuestion(p)) {
    assert(p.turns.length < 12);
    answer(p, 'My friends supported me through a hard first ride after 8 weeks of training.');
  }
  assert.equal(p.turns.length, 12);
});

test('skips advance coverage and do not create empty moments', () => {
  const p = { id: 'p', turns: [] };
  while (getNextQuestion(p)) answer(p, '');
  assert.equal(p.turns.length, 9);
  assert.deepEqual(proposeMoments(p), []);
});

test('moments preserve exact answer text, references, and stable ids', () => {
  const p = { id: 'athlete', turns: [] };
  answer(p, '<script>alert(1)</script> This is my exact answer.');
  answer(p, 'I wanted a day outside.');
  answer(p, 'The route was a loop.');
  const first = proposeMoments(p), second = proposeMoments(p);
  assert.deepEqual(first, second);
  assert.equal(first.length, 2);
  assert.equal(first[0].text, p.turns[0].answer + '\n\n' + p.turns[2].answer);
  for (const moment of first) {
    assert.equal(moment.approved, false);
    assert.equal(moment.text, moment.sourceTurnIds.map(id => p.turns.find(t => t.id === id).answer).join('\n\n'));
  }
});

test('all substantive coverage and follow-ups survive drafting within eight moments', () => {
  const p = { id: 'p', turns: [] };
  while (getNextQuestion(p)) answer(p, 'My friends supported my first attempt after 8 weeks of training.');
  const moments = proposeMoments(p);
  assert.equal(moments.length, 8);
  assert.deepEqual(moments.flatMap(m => m.sourceTurnIds).sort(), p.turns.map(t => t.id).sort());
});

test('examples are fresh, complete, explicitly fictional and have consistent chart totals', () => {
  for (const kind of ['cycling', 'hiking']) {
    const p = createExample(kind), other = createExample(kind);
    assert.notEqual(p.id, other.id);
    assert.equal(p.turns.length, 9);
    assert.equal(getNextQuestion(p), null);
    assert.equal(p.moments.length, 8);
    assert.equal(p.metrics.source, 'synthetic_fixture');
    assert.equal(p.provenance, 'fictional_sample');
    assert.equal(p.metrics.distanceKm, p.metrics.weekly.reduce((sum, w) => sum + w.distanceKm, 0));
    assert.equal(p.metrics.trainingHours, Math.round(p.metrics.weekly.reduce((sum, w) => sum + w.hours, 0) * 10) / 10);
    p.turns[0].answer = 'Changed';
    assert.notEqual(p.turns[0].answer, other.turns[0].answer);
  }
  assert.match(createExample('hiking').moments.find(m => m.id.endsWith(':outcome')).text, /did not reach/);
});

const { extractTrainingMetrics } = await import('../dist/interview.js');
const reported = answer => ({ turns: [{ id: 'training-source', questionId: 'training', answer }] });
test('explicit training totals are extracted with exact miles conversion and source attribution', () => {
  const metrics = extractTrainingMetrics(reported('20 weeks, 75 training days, 3,000 miles, 186 hours'));
  assert.equal(metrics.preparationWeeks, 20);
  assert.equal(metrics.trainingDays, 75);
  assert.equal(metrics.distanceKm, 3000 * 1.609344);
  assert.equal(metrics.trainingHours, 186);
  assert.equal(metrics.source, 'athlete_reported');
  assert.deepEqual(metrics.sourceTurnIds, ['training-source']);
  assert.equal(metrics.weekly, undefined);
});
test('per-week and per-session claims do not become total distance or hours', () => {
  for (const text of ['20 miles each week', '20 miles per week', '20 miles a week', '20 miles weekly', '2 hours every ride', '2 hours per session', 'My longest ride was 40 miles', 'One hike took 8 hours', 'My average run was 5 km']) {
    const metrics = extractTrainingMetrics(reported(text));
    assert.equal(metrics.distanceKm, undefined, text);
    assert.equal(metrics.trainingHours, undefined, text);
  }
  assert.equal(extractTrainingMetrics(reported('20 miles each week for 20 weeks')).preparationWeeks, 20);
});
test('missing numbers, ranges, calendar days, and conflicting totals remain unspecified', () => {
  assert.deepEqual(extractTrainingMetrics(reported('I walked when I could.')), { source: 'athlete_reported', sourceTurnIds: [] });
  for (const text of ['100 miles; 100 km', '20-30 miles', 'between 20 and 30 miles', '100 or 200 miles', '100 to 200 miles', '-20 miles']) {
    assert.equal(extractTrainingMetrics(reported(text)).distanceKm, undefined, text);
  }
  assert.equal(extractTrainingMetrics(reported('Over 40 days I walked often.')).trainingDays, undefined);
  assert.equal(extractTrainingMetrics(reported('I trained 18 days.')).trainingDays, 18);
});
test('only training evidence supplies inferred metrics and conflicting revisions are not merged', () => {
  assert.equal(extractTrainingMetrics({ turns: [{ questionId: 'outcome', answer: '100 miles in 8 hours' }] }).distanceKm, undefined);
  const p = reported('100 km');
  p.turns.push({ id: 'another', questionId: 'training.followup.routine', answer: 'I think it was 200 km' });
  assert.equal(extractTrainingMetrics(p).distanceKm, undefined);
});
