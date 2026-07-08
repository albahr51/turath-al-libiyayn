import { readFileSync } from 'fs';
const content = readFileSync('dist/_astro/index.astro_astro_type_script_index_0_lang.CWZjaWSa.js', 'utf-8');

// Show the entire IIFE
const iifeStart = 400755;
// Find the end - look for the pattern that closes the IIFE
const endIdx = content.indexOf(')()', iifeStart);
if (endIdx > 0) {
  console.log('IIFE from', iifeStart, 'to', endIdx + 3);
  console.log('Full IIFE:');
  console.log(content.substring(iifeStart, endIdx + 20));
}
