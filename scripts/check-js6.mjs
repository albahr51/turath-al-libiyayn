import { readFileSync } from 'fs';

const content = readFileSync('dist/_astro/index.astro_astro_type_script_index_0_lang.DT_A6KHf.js', 'utf-8');

// Find the JSON string
const start = content.indexOf('JSON.parse');
const tStart = content.indexOf('`', start) + 1;

// Find the last quote object before the function declaration
const funcT = content.indexOf('function t()');
const jsonEnd = funcT - 1;  // This should be the backtick

// Check the last 200 chars before function t()
console.log('Last 200 chars before function t():');
console.log(content.substring(jsonEnd - 200, jsonEnd));
console.log('---');
console.log('Character at jsonEnd-1:', JSON.stringify(content[jsonEnd - 1]));
console.log('Character at jsonEnd:', JSON.stringify(content[jsonEnd]));
console.log('Character at jsonEnd+1:', JSON.stringify(content[jsonEnd + 1]));

// Count backticks in the JSON string
let backtickCount = 0;
let lastBacktickPos = -1;
for (let i = tStart; i < jsonEnd; i++) {
  if (content[i] === '`') {
    backtickCount++;
    lastBacktickPos = i;
    console.log('Backtick at', i, 'context:', content.substring(Math.max(0, i - 10), i + 10));
  }
}
console.log('Total backticks in JSON:', backtickCount);
