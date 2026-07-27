# AGENTS.md — penulis-artikel-pireki

Content generation project for [pireki.id](https://pireki.id) (CV Pireki Asia — partition wall manufacturer).

Aligned with [Google AI Optimization Guide (2026)](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) — focus on **non-commodity content** with unique POV, avoid AEO/GEO myths.

## Structure

| Path | Purpose |
|---|---|---|
| `persona.md` | **Single source of truth** for brand, products, writing style, SEO rules, target market. Never contradict this file. |
| `contoh_hasil_tulisan.md` | Article output template with required frontmatter fields. |
| `src/content/insights/` | Place generated articles here. gunakan date sebagai nama file md (`YYYY-MM-DD.md`) |
| `proyek-pemasangan-partisi-pireki.yaml` | **46 real project references** — use for case studies, social proof, and non-commodity content. |

## Workflow

1. **Load the `menulis` skill** — it provides the SEO-writing pipeline (keyword analysis → outline → 1200+ word article → humanization).
2. **Read `persona.md`** for brand rules, product specs, tone, writing style guide, SEO rules, CTA requirements, **and portfolio references (section 2.5)**.
3. **Read `proyek-pemasangan-partisi-pireki.yaml`** for specific project data — use as case study examples to make articles non-commodity.
4. **Follow `contoh_hasil_tulisan.md`** for the exact frontmatter structure:
   - `title`: short (≤5 words)
   - `judul_seo`: longer SEO title (≤12 words)
   - `slug`: lowercase, hyphen-separated
   - `image_url`: leave blank
   - `date`: current date
   - `kategori`: single category
   - `pengantar`: one-paragraph intro
   - `kesimpulan`: one-paragraph conclusion
5. **Write article body in markdown** after the frontmatter.
   - Ensure content is **non-commodity** (unique POV, first-hand experience, not recycled)
   - Write for **humans, not AI** — Google understands synonyms & context
   - No chunking, no llms.txt, no AI-specific rewriting needed
6. **Save to `src/content/insights/`** — langsung di folder content collection, bukan subfolder terpisah.

## Sumber Judul

- `saran_judul_dari_gemini.md` — 60 unique article angles (problem-centric, E-E-A-T). Selalu gunakan daftar ini sebagai sumber topik.
- Setelah menulis artikel berdasarkan salah satu judul, **coret judul tersebut** di file `saran_judul_dari_gemini.md` menggunakan format ~~coret~~ + link ke file hasil tulisan (contoh: `../2026-05-30.md`).
- Jangan menulis ulang judul yang sudah dicoret.

## Key constraints

- No code, no builds, no package.json — purely content generation.
- All product claims must match `persona.md` specs exactly.
- Every article needs a CTA with contact info (see persona.md section 7.3).
- 1–2% keyword density, natural only.
- Avoid AI-isms listed in persona.md §6.2 and §10.
- **Must pass non-commodity check**: does this article have a unique angle Google AI would cite over competitors?
