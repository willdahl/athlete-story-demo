# Verification record

October 29, 2026.

- 20 automated checks pass: coverage order, differing follow-ups, bounded termination, skipped answers, exact source-linked moments, fixture consistency, conservative training-total extraction, safe chart markup, missing/duplicate weekly records, relative file references, and omission of private transcript metadata from the curated example.
- Browser checks at local preview: create a fresh project, submit two answers, observe answer-dependent follow-up, generate moments early, edit a heading, approve, attach a real local image, preview, final approval, reload/resume with image retained.
- Edit-to-approval race found and fixed by synchronizing input before action handlers. Retested successfully.
- Curated STP package: overview, training dialog/week selection and finish navigation work. Initial map fit corrected to include full route.
- Hiking sample renders supplied training totals and weekly series, with no required photos.

Deployment verification is recorded separately after hosting succeeds. Mock tests do not evaluate live model quality or production authorization.

## Alex-layout viewer update

- 24 automated tests pass, including approved-only rendering, strict coordinate validation, optional supporter panes, and HTML/media safety.
- Browser verified: existing saved stories open in the new viewer; selecting a moment updates the shared panes; source text and training data remain intact; supplied coordinates render numbered map pins; editing geographic context clears approval and blocks preview until approved.
- Desktop layout checked at 988 × 844. The pane grid was corrected to prevent training content from extending beyond the viewport.
- Unlocated stories use a chronological strip, not a fabricated map route. New moments have no supporter pane without explicit supporter context.

## Seeded walkthrough update

31 automated tests pass. Additional coverage verifies independent seed identities, source/media remapping, original seed immutability, exclusion of conversational replies, changed-source-only updates, photo retention, and miles display conversion.

Browser verified: first-5K interview opens prefilled; changing its personal-context answer produces a one-moment before/after comparison; applying leaves that moment unapproved while others remain ready. Alex's preview shows ten original beats, images, synthetic training, and the published route with illustrative markers. No live AI service is implied.

## Live service deployment (October 29, 2026)

39 automated checks pass. Two Supabase migrations applied through the pinned CLI. Initial conflict testing exposed retryable SQLSTATE 40001; corrected to PT409 in a new migration and the exact packaged server source passed all cloud tests. Cloud save/read, owner separation, conflict rejection, private photo uploads and direct public-key denial verified. Local browser confirmed adaptive follow-up, AI drafts, before/after review, manual edit and approval persisted to Supabase. Hosted version 5 deployed successfully; anonymous and forged identity checks pass. Signed-in hosted browser testing awaits user login.

## Shared demo update

Supersedes the account-sign-in behavior above. 40 tests pass. Real Supabase checks pass for anonymous shared saves/reads, photo uploads/reads, stale-write HTTP 409, and direct public-key denial. No guest sessions or additional database migration are required.

Hosted version 6 verified on October 29, 2026: first-5K seed switched to live mode without sign-in, saved to Supabase, and returned a real OpenRouter follow-up grounded in its existing answers. Anonymous API availability and shared story reads return HTTP 200. The follow-up still used a double hyphen despite the editorial prompt; punctuation compliance is not guaranteed by prompting alone.

## Restored training detail

43 tests pass. Browser verified Alex’s training photo/story, metrics, interactive 20-week chart, and week 1 ride cards (34.2, 18.4, 22.1 miles). Weekly values remain collapsed by default. Editing totals preserves the supplied series with independent provenance. Missing session data is not invented.
