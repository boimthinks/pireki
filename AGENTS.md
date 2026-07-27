# PIREKI — pireki.id

Astro 6 static site for CV Pireki Asia (partition wall manufacturer).

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Build production to `dist/` (the only verification step) |
| `npm run preview` | Preview production build |

No lint / typecheck / test scripts — only `build` catches errors.

## Data sources

- **Blog & Proyek** — Google Drive API via `src/lib/api.ts` (Google Apps Script URL)
- **Tipe, Ruangan, Layanan, Insights** — local markdown files in `src/content/` via `astro:content`

## Content collections (`src/content.config.ts`)

| Collection | Glob | Base | Key fields |
|---|---|---|---|
| `tipe` | `**/[^_]*.md` | `src/content/tipe/` | title, slug, featured_image, price, description, specifications |
| `ruangan` | `**/[^_]*.md` | `src/content/ruangan/` | title, judul_seo_h1, description, featured_image, pengantar |
| `layanan` | `**/[^_]*.md` | `src/content/layanan/` | title, judul_seo_h1, description, featured_image, badge |
| `insights` | `*.md` | `src/content/insights/` | title, judul_seo, slug, image_url, date, kategori, pengantar, kesimpulan |

**Insight glob is `*.md`** (not `**/[^_]*.md`) — this excludes `aturan/` subdirectory from the collection.

## YAML frontmatter quirks

- Values containing `: ` (e.g. judul_seo, pengantar, kesimpulan) **must be quoted**
- Dates (`date: "2026-05-27"`) and empty strings (`image_url: ""`) **must be quoted** — otherwise YAML parses them as Date/null objects and Astro schema validation fails
- Insights use `entry.data.slug` for routing params, not `entry.id` (filename)

## Key components

- `Schema.astro` — renders `application/ld+json` for Article (author: Organization CV. Pireki Asia with logo), Product, Breadcrumb, Organization. All URLs use `pireki.id`.
- `BaseHead.astro` — meta, OG, Twitter cards, canonical URL
- `InsightCard.astro` — minimal card showing `judul_seo` only (no description/Baca Selengkapnya)
- `BlogCard.astro` — has `basePath` prop (default `'/blog'`), reusable for insights if configured
- `internalLinks.ts` — auto-generates markdown links in blog content via regex keyword replacement

## Routing

- `/insights/` — listing with category filter (client-side JS)
- `/insights/[slug]` — detail page using `getStaticPaths` with `render()`, breadcrumb, Schema, CTA, FeaturedTipe, RelatedPosts, AboutAuthor
- `/blog/`, `/proyek/` — use Google Drive API data
- `/kontak/[city]` — static city pages from `src/data/cities.ts`

## Redirects (`astro.config.mjs`)

Migrating articles from `/blog/` to `/insights/`? Add redirects in `astro.config.mjs`:
```js
redirects: {
  '/blog/path-lama': '/insights/path-baru',
}
```
Astro generates a static HTML file at the old path with meta refresh + JS fallback redirect.

## Filter buttons (client-side JS)

`src/pages/insights/index.astro`, `blog/index.astro`, `proyek/index.astro` each have a category filter. When clicked, the active button gets `bg-[#c9a84c] text-black border-[#c9a84c]`, others get `text-white/70`. The JS must explicitly remove `text-white/70` and add it back to avoid Tailwind specificity conflict.

## Writing insights articles

See `src/content/insights/aturan/AGENTS.md` — load the `menulis` skill, follow persona/ template, cross out used titles in `saran_judul_dari_gemini.md`.

## Site URL

`https://pireki.id` (not pireki.co.id)
