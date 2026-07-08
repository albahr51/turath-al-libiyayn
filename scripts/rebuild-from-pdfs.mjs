import { readFileSync, readdirSync, renameSync, writeFileSync, existsSync } from 'fs';

function stripDiacritics(s) {
  return s.replace(/[\u064B-\u065F\u0670\u0610-\u061A]/g, '');
}

const contentDir = 'src/content/books/atiyatullah';
const pdfDir = 'public/media/extracted/atiyatullah';
const pmPath = 'src/data/print-mappings.json';

// Read PDF slugs (these are the desired slugs)
const pdfSlugs = readdirSync(pdfDir)
  .filter(f => f.endsWith('.pdf'))
  .map(f => f.replace('.pdf', ''))
  // Keep only numeric-prefixed slugs (user page number)
  .filter(slug => /^\d+-/.test(slug));

console.log(`PDF slugs: ${pdfSlugs.length}`);

// Build: normalized suffix → desired slug from PDF
const suffixToDesired = {};
for (const slug of pdfSlugs) {
  const dash = slug.indexOf('-');
  if (dash === -1) continue;
  const suffix = slug.substring(dash + 1);
  const normSuffix = stripDiacritics(suffix);
  // Only keep the FIRST mapping (if duplicates, first one wins)
  if (!suffixToDesired[normSuffix]) {
    suffixToDesired[normSuffix] = slug;
  }
}

// Read content files
const contentFiles = readdirSync(contentDir).filter(f => f.endsWith('.md'));

// Build: normalized suffix → content slug
const suffixToContent = {};
for (const f of contentFiles) {
  const slug = f.replace('.md', '');
  const dash = slug.indexOf('-');
  if (dash === -1) continue;
  const suffix = slug.substring(dash + 1);
  suffixToContent[stripDiacritics(suffix)] = slug;
}

// For each content file, check if it matches a PDF slug
let renamed = 0;
let updatedFrontmatter = 0;
const filesProcessed = new Set();

for (const f of contentFiles) {
  const contentSlug = f.replace('.md', '');
  const dash = contentSlug.indexOf('-');
  if (dash === -1) continue;
  const suffix = contentSlug.substring(dash + 1);
  const normSuffix = stripDiacritics(suffix);

  const desiredSlug = suffixToDesired[normSuffix];
  if (!desiredSlug) continue; // No matching PDF slug

  if (contentSlug === desiredSlug) {
    // Already correct, just ensure frontmatter matches
    const fullPath = `${contentDir}/${f}`;
    let content = readFileSync(fullPath, 'utf-8');
    const slugMatch = content.match(/^slug:\s*"([^"]*)"/m);
    if (slugMatch && slugMatch[1] !== desiredSlug) {
      content = content.replace(/^slug:\s*"[^"]*"/m, `slug: "${desiredSlug}"`);
      writeFileSync(fullPath, content, 'utf-8');
      updatedFrontmatter++;
    }
    filesProcessed.add(normSuffix);
    filesProcessed.add('pm_' + desiredSlug);
    continue;
  }

  // Need to rename
  const oldPath = `${contentDir}/${f}`;
  const newPath = `${contentDir}/${desiredSlug}.md`;

  if (!existsSync(oldPath)) {
    console.log(`File gone: ${oldPath}`);
    continue;
  }

  if (existsSync(newPath)) {
    console.log(`Target exists: ${newPath}, skipping rename from ${f}`);
    // Just update the frontmatter of the old file? No, the old file needs to be merged
    // Actually, the content is the same, just slug changed. Let me still update.
    // But if the target exists, it was already renamed from another content file.
    // This means two content files map to the same desired slug (unlikely but possible).
    // Update the current file's slug to match.
    let content = readFileSync(oldPath, 'utf-8');
    content = content.replace(/^slug:\s*"[^"]*"/m, `slug: "${desiredSlug}"`);
    writeFileSync(oldPath, content, 'utf-8');
    // Don't rename, just update
    updatedFrontmatter++;
    filesProcessed.add(normSuffix);
    continue;
  }

  try {
    let content = readFileSync(oldPath, 'utf-8');
    content = content.replace(/^slug:\s*"[^"]*"/m, `slug: "${desiredSlug}"`);
    writeFileSync(oldPath, content, 'utf-8');
    renameSync(oldPath, newPath);
    renamed++;
    filesProcessed.add(normSuffix);
    console.log(`Renamed: ${f} -> ${desiredSlug}.md`);
  } catch (e) {
    console.log(`Failed: ${f} -> ${desiredSlug}.md: ${e.message}`);
  }
}

console.log(`\nRenamed: ${renamed}, Updated frontmatter: ${updatedFrontmatter}`);

// Rebuild print-mappings from PDF slugs
const newPm = { ...JSON.parse(readFileSync(pmPath, 'utf-8')) };

// Group PDF slugs by user page number
const pageToSlugs = {};
for (const slug of pdfSlugs) {
  const page = slug.split('-')[0];
  if (!pageToSlugs[page]) pageToSlugs[page] = [];
  pageToSlugs[page].push(slug);
}

newPm['atiyatullah'] = pageToSlugs;
writeFileSync(pmPath, JSON.stringify(newPm, null, 2));
console.log(`Rebuilt Atiyatullah print-mappings: ${Object.keys(pageToSlugs).length} pages`);
