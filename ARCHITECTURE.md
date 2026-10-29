# How the demonstration works

## Current execution

Everything executes in the browser. GitHub Pages serves static files; no application server receives interview answers or images.

1. The form creates a project with a stable identifier.
2. The interview module selects questions from nine coverage areas and a bounded set of answer-sensitive follow-ups.
3. Submitted answers become source turns. Moment proposals quote those answers and retain source-turn IDs.
4. The athlete edits and approves moment revisions. The app requires a final approval for the assembled story.
5. Photo selections are read in the browser and associated with moment IDs.
6. IndexedDB stores the project, answers, moments and media. Export produces a user-held JSON backup.
7. The chart module accepts explicit numeric totals and optional weekly records; it does not infer a weekly distribution from totals.

## Intended service architecture

The static prototype demonstrates the workflow, not the full intended agentic service. Production work would replace the deterministic interview with a server-side model adapter and tool-controlled orchestration, and replace browser persistence with Supabase Postgres/Auth/Storage. The service would maintain exact evidence, local and cross-beat summaries, ranked candidate angles, approved revisions, and a source-checked rendering manifest. A separate activity-data adapter could provide measured metrics and source versions.

The model would propose follow-ups and edits. Application transactions would enforce ownership, current revisions and explicit athlete approval. Private source material would not be included in a public story projection. Uploaded images would be sent to a generation service only after a separate user decision.

## Known limits

- No live LLM, semantic claim checker, or external data connector is active.
- Model-output quality cannot be evaluated from the scripted mock alone.
- No login, cloud backup, public story sharing, multi-device sync, or role-based access is present.
- Browser-local data belongs to the browser profile, not an authenticated account.
- Sample data and sample images are synthetic; no claims of actual race records or photographs.
- Story editing is useful for the demo, but not a substitute for production consent and authorization controls.

## Interview coverage

High Level Summary; Personal Context and Why; Event Context; Training and Preparation; Pre-Game / Lead-Up; What the Event Was Like; Completion / Outcome; What Happened After; Reflections.

Coverage is not a mandatory emotional arc. A hiking trip need not be a triumph, a recovery, or a story of friendship. The available answers determine what is included.
