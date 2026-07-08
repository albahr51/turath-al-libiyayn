import { readFileSync } from 'fs';

const content = readFileSync('dist/_astro/index.astro_astro_type_script_index_0_lang.DT_A6KHf.js', 'utf-8');
console.log('Content length:', content.length);

// Get the raw content around start
const start = content.indexOf('JSON.parse');
if (start >= 0) {
  console.log('JSON.parse found at', start);
  console.log('Context:', content.substring(start, start + 100));
} else {
  console.log('JSON.parse NOT found');
  console.log('First 300:', content.substring(0, 300));
}

// Check what's at the start
console.log('Start:', content.substring(0, 50));
