import { internalLinksMap } from '../data/internalLinks';

const ABSOLUTE_PREFIX = /^https?:\/\/pireki\.id/i;
const NON_PAGE = /^(mailto:|tel:|javascript:|data:|#)/i;
// Protokol-relative (//host/path) bukan path internal kita.
const PROTOCOL_RELATIVE = /^\/\/[a-z0-9-]+(\.[a-z0-9-]+)+/i;
// Aset statis (gambar, css, js, font, pdf) tidak boleh diberi trailing slash.
const FILE_EXTENSION = /\.[a-z0-9]{1,8}$/i;

/**
 * Bangun URL internal dalam bentuk canonical situs: selalu memakai trailing slash.
 *
 * Astro menghasilkan halaman sebagai `<dir>/index.html` dan BaseHead.astro memakai
 * `Astro.url.pathname` untuk canonical, sehingga bentuk canonical selalu berakhir
 * dengan `/`. Tanpa normalisasi ini, link internal seperti `/blog/slug` akan
 * menunjuk varian non-canonical dan halaman canonical-nya tercatat nol inlink
 * (masalah Ahrefs "Canonical URL has no incoming internal links").
 *
 * Semua href internal di situs harus dibuat lewat helper ini, bukan ditulis manual.
 */
export function u(path: string): string {
  if (!path) return '/';
  if (NON_PAGE.test(path) || PROTOCOL_RELATIVE.test(path)) return path;
  // URL domain lain tidak boleh disentuh.
  const isAbsolute = ABSOLUTE_PREFIX.test(path);
  if (/^https?:\/\//i.test(path) && !isAbsolute) return path;

  const [beforeHash, hash] = path.split('#');
  const [beforeQuery, query] = beforeHash.split('?');

  let clean = beforeQuery.replace(ABSOLUTE_PREFIX, '');
  // Aset statis: biarkan persis seperti aslinya.
  const lastSegment = clean.replace(/\/+$/, '').split('/').pop() || '';
  if (FILE_EXTENSION.test(lastSegment)) {
    return isAbsolute ? 'https://pireki.id' + clean : clean;
  }

  // Normalisasi separator, lalu pastikan trailing slash untuk path direktori.
  clean = clean.replace(/\/{2,}/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
  let out = clean === '' ? '/' : '/' + clean + '/';

  if (query) out += '?' + query;
  if (hash) out += '#' + hash;
  return isAbsolute ? 'https://pireki.id' + out : out;
}

export function applyInternalLinks(content: string, usedLinks: Set<string> = new Set()): string {
  if (!content) return content;

  const lines = content.split('\n');

  // Resolve synonyms/aliases, lalu normalkan ke bentuk canonical agar
  // varian trailing slash berbeda tidak terhitung sebagai target terpisah.
  const resolvedMap: Record<string, string> = {};
  for (const kw in internalLinksMap) {
    let target = internalLinksMap[kw];
    if (!target.startsWith('http')) {
      target = internalLinksMap[target] || target;
    }
    resolvedMap[kw] = u(target);
  }

  // Sort keywords from longest to shortest
  const keywords = Object.keys(resolvedMap).sort((a, b) => b.length - a.length);

  const processedLines = lines.map(line => {
    // Ignore headings or existing markdown links/images
    if (line.trim().startsWith('#') || line.includes('![')) return line;

    let newLine = line;
    keywords.forEach(kw => {
      const url = resolvedMap[kw];
      if (!usedLinks.has(url)) {
        // Regex: Find keyword (case-insensitive) that is not already inside a markdown link
        const regex = new RegExp(`(?<!\\[)\\b(${kw})\\b(?![^\\[]*\\])`, 'gi');
        
        if (regex.test(newLine)) {
          newLine = newLine.replace(regex, (match) => {
            // Link relatif agar tidak memicu "about:blank#blocked", tetap canonical.
            let finalUrl = url;
            if (finalUrl.startsWith('https://pireki.id')) {
              finalUrl = finalUrl.replace('https://pireki.id', '');
              if (finalUrl === '') finalUrl = '/';
            }
            return `[${match}](${finalUrl})`;
          });
          usedLinks.add(url);
        }
      }
    });
    return newLine;
  });

  return processedLines.join('\n');
}
