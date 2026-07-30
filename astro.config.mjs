// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from "@astrojs/sitemap";
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://pireki.id',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()]
  },
  redirects: {
    '/monitor': '/monitor/index.html',
    '/monitor/': '/monitor/index.html',
    '/blog/20-kata-kata-promosi-jasa-bangunan': '/insights/20-kata-promosi-jasa-bangunan',
    '/blog/mengenal-partisi-gypsum': '/insights/partisi-gypsum-vs-partisi-geser',
    '/blog/u-shape-style': '/insights/u-shape-style',
    '/blog/standar-ergonomi-ruang-rapat': '/insights/ergonomi-ruang-rapat-partisi-geser',
    '/blog/buat-rab-dengan-chatgpt': '/insights/buat-rab-dengan-ai',
    '/blog/tata-ruang-rapat-untuk-kelompok-kecil': '/insights/tata-ruang-rapat-kelompok-kecil',
  }
});