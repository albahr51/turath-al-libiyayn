import { readFileSync } from 'fs';
const content = readFileSync('dist/_astro/index.astro_astro_type_script_index_0_lang.CWZjaWSa.js', 'utf-8');

// Find all var/function declarations at top level
const varIdx = content.indexOf('var e=');
const funcIdx = content.indexOf('function e(');
const addEventListenerIdx = content.indexOf('addEventListener');
const iifeIdx = content.indexOf('(function(){');

console.log('var e= at', varIdx);
console.log('function e() at', funcIdx);
console.log('addEventListener at', addEventListenerIdx);
console.log('IIFE at', iifeIdx);

// Show code between function e and addEventListener
if (funcIdx >= 0 && addEventListenerIdx > funcIdx) {
  const between = content.substring(funcIdx, addEventListenerIdx + 80);
  console.log('Code between function e and addEventListener:');
  console.log(between);
}

// Show what comes right before the IIFE
if (iifeIdx > 0) {
  console.log('Before IIFE (50 chars):', content.substring(iifeIdx - 50, iifeIdx));
}
