import { readFileSync } from 'fs';
const d = JSON.parse(readFileSync('src/data/extracted-quotes.json', 'utf-8'));

// Check for problematic characters in quote texts
for (const q of d) {
  if (q.text.includes('`')) console.log('BACKTICK:', q.title);
  if (q.text.includes('$')) console.log('DOLLAR:', q.title);
  if (q.text.includes('${')) console.log('TEMPLATE:', q.title);
  if (q.text.includes('\\')) console.log('BACKSLASH:', q.title);
}

// Check the JSON is valid when stringified
const s = JSON.stringify(d);
try {
  JSON.parse(s);
  console.log('JSON roundtrip OK');
} catch(e) {
  console.log('JSON roundtrip FAIL:', e.message);
}

console.log('Total quotes:', d.length);
console.log('First quote text:', d[0]?.text?.substring(0, 80));
