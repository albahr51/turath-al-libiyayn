import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const contentDir = join(root, 'src', 'content', 'books');
const outputDir = join(root, 'public', 'search');

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

// Arabic normalization (same as ES Arabic analyzer)
function norm(t) {
  return t
    .replace(/[\u0610-\u061A\u064B-\u0652\u0670\u06D6-\u06ED\u08F0-\u08FF]/g, '')  // remove diacritics (incl. Quranic)
    .replace(/[إأآا]/g, 'ا')                      // normalize alef
    .replace(/[ى]/g, 'ي')                          // normalize alif maqsura → yeh
    .replace(/[ة]/g, 'ه')                          // normalize ta marbouta → heh
    .replace(/[ؤ]/g, 'و')                          // waw with hamza → waw
    .replace(/[ئ]/g, 'ي');                         // yeh with hamza → yeh
}

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (extname(entry.name) === '.md') files.push(full);
  }
  return files;
}

const files = walk(contentDir);
console.log(`Found ${files.length} content files`);

const docs = [];
let count = 0;

for (const file of files) {
  const raw = readFileSync(file, 'utf-8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) continue;

  const fm = match[1];
  const body = match[2];
  const title = fm.match(/title:\s*"(.+?)"/)?.[1] || '';
  const slug = fm.match(/slug:\s*"(.+?)"/)?.[1] || '';
  const author = fm.match(/author:\s*"(.+?)"/)?.[1] || '';
  if (!slug) continue;

  let clean = body.replace(/<[^>]*data-pagefind-ignore[^>]*>[\s\S]*?<\/[^>]+>/gi, ' ');
  const text = clean
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text || text.length < 20) continue;

  count++;
  const ntext = norm(text);
  const words = [...new Set(ntext.split(/\s+/).filter(w => w.length >= 2))];

  docs.push({
    id: count,
    title,
    slug,
    author,
    // Normalized text for phrase matching (truncated to 10K to keep index small)
    t: ntext.substring(0, 10000),
    // Unique normalized words for strict AND
    w: words,
    // Preview (original text, truncated)
    p: text.substring(0, 350)
  });
}

console.log(`Indexed ${count} documents`);

// Save compact JSON index
const slim = docs.map(d => ({ id: d.id, t: d.t, w: d.w, p: d.p, title: d.title, slug: d.slug, author: d.author }));
const jsonPath = join(outputDir, 'search-index.json');
writeFileSync(jsonPath, JSON.stringify(slim));
const mb = (Buffer.byteLength(JSON.stringify(slim), 'utf-8') / 1024 / 1024).toFixed(1);
console.log(`JSON index: ${mb}MB`);
