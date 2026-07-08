import { readFileSync } from 'fs';
const content = readFileSync('dist/_astro/index.astro_astro_type_script_index_0_lang.CWZjaWSa.js', 'utf-8');

// Show code before addEventListener
const aeIdx = 400716;
const start = Math.max(0, aeIdx - 800);
console.log('Code before addEventListener:');
console.log(content.substring(start, aeIdx + 50));
