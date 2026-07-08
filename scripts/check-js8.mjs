import { readFileSync } from 'fs';

const content = readFileSync('dist/_astro/index.astro_astro_type_script_index_0_lang.DT_A6KHf.js', 'utf-8');

// Check for DOMContentLoaded callbacks
const dclCalls = [...content.matchAll(/addEventListener\(`DOMContentLoaded`,(\w+|function\s*\([^)]*\))/g)];
dclCalls.forEach((m, i) => {
  console.log(`DCL callback ${i}:`, m[1].substring(0, 80));
});

// Check for potential issues: does the first callback error?
// Look for the highlightScholarNames function
const hsIdx = content.indexOf('function');
console.log('\nFirst function declaration:');
console.log(content.substring(hsIdx, hsIdx + 100));

// Check what variables are declared
const varDeclares = [...content.matchAll(/(?:var|let|const)\s+(\w+)/g)];
console.log('\nVariable declarations:', varDeclares.map(m => m[1]).join(', '));

// Check the first DCL callback code - could it error?
const f1Start = content.indexOf('addEventListener(`DOMContentLoaded`,');
const after1 = content.indexOf(',', f1Start) + 1;
const f1Name = content.substring(after1, content.indexOf(');', after1)).trim();
console.log('\nFirst DCL handler name:', f1Name);

// Check the second DCL callback - is it properly formed?
const f2Start = content.indexOf('addEventListener(`DOMContentLoaded`,', f1Start + 10);
const after2 = content.indexOf(',', f2Start) + 1;
console.log('\nSecond DCL handler starts at', after2);
console.log('Second DCL handler:', content.substring(after2, after2 + 120));
