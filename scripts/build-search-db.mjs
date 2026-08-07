import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
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
const texts = [];
const dict = [];
const dictMap = new Map();
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
  const order = parseInt(fm.match(/order:\s*(\d+)/)?.[1] || '0', 10);
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
  const w = [...new Set(ntext.split(/\s+/).filter((w) => w.length >= 2).map(stemWord))].map((s) => {
    let i = dictMap.get(s);
    if (i === undefined) {
      i = dict.length;
      dictMap.set(s, i);
      dict.push(s);
    }
    return i;
  });

  docs.push({ id: count, ti: title, sl: slug, au: author, o: order, w });
  texts.push(ntext);
}

console.log(`Indexed ${count} documents`);
console.log(`Dictionary: ${dict.length} stems`);

const mb = (s) => (Buffer.byteLength(s, 'utf-8') / 1024 / 1024).toFixed(1);

const meta = JSON.stringify({ d: dict, docs });
writeFileSync(join(outputDir, 'search-meta.json'), meta);
console.log(`search-meta.json: ${mb(meta)}MB`);

const text = JSON.stringify(texts);
writeFileSync(join(outputDir, 'search-text.json'), text);
console.log(`search-text.json: ${mb(text)}MB`);

const oldPath = join(outputDir, 'search-index.json');
if (existsSync(oldPath)) rmSync(oldPath);
