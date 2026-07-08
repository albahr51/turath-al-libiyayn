import { readFileSync } from 'fs';

const content = readFileSync('dist/_astro/index.astro_astro_type_script_index_0_lang.DT_A6KHf.js', 'utf-8');

// Extract the JSON string from the template literal
const start = content.indexOf('JSON.parse');
const tStart = content.indexOf('`', start) + 1;
// Find matching closing backtick - search backwards from the function t declaration
const funcT = content.indexOf('function t()');
const jsonStr = content.substring(tStart, funcT - 1);  // -1 for backtick

console.log('JSON string from', tStart, 'to', funcT, 'length:', jsonStr.length);

// Check for unescaped backticks in the JSON
const backtickIdx = jsonStr.indexOf('`');
if (backtickIdx >= 0) {
  console.log('UNESCAPED BACKTICK at position', backtickIdx);
  console.log('Context:', jsonStr.substring(Math.max(0, backtickIdx - 30), backtickIdx + 30));
} else {
  console.log('No unescaped backticks found');
}

// Also check for ${ sequences
const dollarBraceIdx = jsonStr.indexOf('$' + '{');
if (dollarBraceIdx >= 0) {
  console.log('${ found at', dollarBraceIdx);
} else {
  console.log('No ${ found');
}

// Validate JSON
try {
  JSON.parse(jsonStr);
  console.log('JSON is valid');
} catch(e) {
  console.log('JSON invalid:', e.message);
}
