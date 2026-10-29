# How the service works

## Live execution

The browser experience is served by the supported Sites Vinext worker. Visitors can explore Alex’s completed story, use browser-local mock mode, or use live AI and shared cloud saving without sign-in. No guest sessions are created.

1. A story starts from a short form or an independent seed copy.
2. OpenRouter receives the interview context and generates a focused next question. It can follow up on details or ambiguity rather than following a fixed questionnaire.
3. Drafting proposes meaningful beats, source IDs, standalone/context summaries and candidate angles. A second model pass checks the proposed story against the original answers.
4. Code validates source IDs and attaches exact original answers as evidence. Unknown references are rejected. Evidence tracing does not mechanically verify every semantic claim.
5. Current and proposed wording are compared before applying. Applied drafts require athlete approval. Existing matched moment IDs preserve photos; removed-moment photos can be retagged.
6. Supabase stores a story document in the fixed shared-fictional-demo-v1 namespace, including turns, draft/history data, approvals and training figures. Writes use optimistic versions; stale saves return HTTP 409.
7. Photos upload to a private Supabase Storage bucket. Server routes use the fixed shared demo namespace. Demo photos are available to all visitors through the app. Optional context is saved with the asset. Images are not sent to OpenRouter.
8. The story experience renders approved moments. Training totals create cards; weekly data creates charts. No route or weekly activity is invented.

## Access and secrets

Runtime keys are Sites secrets, never browser assets. Supabase browser roles have no direct access to story tables. RLS is enabled; the server uses service-role access and uses a fixed shared demo filter on every operation. Caller identity headers and owner parameters are ignored. Previous account-scoped records remain inaccessible through these routes. Cross-origin writes are rejected. Agent requests reserve a daily allowance atomically (40 requests across the demo; drafting uses two model calls).

Supabase CLI authentication is only for database administration. There is no user-facing sign-in. Database schema changes live in `supabase/migrations`. SQLSTATE PT409 represents application edit conflicts; retryable serialization codes must not be used for that purpose.

## Mock mode and limits

Mock mode remains deterministic and browser-local. It groups source answers verbatim, preserving reviewed wording for unaffected seeded moments. Neither mode publishes a public story link on approval. Browser recovery copies are browser-profile data. Cloud-photo JSON export contains shared demo links; it is not a self-contained image archive. Activity connectors and generated media are not implemented. Live draft quality still requires athlete review.

## Interview coverage

High Level Summary; Personal Context and Why; Event Context; Training and Preparation; Pre-Game / Lead-Up; What the Event Was Like; Completion / Outcome; What Happened After; Reflections.

These are coverage areas, not a mandatory emotional arc. The athlete’s answers determine the story.
