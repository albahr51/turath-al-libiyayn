import { readFileSync } from 'fs';

const content = readFileSync('dist/_astro/index.astro_astro_type_script_index_0_lang.DT_A6KHf.js', 'utf-8');
console.log('Length:', content.length);

// Find the JSON.parse block
const start = content.indexOf('JSON.parse(');
const end = content.indexOf(')`);', start);
if (start >= 0 && end >= 0) {
  const jsonStr = content.substring(start + 12, end + 1); // JSON.parse(`...`)
  console.log('JSON string length:', jsonStr.length);
  console.log('First 100 of JSON string:', jsonStr.substring(0, 100));
  // Try to parse it
  try {
    const d = JSON.parse(jsonStr);
    console.log('JSON valid, length:', d.length);
    console.log('First text:', d[0]?.text?.substring(0, 80));
  } catch(e) {
    console.log('JSON INVALID:', e.message);
    // Find the problematic position
    const posMatch = e.message.match(/position\s+(\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1]);
      console.log('Error context:', jsonStr.substring(Math.max(0, pos - 30), pos + 30));
    }
  }
}
