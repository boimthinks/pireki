# PIREKI — pireki.id

Astro 6 static site for CV Pireki Asia (partition wall manufacturer).

## Aturan Komunikasi
- **Bahasa**: Selalu gunakan Bahasa Indonesia dalam semua respon, pesan, dan percakapan tanpa terkecuali.

## Akses Data
- **SUMBER-PENGETAHUAN.md** (di root project) wajib dibaca untuk data brand, produk, portofolio, aturan penulisan, dan registry artikel.
- **Data Proyek**: `src/data/proyek-pemasangan-partisi-pireki.yaml` — 46 proyek nyata untuk studi kasus.
- **Knowledge graph**: `graphify-out/graph.json` untuk riset lintas-file.

## Skill Penulisan
- Gunakan skill **`penulis-ahli`** untuk menulis/mengedit artikel blog atau insight. Skill ini menangani humanisasi (hapus pola AI), SEO/GEO (Google AI 2026), dan konten non-komoditas dalam satu pass.

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

Saat diminta menulis atau memberi saran judul artikel insight:

1. **Cek anti-duplikasi** WAJIB (lihat SUMBER-PENGETAHUAN.md §10):
   - Baca judul yang dicoret `~~…~~` di daftar 60 ± daftar artikel terbit.
   - Glob semua file di `src/content/insights/*.md` dan cek frontmatter (`judul_seo`, `slug`).
2. Gunakan skill **`penulis-ahli`** yang akan otomatis:
   - Membaca SUMBER-PENGETAHUAN.md (produk, portofolio, registry, aturan).
   - Membaca `proyek-pemasangan-partisi-pireki.yaml` untuk studi kasus nyata.
   - Menggunakan prinsip non-komoditas, E-E-A-T, dan SEO/GEO (Google AI 2026).
   - Menghapus pola AI, em dash, bahasa robot, dan menghasilkan tulisan manusiawi.
3. Setelah artikel selesai, **wajib** daftarkan di SUMBER-PENGETAHUAN.md §10:
   - Tambah baris baru ke tabel "Daftar Artikel yang Sudah Ditulis".
   - Coret judul sumber di daftar 60 dengan format `~~judul~~` jika asalnya dari sana.

## LLM / GEO optimization

- `public/llms.txt` — comprehensive site info for LLM consumption (products, prices, routes, contacts). Served at `https://pireki.id/llms.txt`
- `public/robots.txt` — references `LLM-Index: /llms.txt` for compliant crawlers. Also blocks known content harvesters while allowing search engines + GPTBot, Claude-Web, PerplexityBot, Applebot

## Site URL

`https://pireki.id` (not pireki.co.id)
