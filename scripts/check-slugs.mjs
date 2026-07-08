import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const contentDir = 'src/content/books/atiyatullah';
const pm = JSON.parse(readFileSync('src/data/print-mappings.json', 'utf-8'));
const atPm = pm['atiyatullah'];

// Collect all actual slugs from content files
const actualSlugs = new Map();
for (const f of readdirSync(contentDir)) {
  if (!f.endsWith('.md')) continue;
  const c = readFileSync(join(contentDir, f), 'utf-8');
  const m = c.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) continue;
  const fm = m[1];
  const slug = fm.match(/title:\s*"(.+?)"/)?.[1];
  const fileSlug = f.replace('.md', '');
  actualSlugs.set(fileSlug, fm.match(/slug:\s*"(.+?)"/)?.[1] || '');
}

// Check each print-mapping slug against actual files
let mismatches = [];
for (const [page, slugs] of Object.entries(atPm)) {
  for (const s of slugs) {
    if (!actualSlugs.has(s)) {
      mismatches.push({ page, slug: s });
    }
  }
}

console.log(`Print-mapping entries: ${Object.keys(atPm).length}`);
console.log(`Actual content files: ${actualSlugs.size}`);
console.log(`Mismatched slugs: ${mismatches.length}`);
for (const m of mismatches.slice(0, 20)) {
  console.log(`  Page ${m.page} -> "${m.slug}" NOT FOUND`);
}
if (mismatches.length > 20) console.log(`  ... and ${mismatches.length - 20} more`);
