import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tipe = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/tipe' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    featured_image: z.string(),
    price: z.string().or(z.number().transform((val) => val.toString())),
    description: z.string(),
    specifications: z.array(z.string()),
    sistem: z.string().optional(),
  }),
});

const ruangan = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/ruangan' }),
  schema: z.object({
    title: z.string(),
    judul_seo_h1: z.string(),
    description: z.string(),
    featured_image: z.string(),
    pengantar: z.string(),
    baca_cepat: z.string(),
    kesimpulan: z.string(),
  }),
});

const layanan = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/layanan' }),
  schema: z.object({
    title: z.string(),
    judul_seo_h1: z.string(),
    description: z.string(),
    featured_image: z.string(),
    badge: z.string(),
  }),
});

const insights = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/insights' }),
  schema: z.object({
    title: z.string(),
    judul_seo: z.string(),
    slug: z.string(),
    image_url: z.string(),
    date: z.string(),
    kategori: z.string(),
    pengantar: z.string(),
    kesimpulan: z.string(),
  }),
});

export const collections = {
  tipe,
  ruangan,
  layanan,
  insights,
};
