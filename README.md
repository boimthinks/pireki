# PIREKI — pireki.id

Astro 6 static site for **CV Pireki Asia**, a partition wall manufacturer based in Surabaya, Indonesia.

## Quick start

```bash
npm install
npm run dev       # localhost:4321
npm run build     # production to dist/
npm run preview   # preview production build
```

No lint/typecheck/test scripts — only `build` catches errors.

## Project structure

```
src/
├── components/      # Astro components (cards, schema, head, CTA)
├── content/         # Markdown content collections
│   ├── insights/    # Insight articles (SEO blog)
│   ├── tipe/        # Product types
│   ├── ruangan/     # Room categories
│   └── layanan/     # Services
├── data/            # Static data (cities.ts)
├── layouts/         # Page layouts
├── lib/             # API client (Google Drive)
├── pages/           # Routes
│   ├── blog/        # Blog listing (Google Drive API)
│   ├── insights/    # Insights listing + [slug]
│   ├── kontak/      # Contact pages per city
│   ├── proyek/      # Project listing (Google Drive API)
│   └── ...          # Static pages
└── content.config.ts # Content collection schemas
```

## Data sources

| Source | Content | Location |
|---|---|---|
| **Google Drive API** | Blog posts, projects | `src/lib/api.ts` (Google Apps Script) |
| **Markdown files** | Product types, rooms, services, insights | `src/content/` via `astro:content` |

## Content collections

| Collection | Glob | Description |
|---|---|---|
| `tipe` | `**/[^_]*.md` | Product types (Sorepa, Samowa, etc.) |
| `ruangan` | `**/[^_]*.md` | Room categories |
| `layanan` | `**/[^_]*.md` | Services |
| `insights` | `*.md` | SEO articles (excludes `aturan/` subdir) |

## Key notes

- **Insight frontmatter**: `date` and `image_url` values **must be quoted** in YAML
- **Insight routing**: uses `entry.data.slug`, not filename
- **Redirects**: Add in `astro.config.mjs` under `redirects` — Astro generates static HTML with meta refresh + JS fallback
- **Filter buttons** (insights/blog/proyek): JS must toggle `text-white/70` explicitly due to Tailwind specificity

## Key components

| Component | Purpose |
|---|---|
| `Schema.astro` | JSON-LD structured data (Article, Product, Breadcrumb, Organization) |
| `BaseHead.astro` | Meta tags, OG, Twitter cards, canonical URL |
| `InsightCard.astro` | Minimal card (judul_seo only) |
| `BlogCard.astro` | Reusable card with `basePath` prop |
| `internalLinks.ts` | Auto-generates markdown links in blog content |

## Writing insights

See `src/content/insights/aturan/AGENTS.md` — follow the `menulis` skill workflow and use `saran_judul_dari_gemini.md` as topic source.

## Site URL

`https://pireki.id` — not pireki.co.id

## Contact

- WA: 0823-7673-7701
- Email: sales@pireki.id
