import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const index = JSON.parse(readFileSync(join(root, 'src/data/atiyatullah-index.json'), 'utf-8'));
const printMappings = JSON.parse(readFileSync(join(root, 'src/data/print-mappings.json'), 'utf-8'));

// Collect all index items with slugs, sorted by user page number
const items = [];
for (const section of index) {
  for (const item of section.items) {
    if (item.slug) {
      items.push({ slug: item.slug, userPage: parseInt(item.page) });
    }
  }
}
items.sort((a, b) => a.userPage - b.userPage);

console.log(`عدد المدخلات: ${items.length}`);

// Build print-mappings: key = user page number, value = [slug]
// Range: from key to next key - 1
const newAtiMap = {};
for (let i = 0; i < items.length; i++) {
  const item = items[i];
  const key = String(item.userPage);
  newAtiMap[key] = [item.slug];
  const next = items[i + 1];
  const rangeEnd = next ? next.userPage - 1 : 2500;
  console.log(`ص ${item.userPage} → نطاق PDF: ${item.userPage}-${rangeEnd} ← ${item.slug.substring(0, 50)}`);
}

printMappings['atiyatullah'] = newAtiMap;

// Sort keys
const sorted = {};
Object.keys(newAtiMap).sort((a, b) => parseInt(a) - parseInt(b)).forEach(k => { sorted[k] = newAtiMap[k]; });
printMappings['atiyatullah'] = sorted;

writeFileSync(join(root, 'src/data/print-mappings.json'), JSON.stringify(printMappings, null, 2), 'utf-8');
console.log(`\nتم. ${Object.keys(sorted).length} مدخلاً`);
