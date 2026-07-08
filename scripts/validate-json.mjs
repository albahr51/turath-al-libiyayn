import { readFileSync } from 'fs';

const content = readFileSync('src/data/extracted-quotes.json', 'utf-8');

// Try to parse and find the exact position of error
let lastGoodPos = 0;
for (let i = 0; i < content.length; i++) {
  try {
    JSON.parse(content.substring(0, i + 1));
    lastGoodPos = i;
  } catch (e) {
    // Expected for incomplete JSON
  }
}

// Try full parse
try {
  const data = JSON.parse(content);
  console.log('VALID JSON:', data.length, 'quotes');
} catch(e) {
  console.log('INVALID at:', e.message);
  // Find line number from position
  const posMatch = e.message.match(/position\s+(\d+)/);
  if (posMatch) {
    const pos = parseInt(posMatch[1]);
    const before = content.substring(0, pos);
    const lineNum = (before.match(/\n/g) || []).length + 1;
    console.log('Line:', lineNum);
    console.log('Context lines:');
    const lines = content.split('\n');
    for (let i = Math.max(0, lineNum - 3); i < Math.min(lines.length, lineNum + 3); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
}
