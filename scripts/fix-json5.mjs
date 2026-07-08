import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('src/data/extracted-quotes.json', 'utf-8');

// Remove BOM
if (content.charCodeAt(0) === 0xFEFF) content = content.substring(1);

// Try to parse - if fails, report the exact problem
try {
  JSON.parse(content);
  console.log('VALID');
  process.exit(0);
} catch (e) {
  const m = e.message.match(/position (\d+)/);
  if (m) {
    const pos = parseInt(m[1]);
    console.log('Error at position', pos);
    console.log('Context:', content.substring(Math.max(0, pos - 10), pos + 30));
    const before = content.substring(0, pos);
    const line = (before.match(/\n/g) || []).length + 1;
    console.log('Line:', line);
    
    // Find the problematic ] character
    const near = Math.max(0, pos - 200);
    console.log('Near context:', content.substring(near, Math.min(content.length, near + 400)));
  } else {
    console.log('Error:', e.message);
  }
}
