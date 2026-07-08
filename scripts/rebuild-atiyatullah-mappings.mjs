import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const sidebar = JSON.parse(readFileSync(join(root, 'src/data/sidebar-atiyatullah.json'), 'utf-8'));
const index = JSON.parse(readFileSync(join(root, 'src/data/atiyatullah-index.json'), 'utf-8'));
const printMappings = JSON.parse(readFileSync(join(root, 'src/data/print-mappings.json'), 'utf-8'));

// Collect ALL sidebar slugs in order (with their source page prefix if present)
const sidebarEntries = [];
function collect(obj, depth = 0) {
  if (obj.link && obj.link.startsWith('/book/atiyatullah/')) {
    const slug = obj.link.split('/').pop();
    const parts = slug.split('-');
    const prefix = parseInt(parts[0]);
    sidebarEntries.push({ slug, prefix, depth, title: obj.title });
  }
  if (obj.chapters) obj.chapters.forEach(c => { collect(c, depth + 1); if (c.sections) c.sections.forEach(s => collect(s, depth + 2)); });
  if (obj.sections) obj.sections.forEach(s => collect(s, depth + 1));
}
sidebar.forEach(i => collect(i));

console.log(`Total sidebar entries: ${sidebarEntries.length}`);

// Build set of index item slugs (these are the ONLY ones we want in print-mappings)
const indexSlugs = new Set();
for (const section of index) {
  for (const item of section.items) {
    if (item.slug) indexSlugs.add(item.slug);
  }
}
console.log(`Index item slugs: ${indexSlugs.size}`);

// Identify RELIABLE anchors: sidebar entries whose prefix is a source page number (>= 384)
// and whose body is NOT an index item slug (these are chapter-level entries that weren't modified)
const anchors = [];
for (const entry of sidebarEntries) {
  const body = entry.slug.slice(entry.slug.indexOf('-') + 1);
  if (entry.prefix >= 384 && !indexSlugs.has(entry.slug)) {
    anchors.push(entry);
  }
}
console.log(`Reliable anchors (chapter-level with source prefix): ${anchors.length}`);

// Map: index slug → source page
const indexSlugToSource = {};

// For index items, try to find their source page from anchors
// Strategy: find the anchor that matches or is closest in sidebar order
for (const iSlug of indexSlugs) {
  // Find this slug's position in sidebar entries
  const idx = sidebarEntries.findIndex(e => e.slug === iSlug);
  if (idx === -1) {
    // Slug not in sidebar - try current printMappings
    for (const [ps, slugs] of Object.entries(printMappings['atiyatullah'] || {})) {
      if (slugs.includes(iSlug)) {
        indexSlugToSource[iSlug] = parseInt(ps);
        break;
      }
    }
    continue;
  }

  // Find the nearest anchor that is AT or AFTER this entry in sidebar order
  // (the anchor should be the first chapter of this section)
  let nearestAnchor = null;
  for (let j = idx; j < sidebarEntries.length; j++) {
    if (anchors.includes(sidebarEntries[j])) {
      nearestAnchor = sidebarEntries[j];
      break;
    }
  }

  if (nearestAnchor) {
    indexSlugToSource[iSlug] = nearestAnchor.prefix;
  } else {
    // No anchor found after - try before
    for (let j = idx; j >= 0; j--) {
      if (anchors.includes(sidebarEntries[j])) {
        indexSlugToSource[iSlug] = sidebarEntries[j].prefix;
        break;
      }
    }
  }
}

console.log(`Mapped index slugs: ${Object.keys(indexSlugToSource).length}`);

// Build the index item order
const itemOrder = [];
for (const section of index) {
  for (const item of section.items) {
    if (item.slug && indexSlugToSource[item.slug]) {
      itemOrder.push({ slug: item.slug, page: parseInt(item.page), source: indexSlugToSource[item.slug] });
    }
  }
}

// Sort by user page number
itemOrder.sort((a, b) => a.page - b.page);

// Build clean print-mappings: each key is a source page, value is [slug]
const newAtiMap = {};
for (let i = 0; i < itemOrder.length; i++) {
  const item = itemOrder[i];
  const startSource = item.source;
  const nextItem = itemOrder[i + 1];
  const endSource = nextItem ? nextItem.source - 1 : startSource + 500;
  newAtiMap[String(startSource)] = [item.slug];
  console.log(`ص ${item.page} → مصدر ${startSource} (${startSource}-${endSource}): ${item.slug.substring(0, 40)}`);
}

printMappings['atiyatullah'] = newAtiMap;

// Sort keys
const sorted = {};
Object.keys(newAtiMap).sort((a, b) => parseInt(a) - parseInt(b)).forEach(k => { sorted[k] = newAtiMap[k]; });
printMappings['atiyatullah'] = sorted;

writeFileSync(join(root, 'src/data/print-mappings.json'), JSON.stringify(printMappings, null, 2), 'utf-8');
console.log(`\nDone. Print-mappings for Atiyatullah: ${Object.keys(sorted).length} entries`);
console.log(`Page range: ${Object.keys(sorted)[0]} - ${Object.keys(sorted)[Object.keys(sorted).length - 1]}`);
