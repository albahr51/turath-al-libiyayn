import { readFileSync } from 'fs';

const content = readFileSync('src/data/extracted-quotes.json', 'utf-8');

try {
  const data = JSON.parse(content);
  console.log('VALID:', data.length);
} catch (e) {
  console.log(e.message);
  const m = e.message.match(/position (\d+)/);
  if (m) {
    const p = parseInt(m[1]);
    const before = content.substring(0, p);
    const line = (before.match(/\n/g) || []).length + 1;
    console.log('Line:', line);
    const lines = content.split('\n');
    for (let i = Math.max(0, line - 3); i < Math.min(lines.length, line + 3); i++) {
      console.log((i + 1) + ':', lines[i].substring(0, 300));
    }
  }
}
