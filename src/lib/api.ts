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

export async function getApiData() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    return {
      blog: (data.blog || []) as BlogPost[],
      proyek: (data.proyek || []) as Proyek[]
    };
  } catch (error) {
    console.error("Error fetching API data:", error);
    return { blog: [], proyek: [] };
  }
}

