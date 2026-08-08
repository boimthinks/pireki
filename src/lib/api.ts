export interface BlogPost {
  title: string;
  judul_seo: string;
  slug: string;
  image_url: string;
  date: string;
  kategori: string;
  pengantar: string;
  content: string;
  kesimpulan: string;
}

export interface Proyek {
  title: string;
  judul_seo: string;
  slug: string;
  image_url: string;
  date: string;
  kategori: string;
  pengantar: string;
  content: string;
  kesimpulan: string;
}

const API_URL = "https://script.google.com/macros/s/AKfycbwuJj__NyvP8mHHZodKSa5_614ygYFayxUzEPOO7rNS_WWLIXYHGEfyDOM2mSIDDxOrLA/exec";

const LOCAL_IMAGE_OVERRIDES: Record<string, string> = {
  'MTsN%201%20Kepulauan%20Mentawai.png': '/img/mtsn-1-mentawai.webp',
};

function overrideImageUrl(url: string): string {
  for (const [needle, local] of Object.entries(LOCAL_IMAGE_OVERRIDES)) {
    if (url.includes(needle)) return local;
  }
  return url;
}

export async function getApiData() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    return {
      blog: ((data.blog || []) as BlogPost[]).map(p => ({ ...p, image_url: overrideImageUrl(p.image_url) })),
      proyek: ((data.proyek || []) as Proyek[]).map(p => ({ ...p, image_url: overrideImageUrl(p.image_url) }))
    };
  } catch (error) {
    console.error("Error fetching API data:", error);
    return { blog: [], proyek: [] };
  }
}

