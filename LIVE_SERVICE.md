# Live story service

Status: implemented locally; database migration and hosted activation pending.

The public demo and private GitHub repository retain their existing audiences. The curated Alex story in `dist/stp` is unchanged. Editable seed copies can opt into live mode after Sites sign-in.

## Flow

The supported Sites Vinext server wraps the existing static experience. `/api/session` reports availability and sign-in. Live interview requests use OpenRouter; drafting runs an initial generation followed by a factual/editorial review. Source IDs are validated and evidence is attached verbatim from original answers by code. This establishes traceability, not proof that every interpretation is correct. Users see a proposed replacement before applying it, then approve each moment.

Supabase holds owner-scoped JSON story documents (including interview turns, drafts, moment history, approvals, training figures and photo context). Uploaded images live in a private Storage bucket and are served through authenticated owner-scoped API paths. Images are not sent to the model. Photo context can inform interview questions but is not story evidence until confirmed in an answer.

Cloud writes use optimistic versions. Browser storage remains a recovery copy when cloud saving fails. Mock mode remains browser-local. Cloud photo links in exported JSON require sign-in; export does not currently bundle downloaded cloud image bytes.

## Database installation

`supabase/001_story_service.sql` is the prepared initial migration. It has NOT yet been applied. For CLI operation, initialize/link the project and place this SQL in a timestamped file under `supabase/migrations` before `db push`. Do not apply it through both the dashboard and CLI without reconciling migration history.

The Data API secret cannot run DDL. Deployment requires a database connection or authenticated Supabase management/CLI access. Runtime uses Sites-provided user identity; Supabase browser roles receive no access to these tables. RLS is enabled and direct access is restricted to service_role. The server must filter every record and storage path by verified Sites identity because service_role bypasses RLS.

The migration includes atomic per-user daily request reservations (40 agent requests; drafting uses two model calls). It also creates the private photo bucket. No tables are dropped and no existing stories are deleted.

## Configuration

Keep local credentials in ignored `.env.local` and server `.dev.vars`; production credentials belong in Sites runtime secrets. Never ship these files in public assets or commit them.

Required server variables: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`. The publishable key is not needed by this server-mediated version.

## Local development

- Run `npm test` at the repo root.
- Copy `dist/` into `server/public/` after browser-source changes.
- Use the Sites dependency/build helpers from the server directory.
- Run `npm run dev -- --port 4180` from server for local QA. Local Sites sign-in is simulated; production identity is provided by Sites dispatch.

## Verification completed

- Both configured API credentials returned successful responses.
- 39 automated tests pass, including source validation, rejected unauthorized/cross-origin requests and owner filtering.
- Supported server production build passed.
- Browser QA confirmed photo context persists and appears in the viewer; training defaults to miles.
- A real first-5K interview question, initial draft and seven-moment reviewed draft were generated and source references validated. The reviewed draft still overstated a qualifier (less concerned became not worried); the prompt now explicitly preserves degree and uncertainty, and athlete review remains required. Editorial review caught an unsupported negative assertion, motivating a second model review. Exact source evidence is now retrieved by code rather than reproduced by the model.

## Remaining before publishing

Apply migration; test cloud save/reload and optimistic conflicts, photo upload/private retrieval, and the live question-to-draft-to-approval loop. Configure hosted runtime secrets, migrate the existing Site source to the server build, then deploy and verify production sign-in and ownership. Keep the current public demo in place until these checks pass.
