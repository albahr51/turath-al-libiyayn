import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

function findMdFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMdFiles(fullPath));
    } else if (entry.isFile() && extname(entry.name) === '.md') {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findMdFiles('src/content/books');
let fixedCount = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  
  // Find <div class="book-content"> and capture everything after it
  const marker = '<div class="book-content">';
  const idx = content.indexOf(marker);
  if (idx === -1) continue;
  
  const before = content.slice(0, idx + marker.length);
  let after = content.slice(idx + marker.length);
  const originalAfter = after;
  
  // Remove the first <div class="paragraph-wrap"> that contains <h1>, <h2>, or <h3>
  // This is almost always a duplicate of the chapter title
  after = after.replace(
    /^\s*<div class="paragraph-wrap"[^>]*>\s*<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>\s*<\/div>\s*/m,
    ''
  );
  
  // After removing the h1/h2/h3 duplicate, remove any immediately following
  // text-center paragraphs that contain decorative title fragments (white text, guillemets, etc.)
  // But keep text-center paragraphs that are actual descriptive content
  let changed;
  do {
    changed = false;
    after = after.replace(
      /^\s*<div class="paragraph-wrap">\s*<p class="text-center">[\s\S]*?<\/p>\s*<\/div>\s*/m,
      (match) => {
        // Check if this looks decorative (white color spans, guillemets around short text)
        const isDecorative = /color:\s*#FFFFFF/i.test(match) 
          || /color:\s*#000000/i.test(match);
        // If it's decorative, remove it
        if (isDecorative) {
          changed = true;
          return '';
        }
        return match;
      }
    );
  } while (changed);
  
  if (after !== originalAfter) {
    content = before + after;
    writeFileSync(file, content, 'utf8');
    fixedCount++;
    process.stdout.write(`Fixed: ${file}\n`);
  }
}

process.stdout.write(`\nFixed ${fixedCount} files\n`);