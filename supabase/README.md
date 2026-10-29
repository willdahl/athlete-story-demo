# Supabase CLI setup

CLI 2.122.0 is pinned in the root package.json. Configuration and migrations are tracked; `.temp`, `.branches`, local environment files and dependencies are ignored.

## One-time authentication (Will's terminal)

```sh
cd /Users/home/projects/community-backed-enablement/sites/athlete-story-demo
npm run db:login
npm run db:link
```

Complete the browser login/verification flow printed by `db:login`. Once it succeeds, run `db:link`. If it requests a database password, enter the Supabase project's Postgres database password at the hidden prompt, not a publishable key or secret API key. Do not put credentials in a command argument, chat or Git. The CLI manages its authentication storage.

Report success or a redacted error back to Codex. No need to run deployment yourself.

## Integration completion

1. `npm run db:migrations` reads migration history.
2. `npm run db:plan` previews pending SQL; explicitly targets project pmxcsvvsdzrzmuokfjhk and skips vault changes.
3. If remote history matches expectations, `npm run db:deploy` applies the migration to that same explicit project.
4. Verify API access boundaries, cloud save/reload, version conflict handling and private photo storage.
5. Configure hosted server secrets, deploy the existing Sites project, and verify the real interview flow.

No local Docker stack is required to authenticate or push to the hosted project. Full local database testing would be a separate setup step. Do not run remote database reset or use migration repair to bypass an unexplained history mismatch.
