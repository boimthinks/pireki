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

const REQUEST_TIMEOUT_MS = 20000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (response.ok) return response;
        throw new Error(`HTTP ${response.status}`);
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      if (attempt === retries) throw error;
      console.warn(`API fetch attempt ${attempt}/${retries} failed, retrying...`, error);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  throw new Error("Unreachable");
}

let cachedApiData: { blog: BlogPost[]; proyek: Proyek[] } | null = null;

export async function getApiData() {
  if (cachedApiData) {
    return cachedApiData;
  }
  try {
    const response = await fetchWithRetry(API_URL);
    const data = await response.json();
    cachedApiData = {
      blog: ((data.blog || []) as BlogPost[]).map(p => ({ ...p, image_url: overrideImageUrl(p.image_url) })),
      proyek: ((data.proyek || []) as Proyek[]).map(p => ({ ...p, image_url: overrideImageUrl(p.image_url) }))
    };
    return cachedApiData;
  } catch (error) {
    console.error("Error fetching API data:", error);
    return { blog: [], proyek: [] };
  }
}

