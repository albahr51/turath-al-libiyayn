import { readFileSync, writeFileSync } from 'fs';

const filePath = 'src/data/extracted-quotes.json';
let content = readFileSync(filePath, 'utf-8');

// Find the problematic pattern: two consecutive opening braces
const doubleBrace = content.indexOf('  {,\n  {');
if (doubleBrace < 0) {
  // Try another pattern
  const idx = content.indexOf('  },\n  {\n  {');
  if (idx >= 0) {
    console.log('Found double brace at', idx);
    console.log('Context:', content.substring(idx, idx + 50));
    // Fix: remove extra brace
    content = content.substring(0, idx + 6) + content.substring(idx + 8);
    writeFileSync(filePath, content, 'utf-8');
    console.log('Fixed');
  } else {
    console.log('No double brace pattern found');
  }
}

// Now validate
try {
  const d = JSON.parse(content);
  console.log('JSON is valid, length:', d.length);
} catch(e) {
  console.log('Still invalid:', e.message);
}
