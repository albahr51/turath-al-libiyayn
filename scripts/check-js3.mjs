import { readFileSync } from 'fs';

const content = readFileSync('dist/_astro/index.astro_astro_type_script_index_0_lang.DT_A6KHf.js', 'utf-8');

// Find the closing of the template literal after JSON.parse
const start = content.indexOf('JSON.parse');
const templateStart = content.indexOf('`', start);  // opening backtick
const templateEnd = content.indexOf('`)', templateStart);  // backtick + close paren

console.log('start:', start);
console.log('templateStart:', templateStart);
console.log('templateEnd:', templateEnd);

if (templateEnd > templateStart) {
  const jsonStr = content.substring(templateStart + 1, templateEnd);
  console.log('JSON string length:', jsonStr.length);
  console.log('First 100 of JSON:', jsonStr.substring(0, 100));
  
  try {
    const d = JSON.parse(jsonStr);
    console.log('VALID JSON, length:', d.length);
  } catch(e) {
    console.log('INVALID JSON:', e.message);
    const m = e.message.match(/position (\d+)/);
    if (m) {
      const pos = parseInt(m[1]);
      console.log('Context:', jsonStr.substring(Math.max(0, pos - 30), pos + 30));
    }
  }
}
