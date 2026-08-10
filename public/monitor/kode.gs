/**
 * PIREKI Monitor — Google Apps Script backend
 *
 * Fitur utama:
 * - Memantau 27 website unik yang memiliki sitemap aktif.
 * - Memisahkan artikel terbaru, artikel terakhir diubah, dan lastmod sitemap.
 * - Tidak menggunakan Google Sheets.
 * - Menyimpan JSON secara terkompresi dan terpotong di Script Properties.
 * - Menyediakan endpoint JSON publik melalui doGet().
 * - Mendukung JSONP agar dashboard statis di Netlify tidak bermasalah dengan CORS.
 * - Trigger harian dibuat dengan menjalankan setupProject() satu kali.
 *
 * LANGKAH PERTAMA:
 * 1. Atur timezone project ke Asia/Jakarta.
 * 2. Jalankan setupProject() dari editor dan berikan izin.
 * 3. Deploy sebagai Web app: Execute as Me, Who has access: Anyone.
 * 4. Salin URL /exec ke konstanta APPS_SCRIPT_ENDPOINT di app.js.
 */

const MONITOR_CONFIG = Object.freeze({
  timezone: 'Asia/Jakarta',
  triggerHour: 7,
  fetchBatchSize: 50,
  propertyPrefix: 'PIREKI_MONITOR_',
  propertyChunkSize: 8000,
  schemaVersion: 1,
  userAgent: 'PirekiMonitor-GAS/1.0',
});

const SITE_CONFIG = Object.freeze([
  {
    website: 'https://www.pirekiasia.id/',
    sitemap: 'https://www.pirekiasia.id/sitemap_index.xml',
    contentSitemap: 'https://www.pirekiasia.id/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://partisipireki.id/',
    sitemap: 'https://partisipireki.id/sitemap_index.xml',
    contentSitemap: 'https://partisipireki.id/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://pusatpenyekatruangan.com/',
    sitemap: 'https://pusatpenyekatruangan.com/sitemap_index.xml',
    contentSitemap: 'https://pusatpenyekatruangan.com/post-sitemap.xml',
    mode: 'wordpress',
    note: 'Sitemap aktif, tetapi tidak dicantumkan di robots.txt.',
  },
  {
    website: 'https://www.pintupedia.com/',
    sitemap: 'https://www.pintupedia.com/sitemap.xml',
    contentSitemap: 'https://www.pintupedia.com/sitemap.xml',
    mode: 'sitemap_only',
    note: 'Sitemap berisi produk/halaman, bukan sitemap artikel; robots.txt menunjuk domain lain.',
  },
  {
    website: 'https://www.pintupartisi.com/',
    sitemap: 'https://www.pintupartisi.com/sitemap_index.xml',
    contentSitemap: 'https://www.pintupartisi.com/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://pintupireki.com/',
    sitemap: 'https://pintupireki.com/sitemap.xml',
    contentSitemap: 'https://pintupireki.com/page-sitemap.xml',
    mode: 'sitemap_only',
    note: 'Post sitemap kosong; perubahan dipantau dari page-sitemap.',
  },
  {
    website: 'https://pirekipartisi.id/',
    sitemap: 'https://pirekipartisi.id/sitemap_index.xml',
    contentSitemap: 'https://pirekipartisi.id/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://pirekisurabaya.com/',
    sitemap: 'https://pirekisurabaya.com/sitemap_index.xml',
    contentSitemap: 'https://pirekisurabaya.com/post-sitemap.xml',
    mode: 'wordpress',
    note: 'Sitemap aktif, tetapi tidak dicantumkan di robots.txt.',
  },
  {
    website: 'https://pintulipatpireki.com/',
    sitemap: 'https://pintulipatpireki.com/sitemap_index.xml',
    contentSitemap: 'https://pintulipatpireki.com/post-sitemap.xml',
    mode: 'wordpress',
    note: 'Sitemap aktif, tetapi tidak dicantumkan di robots.txt.',
  },
  {
    website: 'https://pireki.com/',
    sitemap: 'https://pireki.com/wp-sitemap.xml',
    contentSitemap: 'https://pireki.com/wp-sitemap-posts-post-1.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://pintupireki.id/',
    sitemap: 'https://pintupireki.id/sitemap_index.xml',
    contentSitemap: 'https://pintupireki.id/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://www.pirekibanten.com/',
    sitemap: 'https://www.pirekibanten.com/sitemap_index.xml',
    contentSitemap: 'https://www.pirekibanten.com/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://pirekimedan.com/',
    sitemap: 'https://pirekimedan.com/sitemap_index.xml',
    contentSitemap: 'https://pirekimedan.com/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://www.pintupartisipireki.com/',
    sitemap: 'https://www.pintupartisipireki.com/sitemap_index.xml',
    contentSitemap: 'https://www.pintupartisipireki.com/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://www.pintulipatpvc9.com/',
    sitemap: 'https://www.pintulipatpvc9.com/sitemap_index.xml',
    contentSitemap: 'https://www.pintulipatpvc9.com/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://partisi-pireki.com/',
    sitemap: 'https://partisi-pireki.com/sitemap.xml',
    contentSitemap: 'https://partisi-pireki.com/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://pirekikaltim.com/',
    sitemap: 'https://pirekikaltim.com/sitemap_index.xml',
    contentSitemap: 'https://pirekikaltim.com/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://www.tokopartisigeser.com/',
    sitemap: 'https://www.tokopartisigeser.com/sitemap_index.xml',
    contentSitemap: 'https://www.tokopartisigeser.com/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://pirekimakassar.com/',
    sitemap: 'https://pirekimakassar.com/sitemap_index.xml',
    contentSitemap: 'https://pirekimakassar.com/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://pintulipat.com/',
    sitemap: 'https://pintulipat.com/sitemap_index.xml',
    contentSitemap: 'https://pintulipat.com/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://pirekisorepa.com/',
    sitemap: 'https://pirekisorepa.com/sitemap_index.xml',
    contentSitemap: 'https://pirekisorepa.com/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://partisiruang.com/',
    sitemap: 'https://partisiruang.com/sitemap_index.xml',
    contentSitemap: 'https://partisiruang.com/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://penyekatruangan.com/',
    sitemap: 'https://penyekatruangan.com/sitemap_index.xml',
    contentSitemap: 'https://penyekatruangan.com/post-sitemap.xml',
    mode: 'wordpress',
    note: 'Sitemap aktif, tetapi tidak dicantumkan di robots.txt.',
  },
  {
    website: 'https://aplikadoor.com/',
    sitemap: 'https://aplikadoor.com/sitemap.xml',
    contentSitemap: 'https://aplikadoor.com/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://pintupartisiruangan.com/',
    sitemap: 'https://pintupartisiruangan.com/sitemap.xml',
    contentSitemap: 'https://pintupartisiruangan.com/post-sitemap1.xml',
    mode: 'sitemap_archive',
    archiveUrl: 'https://pintupartisiruangan.com/berita/',
    note: 'Sitemap artikel terbagi menjadi post-sitemap1.xml sampai post-sitemap10.xml; REST API tidak tersedia.',
  },
  {
    website: 'https://www.sorepa.id/',
    sitemap: 'https://www.sorepa.id/sitemap_index.xml',
    contentSitemap: 'https://www.sorepa.id/post-sitemap.xml',
    mode: 'wordpress',
    note: '',
  },
  {
    website: 'https://pireki.id/',
    sitemap: 'https://pireki.id/sitemap-index.xml',
    contentSitemap: 'https://pireki.id/sitemap-0.xml',
    mode: 'sitemap_only',
    note: 'Situs statis Astro; lastmod diisi dari tanggal artikel saat build.',
  },
]);

/**
 * Jalankan SATU KALI dari editor Apps Script.
 * Fungsi ini menghapus trigger monitor lama, membuat trigger harian,
 * lalu langsung membuat data awal.
 */
function setupProject() {
  validateSiteConfig_();
  createDailyTrigger();
  const payload = runDailyMonitor();
  console.log(JSON.stringify(payload.summary));
  return payload.summary;
}

/** Membuat tepat satu trigger harian sekitar pukul 07.00 WIB. */
function createDailyTrigger() {
  const handler = 'runDailyMonitor';
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (trigger.getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger(handler)
    .timeBased()
    .atHour(MONITOR_CONFIG.triggerHour)
    .nearMinute(0)
    .everyDays(1)
    .inTimezone(MONITOR_CONFIG.timezone)
    .create();

  console.log('Trigger harian dibuat sekitar pukul 07.00 Asia/Jakarta.');
}

/** Menjalankan pemeriksaan secara manual tanpa membuat trigger baru. */
function manualRefresh() {
  return runDailyMonitor();
}

/**
 * Fungsi yang dipanggil trigger setiap hari.
 * Data lama tetap tersedia apabila pemeriksaan baru gagal total.
 */
function runDailyMonitor() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    throw new Error('Proses monitor lain masih berjalan. Coba lagi beberapa saat.');
  }

  const started = Date.now();
  const props = PropertiesService.getScriptProperties();
  try {
    validateSiteConfig_();
    const sites = monitorAllSites_();
    const summary = buildSummary_(sites);
    const payload = {
      ok: true,
      schema_version: MONITOR_CONFIG.schemaVersion,
      generated_at: formatJakarta_(new Date()),
      timezone: MONITOR_CONFIG.timezone,
      duration_ms: Date.now() - started,
      summary: summary,
      sites: sites,
    };

    savePayload_(payload);
    props.deleteProperty(MONITOR_CONFIG.propertyPrefix + 'LAST_ERROR');
    console.log('Monitor selesai: ' + JSON.stringify(summary));
    return payload;
  } catch (error) {
    const failure = {
      occurred_at: formatJakarta_(new Date()),
      message: String(error && error.message ? error.message : error),
      stack: String(error && error.stack ? error.stack : ''),
    };
    props.setProperty(
      MONITOR_CONFIG.propertyPrefix + 'LAST_ERROR',
      JSON.stringify(failure)
    );
    console.error(JSON.stringify(failure));
    throw error;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Endpoint publik.
 * - /exec                -> JSON
 * - /exec?pretty=1       -> JSON yang mudah dibaca
 * - /exec?callback=nama  -> JSONP untuk dashboard Netlify
 *
 * Endpoint ini hanya membaca hasil tersimpan. Pengunjung website tidak dapat
 * memaksa pemindaian ulang dan tidak menghabiskan kuota URL Fetch monitor.
 */
function doGet(e) {
  let payload;
  try {
    payload = loadPayload_();
  } catch (error) {
    payload = {
      ok: false,
      error: 'STORAGE_READ_ERROR',
      message: String(error && error.message ? error.message : error),
    };
  }

  if (!payload) {
    payload = {
      ok: false,
      error: 'DATA_NOT_READY',
      setup_required: true,
      message: 'Data belum tersedia. Jalankan setupProject() dari editor Apps Script.',
      generated_at: null,
      timezone: MONITOR_CONFIG.timezone,
      summary: { total: SITE_CONFIG.length, ok: 0, partial: 0, failed: 0 },
      sites: [],
    };
  }

  const lastError = readLastError_();
  if (lastError) {
    payload.last_run_error = lastError;
  }
  payload.served_at = formatJakarta_(new Date());

  const params = (e && e.parameter) || {};
  const pretty = params.pretty === '1';
  const callback = String(params.callback || '').trim();
  const json = JSON.stringify(payload, null, pretty ? 2 : 0);

  if (callback) {
    if (!isValidJsonpCallback_(callback)) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: 'INVALID_CALLBACK' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    const safeJson = json.replace(/<\/script/gi, '<\\/script');
    return ContentService.createTextOutput(callback + '(' + safeJson + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/** Menghapus data tersimpan. Trigger tidak ikut dihapus. */
function clearStoredMonitorData() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  Object.keys(all).forEach((key) => {
    if (key.indexOf(MONITOR_CONFIG.propertyPrefix) === 0) {
      props.deleteProperty(key);
    }
  });
  console.log('Data monitor di Script Properties telah dihapus.');
}

function monitorAllSites_() {
  const urls = [];
  SITE_CONFIG.forEach((site) => {
    urls.push(site.sitemap);
    urls.push(site.contentSitemap);
    if (site.mode === 'wordpress') {
      urls.push(wpRestUrl_(site, 'date'));
      urls.push(wpRestUrl_(site, 'modified'));
    }
    if (site.mode === 'sitemap_archive' && site.archiveUrl) {
      urls.push(site.archiveUrl);
    }
  });

  const responseMap = fetchUrlMap_(urls);
  return SITE_CONFIG.map((site) => {
    try {
      if (site.mode === 'wordpress') {
        return monitorWordPress_(site, responseMap);
      }
      if (site.mode === 'sitemap_only') {
        return monitorSitemapOnly_(site, responseMap);
      }
      if (site.mode === 'sitemap_archive') {
        return monitorSitemapArchive_(site, responseMap);
      }
      throw new Error('Mode tidak dikenal: ' + site.mode);
    } catch (error) {
      const result = blankResult_(site);
      result.status = 'gagal';
      result.sitemap_status = 'tidak sempat diproses';
      result.catatan = joinNotes_(
        result.catatan,
        'Kesalahan tak terduga: ' + String(error && error.message ? error.message : error)
      );
      return result;
    }
  });
}

function monitorWordPress_(site, responseMap) {
  const result = blankResult_(site);
  const issues = [];
  const rootCheck = checkSitemap_(responseMap[site.sitemap]);
  const contentCheck = checkSitemap_(responseMap[site.contentSitemap]);
  result.sitemap_status = rootCheck.status;

  if (!rootCheck.valid) issues.push('sitemap utama: ' + rootCheck.status);
  if (!contentCheck.valid) issues.push('sitemap konten: ' + contentCheck.status);

  const newest = newestSitemapEntry_(contentCheck.entries);
  if (newest.entry) {
    result.sitemap_lastmod_url = newest.entry.loc || '';
    result.sitemap_lastmod_terbaru = formatJakartaValue_(newest.entry.lastmod);
  }

  const latestPost = parseWpPost_(responseMap[wpRestUrl_(site, 'date')]);
  const modifiedPost = parseWpPost_(responseMap[wpRestUrl_(site, 'modified')]);

  if (latestPost) {
    const fields = wpPostFields_(latestPost);
    result.artikel_terbaru_judul = fields.title;
    result.tanggal_terbit = fields.published;
    result.tanggal_artikel_diubah = fields.modified;
    result.url_artikel_terbaru = fields.url;
  }

  if (modifiedPost) {
    const fields = wpPostFields_(modifiedPost);
    result.artikel_update_terakhir_judul = fields.title;
    result.tanggal_update_artikel = fields.modified;
    result.url_update_artikel = fields.url;
  }

  // Fallback jika REST API suatu saat tidak tersedia.
  let fallbackPage = null;
  if ((!latestPost || !modifiedPost) && newest.entry && newest.entry.loc) {
    fallbackPage = fetchPage_(newest.entry.loc);
  }

  if (!latestPost && fallbackPage && fallbackPage.ok) {
    result.artikel_terbaru_judul = fallbackPage.title;
    result.tanggal_terbit = formatJakartaValue_(fallbackPage.published);
    result.tanggal_artikel_diubah =
      formatJakartaValue_(fallbackPage.modified) || result.sitemap_lastmod_terbaru;
    result.url_artikel_terbaru = fallbackPage.url;
    issues.push('REST artikel terbaru gagal; memakai URL lastmod sitemap terbaru');
  } else if (!latestPost) {
    issues.push('REST artikel terbaru tidak tersedia');
  }

  if (!modifiedPost && fallbackPage && fallbackPage.ok) {
    result.artikel_update_terakhir_judul = fallbackPage.title;
    result.tanggal_update_artikel =
      formatJakartaValue_(fallbackPage.modified) || result.sitemap_lastmod_terbaru;
    result.url_update_artikel = fallbackPage.url;
    issues.push('REST modifikasi gagal; memakai lastmod sitemap');
  } else if (!modifiedPost) {
    issues.push('REST artikel termodifikasi tidak tersedia');
  }

  if (!result.artikel_terbaru_judul && !newest.entry) {
    result.status = 'gagal';
  } else if (issues.length) {
    result.status = 'parsial';
  }
  result.catatan = joinNotes_(result.catatan, issues.join('; '));
  return result;
}

function monitorSitemapOnly_(site, responseMap) {
  const result = blankResult_(site);
  const issues = [];
  const rootCheck = checkSitemap_(responseMap[site.sitemap]);
  const contentCheck = site.sitemap === site.contentSitemap
    ? rootCheck
    : checkSitemap_(responseMap[site.contentSitemap]);

  result.sitemap_status = rootCheck.status;
  if (!rootCheck.valid) issues.push('sitemap utama: ' + rootCheck.status);
  if (!contentCheck.valid) issues.push('sitemap konten: ' + contentCheck.status);

  const newest = newestSitemapEntry_(contentCheck.entries);
  if (!newest.entry) {
    result.status = 'gagal';
    result.catatan = joinNotes_(result.catatan, 'Tidak ada URL dalam sitemap');
    return result;
  }

  result.sitemap_lastmod_url = newest.entry.loc || '';
  result.sitemap_lastmod_terbaru = formatJakartaValue_(newest.entry.lastmod);

  const page = fetchPage_(newest.entry.loc);
  if (page.ok) {
    result.artikel_update_terakhir_judul = page.title;
    result.tanggal_update_artikel =
      formatJakartaValue_(page.modified) || result.sitemap_lastmod_terbaru;
    result.url_update_artikel = page.url;
  } else {
    issues.push('judul URL terbaru gagal diambil: ' + page.error);
  }

  result.catatan = joinNotes_(
    result.catatan,
    'Kolom artikel dikosongkan karena sumber tidak menyediakan post/artikel terverifikasi'
  );
  if (issues.length) {
    result.status = page.ok ? 'parsial' : 'gagal';
    result.catatan = joinNotes_(result.catatan, issues.join('; '));
  }
  return result;
}

function monitorSitemapArchive_(site, responseMap) {
  const result = blankResult_(site);
  const issues = [];
  const rootCheck = checkSitemap_(responseMap[site.sitemap]);
  const contentCheck = checkSitemap_(responseMap[site.contentSitemap]);
  result.sitemap_status = rootCheck.status;

  if (!rootCheck.valid) issues.push('sitemap utama: ' + rootCheck.status);
  if (!contentCheck.valid) issues.push('sitemap konten: ' + contentCheck.status);

  const newest = newestSitemapEntry_(contentCheck.entries);
  if (newest.entry) {
    result.sitemap_lastmod_url = newest.entry.loc || '';
    result.sitemap_lastmod_terbaru = formatJakartaValue_(newest.entry.lastmod);
    const updatePage = fetchPage_(newest.entry.loc);
    if (updatePage.ok) {
      result.artikel_update_terakhir_judul = updatePage.title;
      result.tanggal_update_artikel =
        formatJakartaValue_(updatePage.modified) || result.sitemap_lastmod_terbaru;
      result.url_update_artikel = updatePage.url;
    } else {
      issues.push('halaman update gagal: ' + updatePage.error);
    }
  } else {
    issues.push('sitemap konten tidak mempunyai URL');
  }

  const archiveRecord = responseMap[site.archiveUrl];
  const archiveHtml = responseTextIfOk_(archiveRecord);
  if (archiveHtml) {
    const latestUrl = extractFirstArchiveArticleUrl_(archiveHtml, site.archiveUrl);
    if (latestUrl) {
      const latestPage = fetchPage_(latestUrl);
      if (latestPage.ok) {
        result.artikel_terbaru_judul = latestPage.title;
        result.tanggal_terbit = formatJakartaValue_(latestPage.published);
        result.tanggal_artikel_diubah = formatJakartaValue_(latestPage.modified);
        result.url_artikel_terbaru = latestPage.url;
      } else {
        issues.push('artikel terbaru gagal: ' + latestPage.error);
      }
    } else {
      issues.push('tautan artikel di halaman arsip tidak ditemukan');
    }
  } else {
    issues.push('halaman arsip tidak dapat diambil');
  }

  if (!result.artikel_terbaru_judul && !newest.entry) {
    result.status = 'gagal';
  } else if (issues.length) {
    result.status = 'parsial';
  }
  result.catatan = joinNotes_(result.catatan, issues.join('; '));
  return result;
}

function blankResult_(site) {
  return {
    website: site.website,
    sitemap: site.sitemap,
    sitemap_status: '',
    sitemap_artikel_konten: site.contentSitemap,
    metode: site.mode,
    artikel_terbaru_judul: '',
    tanggal_terbit: '',
    tanggal_artikel_diubah: '',
    url_artikel_terbaru: '',
    artikel_update_terakhir_judul: '',
    tanggal_update_artikel: '',
    url_update_artikel: '',
    sitemap_lastmod_terbaru: '',
    sitemap_lastmod_url: '',
    status: 'ok',
    catatan: site.note || '',
    dicek_pada: formatJakarta_(new Date()),
  };
}

function buildSummary_(sites) {
  const summary = {
    total: sites.length,
    ok: 0,
    partial: 0,
    failed: 0,
    active_sitemaps: 0,
  };
  sites.forEach((site) => {
    if (site.status === 'ok') summary.ok += 1;
    else if (site.status === 'parsial') summary.partial += 1;
    else summary.failed += 1;
    if (String(site.sitemap_status).indexOf('HTTP 200, valid') === 0) {
      summary.active_sitemaps += 1;
    }
  });
  return summary;
}

function wpRestUrl_(site, orderBy) {
  const fields = 'link,date,date_gmt,modified,modified_gmt,title,status,type';
  return site.website.replace(/\/$/, '') +
    '/wp-json/wp/v2/posts?per_page=1&orderby=' + encodeURIComponent(orderBy) +
    '&order=desc&_fields=' + encodeURIComponent(fields);
}

function parseWpPost_(record) {
  if (!record || record.error || !record.response) return null;
  try {
    if (record.response.getResponseCode() !== 200) return null;
    const data = JSON.parse(record.response.getContentText('UTF-8'));
    return Array.isArray(data) && data.length ? data[0] : null;
  } catch (error) {
    return null;
  }
}

function wpPostFields_(post) {
  const title = post && post.title && typeof post.title === 'object'
    ? post.title.rendered
    : post.title;
  return {
    title: cleanText_(title || ''),
    url: String(post.link || ''),
    published: wpDate_(post, 'date'),
    modified: wpDate_(post, 'modified'),
  };
}

function wpDate_(post, field) {
  const gmt = String(post[field + '_gmt'] || '').trim();
  if (gmt) return formatJakartaValue_(gmt + 'Z');
  return formatJakartaValue_(String(post[field] || ''));
}

function fetchUrlMap_(urls) {
  const unique = [];
  const seen = {};
  urls.forEach((url) => {
    if (url && !seen[url]) {
      seen[url] = true;
      unique.push(url);
    }
  });

  const map = {};
  for (let offset = 0; offset < unique.length; offset += MONITOR_CONFIG.fetchBatchSize) {
    const chunk = unique.slice(offset, offset + MONITOR_CONFIG.fetchBatchSize);
    const requests = chunk.map((url) => requestOptions_(url));
    try {
      const responses = UrlFetchApp.fetchAll(requests);
      chunk.forEach((url, index) => {
        map[url] = { url: url, response: responses[index], error: '' };
      });
    } catch (batchError) {
      // Jika satu request membuat satu batch gagal, coba satu per satu agar
      // kegagalan satu domain tidak menjatuhkan seluruh monitor.
      chunk.forEach((url) => {
        map[url] = fetchSingleRecord_(url);
      });
    }
  }
  return map;
}

function requestOptions_(url) {
  return {
    url: url,
    method: 'get',
    followRedirects: true,
    muteHttpExceptions: true,
    validateHttpsCertificates: true,
    headers: {
      Accept: 'application/xml,text/xml,application/json,text/html;q=0.9,*/*;q=0.5',
      'Cache-Control': 'no-cache',
      'User-Agent': MONITOR_CONFIG.userAgent,
    },
  };
}

function fetchSingleRecord_(url) {
  try {
    const options = requestOptions_(url);
    delete options.url;
    const response = UrlFetchApp.fetch(url, options);
    return { url: url, response: response, error: '' };
  } catch (error) {
    return {
      url: url,
      response: null,
      error: String(error && error.message ? error.message : error),
    };
  }
}

function fetchPage_(url) {
  if (!url) return { ok: false, error: 'URL kosong', url: '' };
  const record = fetchSingleRecord_(url);
  if (record.error || !record.response) {
    return { ok: false, error: record.error || 'Tidak ada respons', url: url };
  }
  const code = record.response.getResponseCode();
  if (code < 200 || code >= 400) {
    return { ok: false, error: 'HTTP ' + code, url: url };
  }
  const html = record.response.getContentText('UTF-8');
  return {
    ok: true,
    error: '',
    url: normalizePublicUrl_(url),
    title: extractPageTitle_(html),
    published: extractMetaContent_(html, ['article:published_time', 'datepublished', 'date']),
    modified: extractMetaContent_(html, ['article:modified_time', 'og:updated_time', 'datemodified']),
  };
}

function responseTextIfOk_(record) {
  if (!record || record.error || !record.response) return '';
  const code = record.response.getResponseCode();
  if (code < 200 || code >= 400) return '';
  return record.response.getContentText('UTF-8');
}

function checkSitemap_(record) {
  if (!record) {
    return { valid: false, status: 'tidak ada respons', kind: '', entries: [] };
  }
  if (record.error || !record.response) {
    return {
      valid: false,
      status: 'gagal: ' + (record.error || 'tidak ada respons'),
      kind: '',
      entries: [],
    };
  }

  const code = record.response.getResponseCode();
  if (code !== 200) {
    return { valid: false, status: 'HTTP ' + code, kind: '', entries: [] };
  }

  try {
    const parsed = parseSitemapXml_(record.response.getContentText('UTF-8'));
    if (parsed.kind !== 'urlset' && parsed.kind !== 'sitemapindex') {
      return {
        valid: false,
        status: 'HTTP 200, XML tidak dikenali (' + parsed.kind + ')',
        kind: parsed.kind,
        entries: [],
      };
    }
    return {
      valid: true,
      status: 'HTTP 200, valid ' + parsed.kind,
      kind: parsed.kind,
      entries: parsed.entries,
    };
  } catch (error) {
    return {
      valid: false,
      status: 'HTTP 200, bukan XML sitemap: ' + String(error.message || error),
      kind: '',
      entries: [],
    };
  }
}

function parseSitemapXml_(text) {
  const cleaned = String(text || '').replace(/^\uFEFF/, '').trim();
  const document = XmlService.parse(cleaned);
  const root = document.getRootElement();
  const kind = String(root.getName() || '').toLowerCase();
  const entries = [];

  root.getChildren().forEach((item) => {
    const entry = {};
    item.getChildren().forEach((child) => {
      const name = String(child.getName() || '').toLowerCase();
      if (name === 'loc' || name === 'lastmod') {
        entry[name] = String(child.getText() || '').trim();
      }
    });
    if (entry.loc) entries.push(entry);
  });

  return { kind: kind, entries: entries };
}

function newestSitemapEntry_(entries) {
  let best = null;
  let bestTime = -Infinity;
  (entries || []).forEach((entry) => {
    const time = parseDateMs_(entry.lastmod);
    if (Number.isFinite(time) && time > bestTime) {
      best = entry;
      bestTime = time;
    }
  });
  if (!best && entries && entries.length) best = entries[0];
  return { entry: best, time: bestTime };
}

function extractFirstArchiveArticleUrl_(html, baseUrl) {
  const articleMatch = String(html || '').match(/<article\b[\s\S]*?<\/article>/i);
  if (!articleMatch) return '';
  const block = articleMatch[0];

  let anchorMatch = block.match(/<h[1-3]\b[^>]*>[\s\S]*?<a\b([^>]*)>/i);
  if (anchorMatch) {
    const href = getHtmlAttribute_(anchorMatch[1], 'href');
    if (href) return resolveUrl_(baseUrl, href);
  }

  const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(block)) !== null) {
    const href = getHtmlAttribute_(match[1], 'href');
    const label = cleanText_(match[2]);
    if (href && label && href.indexOf('/category/') === -1) {
      return resolveUrl_(baseUrl, href);
    }
  }
  return '';
}

function extractPageTitle_(html) {
  const metaTitle = extractMetaContent_(html, ['og:title', 'twitter:title']);
  if (metaTitle) return cleanText_(metaTitle);
  const h1 = String(html || '').match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return cleanText_(h1[1]);
  const title = String(html || '').match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return title ? cleanText_(title[1]) : '';
}

function extractMetaContent_(html, keys) {
  const wanted = {};
  keys.forEach((key) => { wanted[String(key).toLowerCase()] = true; });
  const tags = String(html || '').match(/<meta\b[^>]*>/gi) || [];
  for (let i = 0; i < tags.length; i += 1) {
    const tag = tags[i];
    const key = (
      getHtmlAttribute_(tag, 'property') ||
      getHtmlAttribute_(tag, 'name') ||
      getHtmlAttribute_(tag, 'itemprop') ||
      ''
    ).toLowerCase();
    if (wanted[key]) {
      return decodeHtml_(getHtmlAttribute_(tag, 'content') || '');
    }
  }
  return '';
}

function getHtmlAttribute_(tag, name) {
  const escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    '(?:^|\\s)' + escaped + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))',
    'i'
  );
  const match = String(tag || '').match(regex);
  return match ? String(match[1] || match[2] || match[3] || '') : '';
}

function cleanText_(value) {
  return decodeHtml_(String(value || '').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml_(value) {
  return String(value || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ');
}

function resolveUrl_(baseUrl, href) {
  const value = decodeHtml_(String(href || '').trim());
  if (/^https?:\/\//i.test(value)) return value;
  const originMatch = String(baseUrl).match(/^(https?:\/\/[^/]+)/i);
  const origin = originMatch ? originMatch[1] : '';
  if (value.indexOf('//') === 0) return 'https:' + value;
  if (value.charAt(0) === '/') return origin + value;
  const base = String(baseUrl).replace(/[?#].*$/, '').replace(/\/[^/]*$/, '/');
  return base + value;
}

function normalizePublicUrl_(url) {
  return String(url || '').replace(/\.html(?=([?#]|$))/i, '');
}

function parseDateMs_(value) {
  if (!value) return NaN;
  const time = new Date(String(value).trim()).getTime();
  return Number.isFinite(time) ? time : NaN;
}

function formatJakartaValue_(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value).trim());
  if (!Number.isFinite(date.getTime())) return '';
  return formatJakarta_(date);
}

function formatJakarta_(date) {
  return Utilities.formatDate(
    date,
    MONITOR_CONFIG.timezone,
    "yyyy-MM-dd'T'HH:mm:ssXXX"
  );
}

function joinNotes_(current, extra) {
  const left = String(current || '').trim().replace(/[.\s]+$/, '');
  const right = String(extra || '').trim().replace(/^[.\s]+/, '');
  if (!left) return right;
  if (!right) return left + '.';
  return left + '. ' + right;
}

function validateSiteConfig_() {
  const seen = {};
  SITE_CONFIG.forEach((site, index) => {
    if (!site.website || !site.sitemap || !site.contentSitemap) {
      throw new Error('Konfigurasi situs ke-' + (index + 1) + ' tidak lengkap.');
    }
    const host = normalizedHost_(site.website);
    if (seen[host]) throw new Error('Domain duplikat dalam konfigurasi: ' + host);
    seen[host] = true;
  });
  if (SITE_CONFIG.length !== 27) {
    throw new Error('Konfigurasi seharusnya berisi 27 website unik.');
  }
}

function normalizedHost_(url) {
  const match = String(url).toLowerCase().match(/^https?:\/\/([^/]+)/);
  return (match ? match[1] : String(url)).replace(/^www\./, '').replace(/\.$/, '');
}

function isValidJsonpCallback_(callback) {
  return /^[A-Za-z_$][0-9A-Za-z_$]*(?:\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(callback);
}

function readLastError_() {
  const raw = PropertiesService.getScriptProperties().getProperty(
    MONITOR_CONFIG.propertyPrefix + 'LAST_ERROR'
  );
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return { message: raw };
  }
}

/**
 * Menyimpan JSON terkompresi gzip + base64. Base64 dibagi menjadi properti
 * maksimum 8.000 karakter agar berada di bawah batas per-value Apps Script.
 * Metadata diganti paling akhir agar pembacaan tetap atomik.
 */
function savePayload_(payload) {
  const props = PropertiesService.getScriptProperties();
  const metaKey = MONITOR_CONFIG.propertyPrefix + 'META';
  const oldMetaRaw = props.getProperty(metaKey);
  let oldMeta = null;
  try {
    oldMeta = oldMetaRaw ? JSON.parse(oldMetaRaw) : null;
  } catch (error) {
    oldMeta = null;
  }

  const json = JSON.stringify(payload);
  const gzipBlob = Utilities.gzip(
    Utilities.newBlob(json, 'application/json', 'monitor.json')
  );
  const encoded = Utilities.base64Encode(gzipBlob.getBytes());
  const chunks = [];
  for (let offset = 0; offset < encoded.length; offset += MONITOR_CONFIG.propertyChunkSize) {
    chunks.push(encoded.slice(offset, offset + MONITOR_CONFIG.propertyChunkSize));
  }

  const version = String(Date.now());
  const prefix = MONITOR_CONFIG.propertyPrefix + 'DATA_' + version + '_';
  const values = {};
  chunks.forEach((chunk, index) => {
    values[prefix + index] = chunk;
  });
  props.setProperties(values, false);

  const newMeta = {
    version: version,
    chunks: chunks.length,
    encoding: 'gzip-base64',
    generated_at: payload.generated_at,
  };
  props.setProperty(metaKey, JSON.stringify(newMeta));

  // Hapus versi lama setelah metadata versi baru aktif.
  if (oldMeta && oldMeta.version && oldMeta.version !== version) {
    const oldPrefix = MONITOR_CONFIG.propertyPrefix + 'DATA_' + oldMeta.version + '_';
    const all = props.getProperties();
    Object.keys(all).forEach((key) => {
      if (key.indexOf(oldPrefix) === 0) props.deleteProperty(key);
    });
  }
}

function loadPayload_() {
  const props = PropertiesService.getScriptProperties();
  const metaRaw = props.getProperty(MONITOR_CONFIG.propertyPrefix + 'META');
  if (!metaRaw) return null;
  const meta = JSON.parse(metaRaw);
  const prefix = MONITOR_CONFIG.propertyPrefix + 'DATA_' + meta.version + '_';
  let encoded = '';
  for (let index = 0; index < Number(meta.chunks); index += 1) {
    const chunk = props.getProperty(prefix + index);
    if (chunk === null) throw new Error('Potongan data ' + index + ' tidak ditemukan.');
    encoded += chunk;
  }
  const bytes = Utilities.base64Decode(encoded);
  // Utilities.ungzip() mewajibkan Blob mempunyai Content-Type non-null.
  const gzipBlob = Utilities.newBlob(
    bytes,
    'application/gzip',
    'pireki-monitor.json.gz'
  );
  const json = Utilities.ungzip(gzipBlob).getDataAsString('UTF-8');
  return JSON.parse(json);
}

