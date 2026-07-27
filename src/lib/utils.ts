import { internalLinksMap } from '../data/internalLinks';

export function applyInternalLinks(content: string, usedLinks: Set<string> = new Set()): string {
  if (!content) return content;

  const lines = content.split('\n');

  // Resolve synonyms/aliases
  const resolvedMap: Record<string, string> = {};
  for (const kw in internalLinksMap) {
    let target = internalLinksMap[kw];
    if (!target.startsWith('http')) {
      target = internalLinksMap[target] || target;
    }
    resolvedMap[kw] = target;
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
            // Convert absolute pireki.id URLs to relative paths to avoid "about:blank#blocked"
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
