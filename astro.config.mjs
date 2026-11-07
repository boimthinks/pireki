// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from "@astrojs/sitemap";
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://pireki.id';
const BLOG_API_URL = "https://script.google.com/macros/s/AKfycbwuJj__NyvP8mHHZodKSa5_614ygYFayxUzEPOO7rNS_WWLIXYHGEfyDOM2mSIDDxOrLA/exec";

async function buildLastmodMap() {
  const map = {};

  try {
    const dir = join(process.cwd(), 'src/content/insights');
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const raw = readFileSync(join(dir, file), 'utf-8');
      const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fm) continue;
      const dateMatch = fm[1].match(/^date:\s*["']?([^"'\s]+)/m);
      const slugMatch = fm[1].match(/^slug:\s*["']?([^"'\s]+)/m);
      if (dateMatch && slugMatch) {
        const url = `${SITE}/insights/${slugMatch[1]}`.replace(/\/$/, '');
        map[url] = new Date(dateMatch[1]).toISOString();
      }
    }
  } catch (error) {
    console.warn('Gagal membaca insights untuk lastmod sitemap:', error.message);
  }

  try {
    const response = await fetch(BLOG_API_URL);
    const data = await response.json();
    for (const post of data.blog || []) {
      if (post.slug && post.date) {
        const url = `${SITE}/blog/${post.slug}`.replace(/\/$/, '');
        map[url] = new Date(post.date).toISOString();
      }
    }
    for (const item of data.proyek || []) {
      if (item.slug && item.date) {
        const url = `${SITE}/proyek/${item.slug}`.replace(/\/$/, '');
        map[url] = new Date(item.date).toISOString();
      }
    }
  } catch (error) {
    console.warn('Gagal mengambil API untuk lastmod sitemap:', error.message);
  }

  return map;
}

const lastmodMap = await buildLastmodMap();
const buildTime = new Date().toISOString();

// https://astro.build/config
export default defineConfig({
  site: SITE,
  // Canonical seluruh halaman selalu berakhir dengan trailing slash karena
  // BaseHead.astro memakai Astro.url.pathname dan build format 'directory'.
  // Opsi ini memastikan dev server konsisten dengan bentuk canonical produksi.
  trailingSlash: 'always',
  integrations: [sitemap({
    serialize(item) {
      const key = item.url.replace(/\/$/, '');
      const lastmod = lastmodMap[key];
      if (lastmod) item.lastmod = lastmod;
      else if (key === `${SITE}`) item.lastmod = buildTime;
      return item;
    },
  })],
  vite: {
    plugins: [tailwindcss()]
  },
  redirects: {
    '/monitor': '/monitor/index.html',
    '/blog/harga-partisi-pvc-per-meter': '/insights/harga-sekat-ruangan-buka-tutup-pvc',
    '/blog/buat-rab-dengan-chatgpt': '/insights/buat-rab-dengan-ai',
    '/blog/u-shape-style': '/insights/layout-u-shape-vs-hollow-square',
    '/blog/hollow-square-style': '/insights/layout-u-shape-vs-hollow-square',
    '/blog/20-kata-kata-promosi-jasa-bangunan': '/insights/20-kata-promosi-jasa-bangunan',
    '/blog/perbedaan-konstruksi-kontraktor-dan-pemborong': '/insights/perbedaan-kontraktor-konstruksi-developer',
    '/blog/mengenal-partisi-gypsum': '/insights/partisi-gypsum-vs-partisi-geser',
    '/blog/standar-ergonomi-ruang-rapat': '/insights/ergonomi-ruang-rapat-partisi-geser',
    '/blog/kontraktor-vs-developer': '/insights/perbedaan-kontraktor-konstruksi-developer',
    '/blog/kapasitas-tamu-ballroom': '/insights/roi-partisi-geser-ballroom-hotel',
    '/blog/partisi-ruang-kelas': '/insights/partisi-kelas-kampus-atasi-kebisingan',
    '/blog/membuat-ruang-kelas-modern': '/insights/partisi-kelas-kampus-atasi-kebisingan',
    '/blog/menghitung-biaya-konstruksi': '/insights/estimasi-biaya-renovasi-kantor-per-m2',
    '/blog/biaya-renovasi-ruang-konferensi': '/insights/estimasi-biaya-renovasi-kantor-per-m2',
    '/blog/cara-menghitung-kebutuhan-dinding-partisi': '/insights/anatomi-harga-partisi-per-meter',
    '/blog/smart-partisi-geser': '/insights/sekat-ruangan-geser-kantor',
    '/blog/mengenal-plywood': '/insights/ketahanan-api-partisi-ruang-kantor',
  }
});
