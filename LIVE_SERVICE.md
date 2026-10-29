# Live story service

The hosted app is a shared fictional demo, with no sign-in and no guest sessions. OpenRouter is the only AI provider. Supabase stores live demo stories and photos; anyone visiting can read and edit them. Mock stories remain browser-local. The curated Alex example is unchanged.

## Implementation

The Sites Vinext worker serves the existing browser app and `/api` routes. `/api/session` reports service availability and `sharedDemo: true`, without creating a session. All data routes use the fixed `shared-fictional-demo-v1` namespace, ignoring caller identity headers and owner parameters. Previously account-scoped records are not exposed or migrated.

Runtime credentials remain server-only. Supabase browser roles cannot directly read the database or Storage bucket. The app intentionally exposes shared demo content through server routes. Cross-origin writes are rejected; optimistic version conflicts return HTTP 409. The existing atomic quota now limits the entire shared demo to 40 agent requests per day; drafting uses two model calls per request.

Live questions use the supplied answers. Drafting includes an editorial check, validates source IDs, and attaches exact source answers in code. Users review proposed changes before applying and approving moments. Images are not sent to the model. Photo context can inform questions but must be confirmed in an answer before becoming story evidence.

Browser copies remain available when a cloud save fails. Export contains shared cloud photo links, not downloaded image bytes. This demo has no private-account storage, cross-user separation, or access recovery flow.

## Operations

Credentials belong in ignored `.env.local` / `server/.dev.vars` locally, and Sites runtime secrets in production: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`.

Supabase CLI 2.122.0 is pinned. The initial schema and PT409 conflict migrations are applied. No schema change is required for shared-demo mode. Use `npm run db:plan` before future migrations. The source GitHub repository stays private; the hosted demo remains public.

Run `npm test` and `node --env-file=.env.local scripts/check-cloud.mjs`. The integration check writes a small fictional QA story and image. It verifies shared reads, version conflicts, photo upload/retrieval, and denial of direct public-key table access.

## Hosted checkpoint

Version 6 is deployed at https://athlete-stories-will-demo.cheeky-field-8475.chatgpt.site with source commit `a6af1025759529692b78904b8c6f91eef83c3f0f` and runtime environment revision 1. Hosted browser verification confirmed no-login activation, cloud saving, and a real adaptive OpenRouter question. Forty automated tests and Supabase integration checks passed before deployment.
