import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const sidebar = JSON.parse(readFileSync(join(root, 'src/data/sidebar-atiyatullah.json'), 'utf-8'));
const index = JSON.parse(readFileSync(join(root, 'src/data/atiyatullah-index.json'), 'utf-8'));
const printMappings = JSON.parse(readFileSync(join(root, 'src/data/print-mappings.json'), 'utf-8'));

// Build set of index slug bodies (items that got updated by rebuild script)
const indexBodies = new Set();
for (const section of index) {
  for (const item of section.items) {
    if (item.slug) {
      const body = item.slug.replace(/^\d+-/, '');
      if (body) indexBodies.add(body);
    }
  }
}
console.log(`Index slug bodies: ${indexBodies.size}`);

// Collect all sidebar slugs in order
const sidebarSlugs = [];
function collect(obj) {
  if (obj.link && obj.link.startsWith('/book/atiyatullah/')) sidebarSlugs.push(obj.link.split('/').pop());
  if (obj.chapters) obj.chapters.forEach(c => { collect(c); if (c.sections) c.sections.forEach(s => collect(s)); });
  if (obj.sections) obj.sections.forEach(s => collect(s));
}
sidebar.forEach(i => collect(i));
console.log(`Total sidebar links: ${sidebarSlugs.length}`);

// For each slug, determine if it has OLD page prefix (source PDF page) or NEW prefix (user page)
// An item has OLD prefix if its body was NOT updated by rebuild script AND prefix >= 384
// Items with prefix < 384 that weren't updated are actually user-page-prefixed items the script missed
const slugStatus = sidebarSlugs.map(slug => {
  const parts = slug.split('-');
  const prefix = parseInt(parts[0]);
  const body = parts.slice(1).join('-');
  const wasUpdated = indexBodies.has(body);
  // isOldPrefix: body not in index AND prefix >= 384 (old PDF pages for content start at 384)
  const isOldPrefix = !wasUpdated && prefix >= 384;
  return { slug, body, prefix, wasUpdated, isOldPrefix };
});

// Items with OLD prefixes (isOldPrefix=true) serve as anchors.
// All other items (updated + non-updated-false-prefix) get computed from nearest anchors.
const slugToSourcePage = {};

// First pass: assign old pages from items with true old prefixes
for (const entry of slugStatus) {
  if (entry.isOldPrefix) {
    slugToSourcePage[entry.slug] = entry.prefix;
  }
}

// Walk backwards from each old-prefix anchor to fill in preceding items
let lastAnchorIdx = -1;
for (let i = 0; i < slugStatus.length; i++) {
  if (slugStatus[i].isOldPrefix) {
    const oldPage = slugToSourcePage[slugStatus[i].slug];
    const startIdx = lastAnchorIdx + 1;
    for (let j = startIdx; j < i; j++) {
      if (!slugToSourcePage[slugStatus[j].slug]) {
        slugToSourcePage[slugStatus[j].slug] = oldPage - (i - j);
      }
    }
    lastAnchorIdx = i;
  }
}

// Walk forward from the last anchor
if (lastAnchorIdx < slugStatus.length - 1) {
  const lastOldPage = slugToSourcePage[slugStatus[lastAnchorIdx].slug] || 384;
  for (let i = lastAnchorIdx + 1; i < slugStatus.length; i++) {
    if (!slugToSourcePage[slugStatus[i].slug]) {
      slugToSourcePage[slugStatus[i].slug] = lastOldPage + (i - lastAnchorIdx);
    }
  }
}

// Handle case where first items have no anchor before them
if (!slugToSourcePage[slugStatus[0].slug]) {
  const firstAnchor = slugStatus.findIndex(e => e.isOldPrefix);
  if (firstAnchor >= 0) {
    const firstOldPage = slugToSourcePage[slugStatus[firstAnchor].slug];
    for (let i = 0; i < firstAnchor; i++) {
      slugToSourcePage[slugStatus[i].slug] = firstOldPage - (firstAnchor - i);
    }
  } else {
    for (let i = 0; i < slugStatus.length; i++) {
      slugToSourcePage[slugStatus[i].slug] = 384 + i;
    }
  }
}

console.log(`Mapped: ${Object.keys(slugToSourcePage).length} unique slugs`);
let updatedItems = 0, originalItems = 0;
const samplePages = [];
for (const entry of slugStatus) {
  const sp = slugToSourcePage[entry.slug];
  if (sp) {
    if (entry.wasUpdated) updatedItems++;
    else originalItems++;
    if (samplePages.length < 10) samplePages.push(`${entry.slug.substring(0,25)} → ${sp}`);
  }
}
console.log(`Updated items computed: ${updatedItems}, Original items kept: ${originalItems}`);
console.log('Samples:');
samplePages.forEach(s => console.log('  ' + s));

// Build print-mappings: group slugs by source page
const newAtiMap = {};
for (const [slug, sourcePage] of Object.entries(slugToSourcePage)) {
  const key = String(sourcePage);
  if (!newAtiMap[key]) newAtiMap[key] = [];
  if (!newAtiMap[key].includes(slug)) newAtiMap[key].push(slug);
}

printMappings['atiyatullah'] = newAtiMap;
writeFileSync(join(root, 'src/data/print-mappings.json'), JSON.stringify(printMappings, null, 2), 'utf-8');
console.log(`Done. Print-mappings has ${Object.keys(newAtiMap).length} entries`);

const pages = Object.keys(newAtiMap).map(Number).sort((a,b)=>a-b);
console.log(`Page range: ${pages[0]} - ${pages[pages.length-1]}`);
console.log(`First 10 source pages: ${pages.slice(0,10).join(', ')}`);
