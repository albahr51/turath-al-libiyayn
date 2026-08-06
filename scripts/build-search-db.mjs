import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { normArabic, stemWord } from '../src/scripts/search-common.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const contentDir = join(root, 'src', 'content', 'books');
const outputDir = join(root, 'public', 'search');

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

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
  const ntext = normArabic(text);
  const words = [...new Set(ntext.split(/\s+/).filter(w => w.length >= 2).map(stemWord))];

  docs.push({
    id: count,
    title,
    slug,
    author,
    t: ntext,
    w: words
  });
}

console.log(`Indexed ${count} documents`);

const jsonPath = join(outputDir, 'search-index.json');
writeFileSync(jsonPath, JSON.stringify(docs));
const mb = (Buffer.byteLength(JSON.stringify(docs), 'utf-8') / 1024 / 1024).toFixed(1);
console.log(`JSON index: ${mb}MB`);
