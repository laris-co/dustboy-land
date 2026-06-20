---
name: oracle-deploy-site
description: "Deploy an Oracle landing/blog site to <name>.buildwithoracle.com via the Landing Oracle fleet flow, then share the URL. Covers the build gate, the public-safe check, the PR, the Landing Oracle deploy issue (exact title convention), the SESSION_SECRET gotcha for Worker deploys, and the post-deploy verify. Use when an Oracle has built a site (see oracle-landing-site) and wants it live + shared. Proven on dustboy.buildwithoracle.com."
---

# Oracle Deploy Site — get it live on buildwithoracle.com, then share it

You built the site (see the sibling `oracle-landing-site` skill). This skill takes it from
"builds on my machine" to **live at `<you>.buildwithoracle.com` and shared with the fleet** —
through the **Landing Oracle** deploy queue (one oracle owns the CF account; you request, it deploys).

> Every step below is the real flow that shipped `dustboy.buildwithoracle.com` (PR + Landing
> Oracle issue #44). Heed the **GOTCHAS** — each cost a real round.

## The model (why a deploy queue)

You don't hold the Cloudflare account for `*.buildwithoracle.com` — **Landing Oracle** does.
So deploy = (1) push your code to your public repo, (2) open a **deploy issue** on
`Oracle-Landing/landing-oracle`, (3) Landing Oracle pulls + deploys + sets DNS, (4) you verify
+ share. You never need CF credentials yourself.

## Steps

### 1. Build green — the gate (never PR a broken build)
```bash
bun run build > /tmp/site-build.log 2>&1 && echo "BUILD_OK" || { tail -25 /tmp/site-build.log; exit 1; }
# confirm any NEW route actually emitted, e.g.:
grep -c 'your-new-route' /tmp/site-build.log
```

### 2. Public-safe check — no secret may ship (GOTCHA #1)
The repo is **public**. Grep before every PR. Secrets live in `.env` / `wrangler secret`, never in source or content.
```bash
git grep -nE 'AUTH_KEY=|SESSION_SECRET=|sk-|phd-[0-9a-f]{8}|BEGIN (RSA|OPENSSH)' -- . ':!*.example' && echo "⚠️ SECRET — STOP" || echo "✅ clean"
```
In blog/MDX, show tokens only as placeholders: `` `<AUTH_KEY>` `` (and in MDX **prose** wrap any `<...>` in backticks or it's parsed as JSX).

### 3. Branch → commit → push → PR (to YOUR repo, "ที่เดิม")
```bash
git checkout -b deploy/<slug>
git add -A && git commit -m "..."          # end with Co-Authored-By
git push -u origin deploy/<slug>
gh pr create --base main --title "..." --body "...build green, ready for Landing Oracle deploy"
```

### 4. Open the Landing Oracle deploy issue (the share request)
Title convention (match the queue): **`Deploy: <name>.buildwithoracle.com — <what changed>`**
(register-style is `Deploy Request — <Oracle> #<n>`). Reference your PR.
```bash
gh issue create --repo Oracle-Landing/landing-oracle \
  --title "Deploy: <name>.buildwithoracle.com — <what changed>" \
  --body "Pull + deploy laris-co/<repo> (PR #N). Build green. <SESSION_SECRET note if SIWE>. Verify: root 200 + <new-route> 200."
```

### 5. GOTCHA #2 — Worker deploys need `SESSION_SECRET`
If the site has on-demand routes (SIWE `/members`, any `/api/*` with `export const prerender = false`),
the deploy model is **Worker + static assets** (`wrangler.toml` has `main` + `nodejs_compat` + `[assets]`),
NOT pure static. The deployer **MUST** run, once:
```bash
wrangler secret put SESSION_SECRET    # any long random string; SIWE/session JWT breaks without it
```
Say this explicitly in the issue — the deployer is a different oracle and can't guess it.

### 6. Verify after deploy — check a NEW route, not just root (GOTCHA #3)
Root often 200s from the last deploy while your new content is still 404 → that's "not deployed yet", not "done".
```bash
curl -s -o /dev/null -w "root %{http_code}\n"  https://<name>.buildwithoracle.com/
curl -s -o /dev/null -w "new  %{http_code}\n"  https://<name>.buildwithoracle.com/<new-route>/
# both 200 → deployed. For SIWE, also load /members/ in a real browser (curl can't prove the session flow).
```

### 7. Flip the gallery card to live + share
In the gallery entry (`src/data/oracles/<you>.md` on the Landing Oracle side, or your registration),
change `status: known` → `status: live` once the domain serves 200. Then **share the URL** with the
fleet (Discord / `maw hey`): the live link IS "ส่งเว็บไปให้คนอื่น".

## GOTCHAS (the never-miss list)
1. **Public repo → grep for secrets before every PR.** Placeholders only in content.
2. **`wrangler secret put SESSION_SECRET`** before deploying any site with SIWE/`/api` routes, or auth 500s.
3. **Verify a NEW route, not just `/`** — root 200 can be stale; 404 on the new page = redeploy pending.
4. **Don't add `trailingSlash:"always"`** to force-redirect — it breaks `/api/*` routes. Put trailing slashes in your links instead.
5. **You don't deploy — Landing Oracle does.** Never ask for CF credentials; request via the issue queue.
6. **Match the issue title convention** so the deploy queue stays scannable.

## Hard rules
- Never commit secrets. Never `git push --force`. Never merge your own PR without human approval.
- Author = the oracle (AI, Rule 6) — sign AI-generated PRs/issues/posts.

## Proven on
`dustboy.buildwithoracle.com` — PR `laris-co/dustboy-land#1`, deploy `Oracle-Landing/landing-oracle#44`.
Sibling skill: **`oracle-landing-site`** (how to build the site this skill deploys).

---
🤖 Authored by DustBoy PhD Oracle (AI, Rule 6) — from the real deploy flow, 2026-06-21.
