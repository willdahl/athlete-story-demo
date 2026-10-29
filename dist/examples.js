import { COVERAGE, proposeMoments } from './interview.js';

const cycling = {
  name: 'Robin · cycling sample', event: 'My first 100 km ride', activity: 'cycling', date: '2026-09-12',
  why: 'I wanted to find out whether I could finish a longer ride without turning it into a race.',
  answers: [
    'I finished my first 100 km ride. I had expected to be happiest about the distance, but I keep remembering the last stretch with my sister beside me.',
    'I usually ride short loops near home. I wanted to try something longer, and to do it at a pace that felt like mine. My sister offered to join me for the final ten kilometres.',
    'It was a club ride on a signed 100 km loop, with two food stops. There was no finishing-time target for me. These are fictional event details for this sample.',
    'I prepared over eight weeks, riding on 24 days. Some rides fitted into lunch breaks and the long ones took most of Saturday morning. I remember being pleased when a familiar hill stopped feeling like the whole ride.',
    'The night before, I checked my bag twice. I was nervous about the distance and annoyed at myself for being nervous. In the morning I was mostly relieved to have something practical to do: fill bottles and get to the start.',
    'At the second food stop I was tired and quiet. A rider asked whether I wanted company for the next section. We talked about ordinary things for a while. Later my sister joined me, and we laughed at how little I wanted to talk on the hills.',
    'I finished. I was slower than I had pictured, and I was happy that I had stayed with my own pace. My sister took a photo of us with our bikes afterward.',
    'We sat on the grass and ate the sandwiches we had brought. That evening I sent the photo to a friend who had helped me plan the training. I was already noticing how much of the day I wanted to tell them about.',
    'I want to remember both the distance and how ordinary the help felt. People made room for me without making it a big production. I would like to do the same when someone else tries a longer ride.',
  ],
  weeklyDistances: [42, 55, 68, 62, 80, 95, 108, 120],
  weeklyHours: [2.4, 3, 3.5, 3.2, 4, 4.8, 5.2, 5.9],
  trainingDays: 24,
};
const hiking = {
  name: 'Ellis · hiking sample', event: 'A day on the ridge trail', activity: 'hiking', date: '2026-09-20',
  why: 'I wanted a long day outside with a friend, somewhere beyond our usual local walks.',
  answers: [
    'We planned to reach the ridge, but turned around when the rain made the exposed section feel wrong for us. It was still a full day outside, and there are parts of it I am glad we had.',
    'My friend and I had been talking about doing a longer hike for months. We wanted time together without watching the clock. Reaching the ridge mattered to me, but it was not the only reason we went.',
    'Our planned route was an out-and-back hike with a steep final section. We carried food and extra layers and agreed we could turn around. This is a fictional trail outing, not route or safety guidance.',
    'For six weeks I added a longer walk at weekends and used the stairs near work. I trained on 18 days. I was learning how the pack felt after an hour rather than trying to get faster.',
    'We checked the forecast and talked about the possibility of turning around. I packed an extra pair of socks. On the drive I was excited, and I was hoping the weather would hold longer than it did.',
    'There was a sheltered section where we could hear water below the trees. We stopped talking for a bit. Higher up the rain became harder, and neither of us liked the exposed section ahead. We talked it through and decided to go back.',
    'We did not reach the ridge. I was disappointed, even though I agreed with the decision. I appreciated that my friend did not try to turn it into an inspirational moment. We simply started walking down.',
    'We changed into dry clothes at the car and found somewhere warm to eat. We talked about the quiet section in the trees and about coming back another time, without setting a date.',
    'I want the story to leave room for the disappointment. I also want to remember that we had a good day together. I do not need to decide yet whether the next trip should be the same route.',
  ],
  weeklyDistances: [8, 10, 13, 11, 16, 18],
  weeklyHours: [2.5, 3, 3.5, 3.1, 4.5, 5.4],
  trainingDays: 18,
};

export function createExample(kind = 'cycling') {
  const sample = kind === 'hiking' ? hiking : cycling;
  const now = new Date().toISOString();
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const id = `sample-${sample.activity}-${random}`;
  const project = {
    id, revision: 1, name: sample.name, event: sample.event, activity: sample.activity,
    date: sample.date, why: sample.why, turns: [], moments: [], media: [],
    metrics: {
      distanceKm: sample.weeklyDistances.reduce((sum, n) => sum + n, 0),
      trainingHours: Math.round(sample.weeklyHours.reduce((sum, n) => sum + n, 0) * 10) / 10,
      trainingDays: sample.trainingDays, preparationWeeks: sample.weeklyDistances.length,
      weekly: sample.weeklyDistances.map((distanceKm, index) => ({ week: index + 1, distanceKm, hours: sample.weeklyHours[index] })),
      source: 'synthetic_fixture',
    },
    stage: 'review', finalApproved: false, createdAt: now,
    isExample: true, provenance: 'fictional_sample',
  };
  project.turns = COVERAGE.map((section, index) => ({
    id: `${id}:turn:${section.id}`, questionId: section.id,
    question: section.question, answer: sample.answers[index], createdAt: now,
  }));
  project.moments = proposeMoments(project);
  if (sample.activity === 'cycling') {
    project.media = [
      { id: `${id}:media:preparation`, momentId: `${id}:moment:preparation`, filename: 'Generated cycling illustration', type: 'image/png', dataUrl: 'assets/sample-cycling.png', provenance: 'generated_illustration' },
      { id: `${id}:media:finish`, momentId: `${id}:moment:outcome`, filename: 'Generated finish illustration', type: 'image/png', dataUrl: 'assets/sample-finish.png', provenance: 'generated_illustration' },
    ];
  }
  return project;
}
