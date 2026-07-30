'use strict';

/**
 * GANTI nilai di bawah dengan URL Web App Google Apps Script Anda.
 * Gunakan URL deployment yang berakhiran /exec, bukan /dev.
 */
const APPS_SCRIPT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyfU5Vnunuz9xJp0_1_FOHPP8Zj8K-XvRyXPIujcK9NYIMr8x-gmfd7KEb19tbo29F4hg/exec';

const DASHBOARD_CONFIG = Object.freeze({
  staleAfterHours: 36,
  requestTimeoutMs: 30000,
  timezone: 'Asia/Jakarta',
  locale: 'id-ID',
});

const state = {
  payload: null,
  sites: [],
  search: '',
  status: 'all',
  sort: 'newest',
  loading: false,
};

const elements = {};

document.addEventListener('DOMContentLoaded', init);

function init() {
  cacheElements();
  bindEvents();

  if (!isEndpointConfigured()) {
    elements.setupNotice.classList.remove('hidden');
    elements.loadingState.classList.add('hidden');
    elements.footerStatus.textContent = 'Endpoint belum dikonfigurasi.';
    renderEmptySummary();
    return;
  }

  setJsonEndpointLink();
  loadMonitorData();
}

function cacheElements() {
  [
    'refreshButton', 'freshnessBadge', 'lastGenerated', 'lastGeneratedRelative',
    'setupNotice', 'errorNotice', 'errorMessage', 'backendWarning',
    'backendWarningMessage', 'totalCount', 'okCount', 'partialCount',
    'failedCount', 'resultCount', 'jsonEndpointLink', 'searchInput',
    'statusFilter', 'sortSelect', 'loadingState', 'emptyState',
    'tableWrapper', 'monitorTableBody', 'footerStatus', 'detailDialog',
    'dialogTitle', 'dialogContent',
  ].forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

function bindEvents() {
  elements.refreshButton.addEventListener('click', () => loadMonitorData());
  elements.searchInput.addEventListener('input', (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderSites();
  });
  elements.statusFilter.addEventListener('change', (event) => {
    state.status = event.target.value;
    renderSites();
  });
  elements.sortSelect.addEventListener('change', (event) => {
    state.sort = event.target.value;
    renderSites();
  });
  elements.monitorTableBody.addEventListener('click', handleTableClick);
}

function isEndpointConfigured() {
  return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:\?.*)?$/i
    .test(APPS_SCRIPT_ENDPOINT.trim());
}

function setJsonEndpointLink() {
  try {
    const url = new URL(APPS_SCRIPT_ENDPOINT);
    url.searchParams.set('pretty', '1');
    elements.jsonEndpointLink.href = url.toString();
    elements.jsonEndpointLink.classList.remove('hidden');
  } catch (error) {
    elements.jsonEndpointLink.classList.add('hidden');
  }
}

async function loadMonitorData() {
  if (state.loading || !isEndpointConfigured()) return;
  state.loading = true;
  setLoadingUi(true);
  hideError();

  try {
    const payload = await loadWithJsonp(APPS_SCRIPT_ENDPOINT);
    if (!payload || payload.ok !== true) {
      throw new Error(payload && payload.message
        ? payload.message
        : 'Endpoint mengembalikan data yang tidak valid.');
    }
    if (!Array.isArray(payload.sites)) {
      throw new Error('Properti sites tidak ditemukan pada JSON endpoint.');
    }

    state.payload = payload;
    state.sites = payload.sites;
    renderDashboard();
    elements.footerStatus.textContent =
      `Endpoint aktif · ${payload.sites.length} website tersedia`;
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
    elements.footerStatus.textContent = 'Endpoint tidak dapat dihubungi.';
  } finally {
    state.loading = false;
    setLoadingUi(false);
  }
}

/**
 * JSONP dipakai karena Apps Script Content Service melakukan redirect dan
 * header CORS-nya tidak dapat dikendalikan. Endpoint tetap menghasilkan JSON
 * biasa apabila dibuka tanpa parameter callback.
 */
function loadWithJsonp(endpoint) {
  return new Promise((resolve, reject) => {
    const callbackName = `__pirekiMonitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    let settled = false;

    const cleanup = () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      try {
        delete window[callbackName];
      } catch (error) {
        window[callbackName] = undefined;
      }
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Permintaan endpoint melewati batas waktu 30 detik.'));
    }, DASHBOARD_CONFIG.requestTimeoutMs);

    window[callbackName] = (payload) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      cleanup();
      reject(new Error(
        'Endpoint Apps Script gagal dimuat. Pastikan deployment dapat diakses oleh Anyone.'
      ));
    };

    const url = new URL(endpoint);
    url.searchParams.set('callback', callbackName);
    url.searchParams.set('_', String(Date.now()));
    script.src = url.toString();
    script.async = true;
    document.head.appendChild(script);
  });
}

function renderDashboard() {
  const payload = state.payload;
  const summary = normalizeSummary(payload);

  elements.totalCount.textContent = formatNumber(summary.total);
  elements.okCount.textContent = formatNumber(summary.ok);
  elements.partialCount.textContent = formatNumber(summary.partial);
  elements.failedCount.textContent = formatNumber(summary.failed);

  renderGeneratedTime(payload.generated_at);
  renderBackendWarning(payload.last_run_error);
  renderSites();
}

function normalizeSummary(payload) {
  const computed = { total: state.sites.length, ok: 0, partial: 0, failed: 0 };
  state.sites.forEach((site) => {
    if (site.status === 'ok') computed.ok += 1;
    else if (site.status === 'parsial') computed.partial += 1;
    else computed.failed += 1;
  });

  const summary = payload && payload.summary ? payload.summary : {};
  return {
    total: Number.isFinite(Number(summary.total)) ? Number(summary.total) : computed.total,
    ok: Number.isFinite(Number(summary.ok)) ? Number(summary.ok) : computed.ok,
    partial: Number.isFinite(Number(summary.partial)) ? Number(summary.partial) : computed.partial,
    failed: Number.isFinite(Number(summary.failed)) ? Number(summary.failed) : computed.failed,
  };
}

function renderGeneratedTime(value) {
  const date = parseDate(value);
  if (!date) {
    elements.lastGenerated.textContent = 'Tidak diketahui';
    elements.lastGeneratedRelative.textContent = 'Timestamp tidak tersedia';
    setFreshnessBadge('neutral', 'Waktu tidak diketahui');
    return;
  }

  elements.lastGenerated.textContent = formatDateTime(date);
  elements.lastGeneratedRelative.textContent = relativeTime(date);

  const ageHours = (Date.now() - date.getTime()) / 3600000;
  if (ageHours > DASHBOARD_CONFIG.staleAfterHours) {
    setFreshnessBadge('warning', 'Data terlambat diperbarui');
  } else {
    setFreshnessBadge('ok', 'Data terbaru tersedia');
  }
}

function setFreshnessBadge(type, text) {
  elements.freshnessBadge.className = `freshness-badge ${type}`;
  elements.freshnessBadge.innerHTML =
    '<span class="status-dot" aria-hidden="true"></span>' + escapeHtml(text);
}

function renderBackendWarning(error) {
  if (!error) {
    elements.backendWarning.classList.add('hidden');
    return;
  }
  const occurred = error.occurred_at ? ` pada ${formatDateTime(parseDate(error.occurred_at))}` : '';
  elements.backendWarningMessage.textContent =
    `${error.message || 'Kesalahan tidak diketahui'}${occurred}. Data sehat terakhir tetap ditampilkan.`;
  elements.backendWarning.classList.remove('hidden');
}

function renderSites() {
  if (!state.payload) return;
  const visible = getVisibleSites();
  const total = state.sites.length;

  elements.resultCount.textContent = visible.length === total
    ? `${formatNumber(total)} website ditampilkan`
    : `${formatNumber(visible.length)} dari ${formatNumber(total)} website ditampilkan`;

  elements.monitorTableBody.innerHTML = visible.map(renderSiteRow).join('');
  elements.emptyState.classList.toggle('hidden', visible.length !== 0);
  elements.tableWrapper.classList.toggle('hidden', visible.length === 0);
}

function getVisibleSites() {
  const filtered = state.sites.filter((site) => {
    const title = site.artikel_terbaru_judul || site.artikel_update_terakhir_judul || '';
    const haystack = `${site.website || ''} ${title} ${site.catatan || ''}`.toLowerCase();
    const matchesSearch = !state.search || haystack.includes(state.search);
    const matchesStatus = state.status === 'all' || site.status === state.status;
    return matchesSearch && matchesStatus;
  });

  return filtered.sort((a, b) => {
    if (state.sort === 'domain') {
      return domainFromUrl(a.website).localeCompare(
        domainFromUrl(b.website),
        DASHBOARD_CONFIG.locale
      );
    }
    if (state.sort === 'status') {
      const priority = { gagal: 0, parsial: 1, ok: 2 };
      const difference = (priority[a.status] ?? 3) - (priority[b.status] ?? 3);
      return difference || domainFromUrl(a.website).localeCompare(domainFromUrl(b.website));
    }

    const aTime = siteActivityTime(a);
    const bTime = siteActivityTime(b);
    return state.sort === 'oldest' ? aTime - bTime : bTime - aTime;
  });
}

function renderSiteRow(site) {
  const domain = domainFromUrl(site.website);
  const articleTitle = site.artikel_terbaru_judul || '';
  const updateTitle = site.artikel_update_terakhir_judul || '';
  const hasArticle = Boolean(articleTitle && site.url_artikel_terbaru);
  const status = statusMeta(site.status);
  const published = site.tanggal_terbit ? formatDateTime(parseDate(site.tanggal_terbit), true) : '—';
  const updatedDate = site.tanggal_update_artikel || site.sitemap_lastmod_terbaru;
  const updated = updatedDate ? formatDateTime(parseDate(updatedDate), true) : '—';
  const latestTitle = articleTitle || updateTitle || 'Belum ada judul yang terverifikasi';
  const latestUrl = hasArticle ? site.url_artikel_terbaru : site.url_update_artikel;
  const rowKey = encodeURIComponent(site.website || '');

  return `
    <tr>
      <td data-label="Website">
        <div class="site-cell">
          <span class="site-avatar" aria-hidden="true">${escapeHtml(domain.charAt(0).toUpperCase())}</span>
          <div>
            <a class="domain-link" href="${safeUrl(site.website)}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(domain)}
            </a>
            <span class="source-label">${escapeHtml(methodLabel(site.metode))}</span>
          </div>
        </div>
      </td>
      <td data-label="Status">
        <span class="status-pill ${status.className}">
          <span class="status-dot" aria-hidden="true"></span>${status.label}
        </span>
      </td>
      <td data-label="Artikel terbaru" class="article-cell">
        ${latestUrl
          ? `<a href="${safeUrl(latestUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(latestTitle)}</a>`
          : `<span>${escapeHtml(latestTitle)}</span>`}
        ${!articleTitle ? '<small>Perubahan halaman/produk</small>' : ''}
      </td>
      <td data-label="Terbit"><time>${escapeHtml(published)}</time></td>
      <td data-label="Update terakhir"><time>${escapeHtml(updated)}</time></td>
      <td class="actions-cell">
        <button class="detail-button" type="button" data-site-key="${rowKey}">Detail</button>
      </td>
    </tr>`;
}

function handleTableClick(event) {
  const button = event.target.closest('[data-site-key]');
  if (!button) return;
  const website = decodeURIComponent(button.dataset.siteKey || '');
  const site = state.sites.find((item) => item.website === website);
  if (site) openDetailDialog(site);
}

function openDetailDialog(site) {
  const status = statusMeta(site.status);
  elements.dialogTitle.textContent = domainFromUrl(site.website);

  const fields = [
    ['Status', `<span class="status-pill ${status.className}"><span class="status-dot"></span>${status.label}</span>`],
    ['Website', linkHtml(site.website, site.website)],
    ['Sitemap utama', linkHtml(site.sitemap, site.sitemap_status || site.sitemap)],
    ['Sitemap konten', linkHtml(site.sitemap_artikel_konten, site.sitemap_artikel_konten)],
    ['Artikel terbaru', linkHtml(site.url_artikel_terbaru, site.artikel_terbaru_judul || '—')],
    ['Tanggal terbit', dateOrDash(site.tanggal_terbit)],
    ['Artikel terakhir diubah', linkHtml(site.url_update_artikel, site.artikel_update_terakhir_judul || '—')],
    ['Tanggal perubahan', dateOrDash(site.tanggal_update_artikel)],
    ['Lastmod sitemap', dateOrDash(site.sitemap_lastmod_terbaru)],
    ['URL lastmod', linkHtml(site.sitemap_lastmod_url, site.sitemap_lastmod_url || '—')],
    ['Metode', escapeHtml(methodLabel(site.metode))],
    ['Catatan', escapeHtml(site.catatan || 'Tidak ada catatan.')],
  ];

  elements.dialogContent.innerHTML = fields.map(([label, value]) => `
    <div class="detail-row">
      <dt>${escapeHtml(label)}</dt>
      <dd>${value}</dd>
    </div>`).join('');

  if (typeof elements.detailDialog.showModal === 'function') {
    elements.detailDialog.showModal();
  } else {
    elements.detailDialog.setAttribute('open', '');
  }
}

function linkHtml(url, label) {
  const safe = safeUrl(url);
  if (!safe || safe === '#') return escapeHtml(label || '—');
  return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || url)}</a>`;
}

function dateOrDash(value) {
  return value ? escapeHtml(formatDateTime(parseDate(value))) : '—';
}

function setLoadingUi(loading) {
  elements.refreshButton.disabled = loading;
  elements.refreshButton.classList.toggle('is-loading', loading);
  elements.loadingState.classList.toggle('hidden', !loading || Boolean(state.payload));
  if (loading && !state.payload) {
    elements.tableWrapper.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
  }
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorNotice.classList.remove('hidden');
  elements.loadingState.classList.add('hidden');
  if (!state.payload) renderEmptySummary();
}

function hideError() {
  elements.errorNotice.classList.add('hidden');
}

function renderEmptySummary() {
  ['totalCount', 'okCount', 'partialCount', 'failedCount'].forEach((key) => {
    elements[key].textContent = '—';
  });
  elements.resultCount.textContent = 'Data belum tersedia';
}

function statusMeta(status) {
  if (status === 'ok') return { label: 'Normal', className: 'status-ok' };
  if (status === 'parsial') return { label: 'Perhatian', className: 'status-partial' };
  return { label: 'Gagal', className: 'status-failed' };
}

function methodLabel(method) {
  const labels = {
    wordpress: 'Sitemap + WordPress API',
    sitemap_only: 'Sitemap halaman/produk',
    sitemap_archive: 'Sitemap + arsip artikel',
  };
  return labels[method] || method || 'Sitemap';
}

function siteActivityTime(site) {
  const value = site.tanggal_terbit || site.tanggal_update_artikel || site.sitemap_lastmod_terbaru;
  const date = parseDate(value);
  return date ? date.getTime() : 0;
}

function parseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(date, compact = false) {
  if (!date) return '—';
  return new Intl.DateTimeFormat(DASHBOARD_CONFIG.locale, {
    timeZone: DASHBOARD_CONFIG.timezone,
    day: '2-digit',
    month: compact ? 'short' : 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date).replace(' pukul ', ', ');
}

function relativeTime(date) {
  if (!date) return 'Waktu tidak diketahui';
  const differenceMs = date.getTime() - Date.now();
  const absolute = Math.abs(differenceMs);
  let unit = 'minute';
  let divisor = 60000;
  if (absolute >= 86400000) {
    unit = 'day';
    divisor = 86400000;
  } else if (absolute >= 3600000) {
    unit = 'hour';
    divisor = 3600000;
  }
  const value = Math.round(differenceMs / divisor);
  return new Intl.RelativeTimeFormat(DASHBOARD_CONFIG.locale, { numeric: 'auto' })
    .format(value, unit);
}

function formatNumber(value) {
  return new Intl.NumberFormat(DASHBOARD_CONFIG.locale).format(Number(value) || 0);
}

function domainFromUrl(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch (error) {
    return String(value || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'http:' || url.protocol === 'https:' ? escapeHtml(url.toString()) : '#';
  } catch (error) {
    return '#';
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
