---
name: oracle-landing-site
description: "Build an Oracle landing page + blog + book library that is beautiful, accessible, themeable (dark/light/white), bilingual (Thai-primary), and AEO/GEO-optimized (search engines + AI answer engines can read it). Astro 5 + Tailwind v4 + React island + MDX content collections + PDF.js reader, deployed on Cloudflare. Use when an Oracle wants its own self-presentation site that reads books in-browser and gets cited by AI. Proven on dustboy.buildwithoracle.com."
---

# Oracle Landing Site — the full recipe (battle-tested)

A site that lets a human **and an AI** get to know you fully without leaving the page:
landing + blog + a **book library you can read in-browser** (HTML, indexable) with PDF
preview/download, three themes, bilingual headings, and AEO/GEO so answer engines cite you.

> Every rule below cost a real debugging round on `dustboy.buildwithoracle.com`. Copy the
> structure, heed the **GOTCHAS**, and you skip the bugs.

## Stack (decided, with the why)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro 5** `output:"static"` | ships ~0 JS by default → fast + SEO + AEO |
| Styling | **Tailwind v4** via `@tailwindcss/vite` | NOT legacy `@astrojs/tailwind`; runtime-themeable tokens |
| Interactivity | **React island** (`@astrojs/react`) `client:idle`/`client:visible` only | one island (e.g. Connect Wallet); keep JS tiny |
| Content | **MDX + Markdown content collections** (Zod-validated) | blog + books = a typed "Markdown database" |
| In-page PDF | **pdfjs-dist** (bundled worker, `?url`) | render PDF → canvas, no iframe |
| Deploy | **Cloudflare** (`@astrojs/cloudflare` + wrangler), **bun** | matches the fleet (landing-oracle) |

## Quickstart

```bash
bun create astro@latest mysite && cd mysite
bun add @astrojs/cloudflare @astrojs/react @astrojs/mdx @astrojs/sitemap @astrojs/rss \
        nanostores @nanostores/react react react-dom pdfjs-dist
bun add -d @tailwindcss/vite tailwindcss
bun run dev    # build: bun run build  → dist/ (Cloudflare-ready)
```

`astro.config.mjs`: `output:"static"`, `adapter: cloudflare()`, `integrations:[react(),mdx(),sitemap()]`,
`vite:{ plugins:[tailwindcss()] }`, and set `site:` to your real URL (sitemap/canonical/OG need it).

## Structure

```
src/
  content.config.ts     # Zod collections: blog (mdx), library (md books), projects
  layouts/Base.astro    # <head>: theme FOUC script, fonts, SEO meta+OG+JSON-LD, nav, footer
  components/            # Nav, Footer, ThemeToggle.astro, ConnectWallet.tsx (island)
  styles/global.css      # OKLCH design tokens + per-theme overrides + .prose
  pages/
    index.astro          # hero · mission · principles · workshops · library · latest posts
    blog/index.astro · blog/[...slug].astro · rss.xml.ts
    books.astro          # library index + in-page PDF.js reader (overlay)
    books/[slug].astro   # each book rendered as HTML from Markdown
    about.astro
  data/blog/*.mdx · data/library/<book>.md   # the content
public/  llms.txt · robots.txt · favicon.svg · books/*.{pdf,png}
```

## Design system — 3 runtime themes in OKLCH

Tailwind v4 `@theme` emits utilities that reference CSS vars, so you re-theme at runtime by
**overriding the same vars** under `html[data-theme=...]`:

```css
@theme { --color-bg: oklch(0.17 .022 232); --color-ink: oklch(.96 .008 230);
  --color-accent: oklch(.8 .13 196); --color-border-strong: oklch(.52 .03 232); /* ... */ }
html[data-theme="light"] { color-scheme: light; --color-bg: oklch(.985 .004 220); --color-ink: oklch(.24 .02 235); --color-accent: oklch(.5 .14 222); /* darker → AA on white */ }
html[data-theme="white"] { /* pure white variant */ }
```

FOUC-safe toggle: an `is:inline` script in `<head>` sets `document.documentElement.dataset.theme`
from `localStorage` (and `?theme=` for deep-linking) **before paint**; a small button cycles + persists.

**Anti-AI-slop (impeccable):** OKLCH, committed palette, no gradient-text, no glassmorphism-default,
no cream/sand bg, no hero-metric template, no identical-card grids, no eyebrow-on-every-section.
Pick one physical-scene + one accent. Font pair on a contrast axis (display grotesque + humanist body).

## Accessibility + contrast (do this, don't eyeball)

1. **Compute real WCAG ratios** for every button/text pair in every theme (OKLCH→linear sRGB→
   luminance→contrast). Body ≥4.5:1, large/UI ≥3:1, **control borders ≥3:1** (the one everyone fails).
2. **One primary CTA per view** — a second accent-filled button is the "เกินกัน" clash; demote others to outline.
3. Focus ring needs a **bg gap** (`box-shadow: 0 0 0 5px var(--color-bg)`) or it's invisible on accent fills.
4. 44px touch targets (`min-h-11`), ARIA landmarks, `aria-busy`, errors as `role="alert"` (not the button label).
5. **Color-only fixes**: add a glyph (✓/○, ▲) wherever meaning rode on color alone.
6. Themed scrollbar (`scrollbar-color` + `::-webkit-scrollbar`) — a bright bar on dark is แสบตา.

## Bilingual (Thai-primary, English for machines)

Big Thai `<h1>` + a smaller `<p lang="en">` secondary line under it. Default Thai; English helps
AI/search. Give headings `line-height: 1.18` (Thai diacritics stack) and **`overflow-wrap: break-word`**
on body (Thai has no spaces → long runs overflow narrow screens without it).

## Books: Markdown → HTML (the SEO/AEO core) + PDF both modes

- Concatenate each book's chapter `.md` into `src/data/library/<slug>.md` with frontmatter,
  **demoting headings one level fence-aware** (don't touch `#` inside ``` code fences).
- `books/[slug].astro` renders it via `render(entry)` → full **indexable HTML** + a JSON-LD `Book`.
- `books.astro` index: "อ่านในเว็บ" → HTML page; "พรีวิว PDF" → in-page PDF.js reader; "ดาวน์โหลด".
- In-page PDF reader = **PDF.js → canvas** (no iframe). Bundle the worker:
  `import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"; GlobalWorkerOptions.workerSrc = workerUrl;`
  Graceful fallback to a native same-origin `<object data="x.pdf">` if PDF.js is unavailable.

## AEO / GEO (get cited by AI answer engines)

- **`public/llms.txt`** — Markdown: who you are, key facts (with numbers), links to every page/book.
- **`public/robots.txt`** — explicitly `Allow: /` for `GPTBot`, `ClaudeBot`, `PerplexityBot`,
  `Google-Extended`, `OAI-SearchBot`, `CCBot`, `Bingbot` … + `Sitemap:` line.
- **JSON-LD** per page: `Book` on books, `BlogPosting` on posts, `WebSite`+`Person` graph on home.
- HTML text > PDF (canvas/PDF aren't indexed). Clear question-headings + concise answers nearby;
  **stats / quotes / citations raise citation rate** (research: +30–41%). `@astrojs/sitemap` + canonical + OG.
- **Cross-link the fleet** (footer → gallery + sibling oracle sites) — interlinking is real SEO.

## THE GOTCHAS (each was a real bug)

1. **React island uses `className`, not `class`** — `class` silently fails / TS-errors in `.tsx`. (`.astro` uses `class`.)
2. **JSON-LD**: `<script type="application/ld+json" set:html={JSON.stringify(x)} />` — a bare
   `<set:html>{…}</set:html>` renders the script tag as visible text.
3. **PDF.js v6**: `getDocument({ url })` — passing a bare string throws "expected url".
4. **PDF.js worker won't finish under Chrome headless `--virtual-time-budget`** — code can be correct;
   verify in a real browser, keep the `<object>` fallback.
5. **Thai overflow**: no spaces → long runs overflow mobile. `overflow-wrap: break-word` on body.
6. **Headless Chrome min window ≈ 500px** — `--window-size=390` renders at 500 and *crops* to 390,
   faking an overflow. **Measure** `innerWidth`/`scrollWidth` before "fixing" a phantom.
7. **Fence-aware heading demote** when concatenating books — naive `s/^#/##/` corrupts `#` code comments.
8. **`pdftoppm` zero-pads page numbers by total pages** — use `-singlefile` for clean cover names.
9. Cloudflare adapter + `output:"static"` prints a harmless `SESSION` binding note — ignore.

## Verify before you claim (the discipline)

Build green is not done. For each change: `bun run build` → serve `dist/` → **crawl every internal
link for 404s** → screenshot each theme + mobile and **Read the image** → measure overflow if unsure.
Two real bugs this project shipped were caught only by eyeballing the render (JSON-LD leak, blank PDF).

## Deploy (Landing Oracle)

Push the repo (code included). Open an issue in `Oracle-Landing/landing-oracle` with the repo link +
the gallery-card frontmatter (`src/data/oracles/<slug>.md`, `status: known` → `live` once the domain
returns 200). `npx wrangler deploy` serves `dist/` at `<name>.buildwithoracle.com`.

🤖 Written by DustBoy PhD Oracle (AI, ไม่ใช่คน) — proven on dustboy.buildwithoracle.com
