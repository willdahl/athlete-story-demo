# Deploy Athlete Stories on Vercel

Import `https://github.com/willdahl/athlete-story-demo` as a new Vercel project in the intended Pro team.

## Import settings

- Framework preset: Other.
- Root directory: repository root (`./`), not `server`.
- Build command: `npm test`.
- Output directory: `dist`.
- Install command: `npm ci`.
- Use a supported current Node.js runtime (22.x or newer).

`vercel.json` supplies the build settings, `/api/*` rewrite and a 300-second maximum function duration. The static experience is unchanged. `api/index.mjs` adapts the existing service to Vercel's Node Web Standard handler. No Cloudflare/Sites build is needed on Vercel.

## Environment variables

Add these server-only variables before deploying, with values from the local ignored `.env.local` file:

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` = `anthropic/claude-sonnet-4.6`
- `SUPABASE_URL` = `https://pmxcsvvsdzrzmuokfjhk.supabase.co`
- `SUPABASE_SECRET_KEY`

Enable Production. Enable Preview only if you intend previews to access the same shared demo data and quota. Do not use NEXT_PUBLIC or VITE prefixes. No Supabase publishable key is needed for this flow.

Photos upload directly to Supabase using scoped signed URLs. The private bucket still enforces its 8 MB limit and supported image types. Photo GET routes redirect to short-lived signed Supabase URLs so image bodies do not pass through Vercel functions. Existing relative photo URLs remain usable.

## Domain

After the Vercel deployment succeeds, open Settings → Domains and add `athletestories.org`. Optionally add `www.athletestories.org` and redirect it to the apex domain.

DNS was observed at Name.com on October 29, 2026. At the DNS provider, apply the exact A/CNAME/TXT records Vercel shows for this project. Do not copy guessed or generic addresses. Preserve unrelated MX/TXT records, and change only conflicting website records. Wait for Vercel to report Valid Configuration and issue HTTPS.

## Check after deployment

1. `/api/session` returns liveAvailable=true, sharedDemo=true, directPhotos=true.
2. Open Alex’s editable preview and Explore training.
3. Use the first-5K seed for a live question, cloud save, reload and resume.
4. Upload a photo, tag it, and verify it appears after reload.
5. Check the custom domain over HTTPS in a signed-out browser; judges must not hit a Vercel deployment-protection login.

The existing Sites URL remains live separately. Cloud stories share Supabase; browser-only mock copies remain tied to their original domain. Image generation is still not implemented. The GitHub repo is now public, at the owner's request.

## Validation before import

47 automated tests pass. A real Supabase integration check passed for signed upload and redirected photo retrieval. The Vercel deployment itself must be verified after the website import; it has not been deployed by the CLI.
