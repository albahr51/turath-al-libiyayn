import { readFileSync } from 'fs';

const content = readFileSync('dist/_astro/index.astro_astro_type_script_index_0_lang.DT_A6KHf.js', 'utf-8');

// Try to parse the JavaScript with Acorn or just check for basic syntax
// For now, let's just extract the JSON string directly
const varEIdx = content.indexOf('var e=');
const afterVarE = content.substring(varEIdx + 6);
// After 'var e=' we have: JSON.parse(`...`);function t(){...
const parseStart = afterVarE.indexOf('JSON.parse(');
const btStart = afterVarE.indexOf('`', parseStart) + 1;
let depth = 0;
let endIdx = -1;
let inString = false;
let escaped = false;

// Find the matching backtick
for (let i = btStart; i < afterVarE.length; i++) {
  const ch = afterVarE[i];
  if (ch === '`') {
    // Check if this backtick is escaped
    if (afterVarE[i - 1] !== '\\') {
      endIdx = i;
      break;
    }
  }
}

if (endIdx > 0) {
  const jsonStr = afterVarE.substring(btStart, endIdx);
  console.log('JSON length:', jsonStr.length);
  console.log('First 100:', jsonStr.substring(0, 100));
  console.log('Last 100:', jsonStr.substring(jsonStr.length - 100));
  
  try {
    const parsed = JSON.parse(jsonStr);
    console.log('VALID JSON, length:', parsed.length);
    console.log('First text:', parsed[0]?.text?.substring(0, 60));
  } catch(e) {
    console.log('JSON INVALID:', e.message);
  }
}
