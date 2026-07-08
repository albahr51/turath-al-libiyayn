import { readFileSync } from 'fs';
const content = readFileSync('dist/_astro/index.astro_astro_type_script_index_0_lang.CWZjaWSa.js', 'utf-8');
console.log('Length:', content.length);
console.log('First 200:', content.substring(0, 200));
// Find the pattern
const idx = content.indexOf('JSON.parse');
if (idx >= 0) {
  console.log('JSON.parse at', idx);
  console.log('Context:', content.substring(idx, idx + 150));
  // Find the closing
  const closeIdx = content.indexOf(')`);', idx);
  if (closeIdx >= 0) {
    console.log('JSON data length:', closeIdx - idx - 12);
  }
}
// Find quote-body reference
const qbIdx = content.indexOf('quote-body');
if (qbIdx >= 0) {
  console.log('quote-body at', qbIdx);
  console.log('context:', content.substring(Math.max(0, qbIdx - 200), qbIdx + 100));
}
