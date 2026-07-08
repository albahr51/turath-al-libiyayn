import { readFileSync } from 'fs';

const content = readFileSync('dist/_astro/index.astro_astro_type_script_index_0_lang.DT_A6KHf.js', 'utf-8');

// Check for DOMContentLoaded patterns
const dclRegex = /DOMContentLoaded/g;
const matches = content.match(dclRegex);
console.log('DOMContentLoaded count:', matches ? matches.length : 0);

// Find where the quote-body getElementById is
const qbIdx = content.indexOf('getElementById(`quote-body`)');
if (qbIdx >= 0) {
  // Go back to find if it's inside a DOMContentLoaded callback
  const before = content.substring(Math.max(0, qbIdx - 500), qbIdx);
  console.log('Before quote-body getElementById:');
  console.log(before);
}
