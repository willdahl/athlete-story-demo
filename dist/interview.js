/**
 * Bounded, deterministic interview simulation for the recording demo.
 * It uses answer-sensitive rules, not a live language model. Source answers are
 * retained verbatim; drafting groups them without inventing paraphrases.
 */
export const INTERVIEW_MODE = 'simulated';

export const COVERAGE = Object.freeze([
  { id: 'summary', label: 'High Level Summary', question: 'What event or accomplishment would you like to remember? Give me the short version of what happened.' },
  { id: 'why', label: 'Personal Context and Why', question: 'What made this matter to you personally? What would help someone understand why you wanted to do it?' },
  { id: 'context', label: 'Event Context', question: 'What should we know about the event itself: the setting, distance, route, or kind of challenge?' },
  { id: 'training', label: 'Training and Preparation', question: 'How did you prepare? Tell me about the training or practice, how long you prepared, and any totals you remember. Estimates are fine.' },
  { id: 'leadup', label: 'Pre-Game / Lead-Up', question: 'What was the lead-up like in the week before, the day before, or the morning of? What stands out about how you felt?' },
  { id: 'experience', label: 'What the Event Was Like', question: 'Take me through the experience. Which highlights or lowlights stand out, how did they unfold, and how did you feel? They do not need to have a bigger meaning.' },
  { id: 'outcome', label: 'Completion / Outcome', question: 'How did it end, and how did that compare with what you had hoped for?' },
  { id: 'after', label: 'What Happened After', question: 'What happened immediately afterward or later on? Was there anything about that time you want to include?' },
  { id: 'reflection', label: 'Reflections', question: 'Looking back now, what would you most want this story to keep? Is there anything you are still making sense of?' },
].map(Object.freeze));

const mainIds = new Set(COVERAGE.map(section => section.id));
const turnsOf = project => Array.isArray(project?.turns) ? project.turns : [];
export function isStoryAnswer(turn){
 if(typeof turn?.answer!=='string'||!turn.answer.trim()||turn.storyUse==='conversation_only')return false;
 const text=turn.answer.trim();
 return !/^(skip|pass|i just did|i just told you|already answered)[.! ]*$/i.test(text)&&!/^see my answers and help me (?:to )?draw (?:any )?(?:insights|singiths)[.! ]*$/i.test(text);
}
const hasAnswer = isStoryAnswer;

/** At most one rule-based follow-up in each of three coverage areas. */
function followupFor(sectionId, answer) {
  if (typeof answer !== 'string' || !answer.trim()) return null;
  if (sectionId === 'why') {
    if (/\b(friend|friends|family|partner|crew|support|supported|team|together)\b/i.test(answer)) {
      return { kind: 'people', text: 'You mentioned other people. What about their involvement mattered to you, if anything?' };
    }
    if (/\b(back|return|returning|again|injury|injuries|illness|break|setback|setbacks)\b/i.test(answer)) {
      return { kind: 'return', text: 'You mentioned time away or a setback. What was it like to prepare for this experience afterward? Share only what you want in the story.' };
    }
    if (/\b(first|new|never)\b/i.test(answer)) {
      return { kind: 'first', text: 'What was it about trying this for the first time that mattered to you?' };
    }
  }
  if (sectionId === 'training') {
    if (/\b\d+(?:\.\d+)?\s*(?:days|weeks|months|miles|kilometres|kilometers|hours)\b/i.test(answer)) {
      return { kind: 'routine', text: 'Beyond those numbers, what was the preparation actually like for you? Was there a particular part of the routine you want to remember?' };
    }
    if (/\b(train|trained|training|practice|practised|practiced|walk|walks|ride|rides|run|runs)\b/i.test(answer)) {
      return { kind: 'preparation', text: 'What part of that preparation felt most relevant once the event began?' };
    }
  }
  if (sectionId === 'experience') {
    if (/\b(friend|friends|family|partner|crew|support|supported|encouraged|cheer|cheering|team|together)\b/i.test(answer)) {
      return { kind: 'exchange', text: 'You mentioned people being part of the experience. Can you describe one exchange or moment with them and how it felt to you?' };
    }
    if (/\b(hard|tough|difficult|pain|painful|tired|exhausted|struggle|struggled|rain|storm|nervous|worried|fear|afraid|low)\b/i.test(answer)) {
      return { kind: 'difficulty', text: 'You mentioned a difficult part. What happened next, and what was that like for you? It is okay if it did not resolve neatly.' };
    }
    if (/\b(happy|joy|fun|beautiful|view|views|proud|excited|highlight|highlights)\b/i.test(answer)) {
      return { kind: 'highlight', text: 'What made that part stand out? Is there a small detail you remember particularly clearly?' };
    }
  }
  return null;
}

/**
 * Returned id is stable for the same source answer. Existing later answers mean
 * a skipped intermediate follow-up will not be inserted retrospectively.
 */
export function getNextQuestion(project) {
  const turns = turnsOf(project);
  for (let index = 0; index < COVERAGE.length; index += 1) {
    const section = COVERAGE[index];
    const main = turns.find(turn => turn.questionId === section.id);
    if (!main) return { id: section.id, coverageId: section.id, text: section.question };
    const followup = followupFor(section.id, main.answer);
    if (!followup) continue;
    const alreadyFollowed = turns.some(turn => typeof turn.questionId === 'string' && turn.questionId.startsWith(section.id + '.followup.'));
    const laterAnswered = COVERAGE.slice(index + 1).some(later => turns.some(turn => turn.questionId === later.id));
    if (!alreadyFollowed && !laterAnswered) {
      return { id: `${section.id}.followup.${followup.kind}`, coverageId: section.id, text: followup.text };
    }
  }
  return null;
}

const groups = [
  { id: 'event', title: 'The experience you chose', sections: ['summary', 'context'] },
  { id: 'why', title: 'Why it mattered to you', sections: ['why'] },
  { id: 'preparation', title: 'Your preparation', sections: ['training'] },
  { id: 'leadup', title: 'Before the start', sections: ['leadup'] },
  { id: 'experience', title: 'What stood out along the way', sections: ['experience'] },
  { id: 'outcome', title: 'How it ended', sections: ['outcome'] },
  { id: 'after', title: 'What happened after', sections: ['after'] },
  { id: 'reflection', title: 'Looking back', sections: ['reflection'] },
];

/**
 * Deterministic draft: every paragraph is an exact supplied answer, with no
 * inferred facts or feelings. Editable headings describe the category only.
 * Re-generating drafts intentionally resets approvals. The UI must let the
 * athlete review before replacing previously edited moments.
 */
export function proposeMoments(project) {
  const turns = turnsOf(project).filter(turn => hasAnswer(turn) && typeof turn.id === 'string' && turn.id);
  const projectId = typeof project?.id === 'string' ? project.id : 'project';
  return groups.flatMap(group => {
    const relevant = turns.filter(turn => {
      const sectionId = typeof turn.questionId === 'string' ? turn.questionId.split('.followup.')[0] : '';
      return mainIds.has(sectionId) && group.sections.includes(sectionId);
    });
    if (!relevant.length) return [];
    return [{
      id: `${projectId}:moment:${group.id}`,
      title: group.title,
      text: relevant.map(turn => turn.answer).join('\n\n'),
      sourceTurnIds: relevant.map(turn => turn.id),
      approved: false,
      revision: 1,
    }];
  });
}

/**
 * Conservative convenience parser for explicitly reported preparation totals.
 * No weekly distribution, pace, calendar conversion, or inferred totals. The
 * interface must keep these figures editable and identify them as reported.
 */
export function extractTrainingMetrics(project) {
  const trainingTurns = turnsOf(project).filter(turn =>
    hasAnswer(turn) && typeof turn.questionId === 'string' &&
    (turn.questionId === 'training' || turn.questionId.startsWith('training.followup.')));
  const candidates = { distanceKm: [], trainingHours: [], trainingDays: [], preparationWeeks: [] };
  const number = '(\\d+(?:,\\d{3})*(?:\\.\\d+)?)';
  const pattern = new RegExp('\\b' + number + '\\s*(?:(total|training)\\s+)?(kilometres?|kilometers?|km|miles?|hours?|hrs?|weeks?|days?)\\b', 'gi');
  const parseNumber = value => Number(value.replaceAll(',', ''));
  for (const turn of trainingTurns) {
    // Split punctuation boundaries, preserving thousands separators and decimal points.
    const clauses = turn.answer.split(/;|\n|,(?!\d{3}\b)|(?<!\d)\.(?!\d)|\.(?!\d)/);
    for (const clause of clauses) {
      const matches = [...clause.matchAll(pattern)];
      for (const match of matches) {
        const before = clause.slice(0, match.index);
        const after = clause.slice(match.index + match[0].length);
        const value = parseNumber(match[1]);
        if (!Number.isFinite(value) || value < 0) continue;
        // Reject ranges, uncertainty between alternatives, and comparative bounds.
        if (/(?:[-−]|\d\s*[-–—]|\d+\s+to|between\s+\d+\s+and|(?:less|more)\s+than|under|over|at\s+(?:least|most)|up\s+to)\s*$/i.test(before) || /^\s*(?:[-–—]\s*\d|to\s+\d)/i.test(after) || /\b(?:or|versus|vs\.?|between)\b/i.test(clause)) continue;
        const unit = match[3].toLowerCase();
        const isWeeks = unit.startsWith('week');
        // Rates and repetition do not establish totals. A duration such as
        // "for 20 weeks" may coexist with a weekly rate without inheriting it.
        const rate = /\b(?:per|each|every|a|an)\s+(?:week|day|month|session|ride|run|walk|hike|workout)\b|\/(?:week|day|month|session)|\b(?:weekly|daily|monthly|times\s+a)\b/i;
        if (!isWeeks && (rate.test(clause) || /\bat\s+a\s+time\b/i.test(clause))) continue;
        if (!isWeeks && /\b(?:longest|shortest|single|typical|average|usual|yesterday|last\s+(?:week|month|ride|run|walk)|one\s+(?:ride|run|walk|hike|session)|(?:rides?|runs?|walks?|hikes?|sessions?)\s+(?:of|was|were))\b/i.test(clause)) continue;
        if (isWeeks && /\b(?:each|every|per|a)\s+(?:year|season)\b/i.test(clause)) continue;
        if (isWeeks && /\b(?:each|every|per)\s*$/i.test(before)) continue;
        let field;
        let converted = value;
        if (/^(?:km|kilomet)/.test(unit)) field = 'distanceKm';
        else if (unit.startsWith('mile')) { field = 'distanceKm'; converted *= 1.609344; }
        else if (/^(?:hour|hr)/.test(unit)) field = 'trainingHours';
        else if (isWeeks) field = 'preparationWeeks';
        else if (unit.startsWith('day')) {
          const explicitTraining = match[2]?.toLowerCase() === 'training' || /\b(?:trained|training\s+(?:on|for)|practiced|practised)\s*(?:for\s+|on\s+)?$/i.test(before) || /^\s+of\s+(?:training|practice)\b/i.test(after);
          if (!explicitTraining || !Number.isInteger(value)) continue;
          field = 'trainingDays';
        }
        if (field) candidates[field].push({ value: converted, turnId: turn.id });
      }
    }
  }
  const result = { source: 'athlete_reported', sourceTurnIds: [] };
  for (const [field, values] of Object.entries(candidates)) {
    if (!values.length) continue;
    const first = values[0].value;
    // Contradicting totals are left for the athlete to resolve, never averaged.
    if (values.some(candidate => Math.abs(candidate.value - first) > 0.000001)) continue;
    result[field] = first;
    result.sourceTurnIds.push(...values.map(candidate => candidate.turnId).filter(Boolean));
  }
  result.sourceTurnIds = [...new Set(result.sourceTurnIds)];
  return result;
}
