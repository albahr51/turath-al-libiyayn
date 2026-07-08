import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const sidebar = JSON.parse(readFileSync(join(root, 'src/data/sidebar-atiyatullah.json'), 'utf-8'));
const index = JSON.parse(readFileSync(join(root, 'src/data/atiyatullah-index.json'), 'utf-8'));
const printMappings = JSON.parse(readFileSync(join(root, 'src/data/print-mappings.json'), 'utf-8'));

// 1. Collect all sidebar slugs IN ORDER with their prefix info
const sidebarEntries = [];
function walk(obj, depth) {
  if (obj.link && obj.link.startsWith('/book/atiyatullah/')) {
    const slug = obj.link.split('/').pop();
    const parts = slug.split('-');
    const prefix = parseInt(parts[0]);
    const body = parts.slice(1).join('-');
    sidebarEntries.push({ slug, prefix, body, depth, title: obj.title });
  }
  if (obj.chapters) obj.chapters.forEach(c => { walk(c, depth + 1); if (c.sections) c.sections.forEach(s => walk(s, depth + 2)); });
  if (obj.sections) obj.sections.forEach(s => walk(s, depth + 1));
}
sidebar.forEach(i => walk(i, 0));

console.log(`Sidebar entries: ${sidebarEntries.length}`);

// 2. Build set of index slugs
const indexSlugs = new Set();
for (const section of index) {
  for (const item of section.items) {
    if (item.slug) indexSlugs.add(item.slug);
  }
}
console.log(`Index slugs: ${indexSlugs.size}`);

// 3. Identify ANCHORS: entries with source prefix (≥384) whose body is NOT an index slug
// These are chapter-level entries that were never modified
const anchors = [];
for (let i = 0; i < sidebarEntries.length; i++) {
  const e = sidebarEntries[i];
  if (e.prefix >= 384 && !indexSlugs.has(e.slug)) {
    anchors.push({ idx: i, slug: e.slug, prefix: e.prefix, body: e.body });
  }
}
console.log(`Anchors (chapters with source prefix): ${anchors.length}`);

// 4. Assign source pages to ALL sidebar entries by interpolating between anchors
const slugToSource = {};

// First pass: assign known source pages from anchors
for (const a of anchors) {
  slugToSource[sidebarEntries[a.idx].slug] = a.prefix;
}

// For each entry between anchors, assign sequential source pages
// Walk backwards from each anchor to fill preceding entries
for (let ai = 0; ai < anchors.length; ai++) {
  const anchor = anchors[ai];
  const anchorSource = anchor.prefix;
  
  // Determine the start of this "block"
  const startIdx = ai > 0 ? anchors[ai - 1].idx + 1 : 0;
  
  // Assign pages backward from the anchor
  for (let j = anchor.idx - 1; j >= startIdx; j--) {
    const e = sidebarEntries[j];
    if (!slugToSource[e.slug]) {
      // Each entry gets the next lower source page
      const distance = anchor.idx - j;
      const source = anchorSource - distance;
      if (source >= 1 && anchors[ai - 1] ? source > anchors[ai - 1].prefix : true) {
        slugToSource[e.slug] = source;
      }
    }
  }
}

// Handle entries after the last anchor
if (anchors.length > 0) {
  const lastAnchor = anchors[anchors.length - 1];
  for (let j = lastAnchor.idx + 1; j < sidebarEntries.length; j++) {
    const e = sidebarEntries[j];
    if (!slugToSource[e.slug]) {
      const distance = j - lastAnchor.idx;
      slugToSource[e.slug] = lastAnchor.prefix + distance;
    }
  }
}

// Handle entries before the first anchor
if (anchors.length > 0) {
  const firstAnchor = anchors[0];
  // Already handled by the backward walk above (ai=0, startIdx=0)
}

console.log(`Mapped entries: ${Object.keys(slugToSource).length}`);

// 5. Now extract only INDEX ITEM slugs and build the print mappings
// For each index slug, find its source page
const indexSources = [];
for (const section of index) {
  for (const item of section.items) {
    if (item.slug && slugToSource[item.slug]) {
      indexSources.push({
        slug: item.slug,
        userPage: parseInt(item.page),
        source: slugToSource[item.slug]
      });
    }
  }
}

// Sort by user page (which should also be sorted by source page)
indexSources.sort((a, b) => a.userPage - b.userPage);

// 6. INFLATE source pages based on user page gaps
// The sidebar assigns sequential source pages, but there are gaps between user pages
// that need to be reflected in source page assignments
const inflated = [];
let lastSource = null;
let lastUserPage = null;
for (let i = 0; i < indexSources.length; i++) {
  const item = indexSources[i];
  if (i === 0) {
    // First item keeps its original source
    inflated.push({ ...item, source: item.source });
    lastSource = item.source;
    lastUserPage = item.userPage;
  } else {
    // Calculate source based on user page gap
    const userGap = item.userPage - lastUserPage;
    const newSource = lastSource + userGap;
    inflated.push({ ...item, source: newSource });
    lastSource = newSource;
    lastUserPage = item.userPage;
  }
}

// 7. Build the clean print-mappings
const newAtiMap = {};
for (let i = 0; i < inflated.length; i++) {
  const item = inflated[i];
  const key = String(item.source);
  newAtiMap[key] = [item.slug];
  const next = inflated[i + 1];
  const endInfo = next ? `next at ${next.source - 1}` : 'last';
  // Range: starts at item.source, ends at next.source - 1
  const rangeStart = item.source;
  const rangeEnd = next ? next.source - 1 : item.source + 500;
  console.log(`ص ${item.userPage} → مصدر ${item.source} (النطاق: ${rangeStart}-${rangeEnd}): ${item.slug.substring(0, 40)}`);
}

printMappings['atiyatullah'] = newAtiMap;

// Sort keys
const sorted = {};
Object.keys(newAtiMap).sort((a, b) => parseInt(a) - parseInt(b)).forEach(k => { sorted[k] = newAtiMap[k]; });
printMappings['atiyatullah'] = sorted;

writeFileSync(join(root, 'src/data/print-mappings.json'), JSON.stringify(printMappings, null, 2), 'utf-8');

const pages = Object.keys(sorted).map(Number).sort((a, b) => a - b);
console.log(`\nDone. Entries: ${pages.length}, Range: ${pages[0]} - ${pages[pages.length - 1]}`);

// Verify: check for duplicates
const sourceSet = new Set(pages);
if (sourceSet.size !== pages.length) {
  console.log(`WARNING: ${pages.length - sourceSet.size} duplicate source pages!`);
}
