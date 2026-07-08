import { readFileSync } from 'fs';

const content = readFileSync('src/data/extracted-quotes.json', 'utf-8');
const lines = content.split('\n');

// Find lines containing ] inside the data (not at the end)
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(']') && !lines[i].trimStart().startsWith('[') && !lines[i].trimEnd().endsWith(']')) {
    console.log(`Line ${i + 1}: ${lines[i].substring(0, 200)}`);
  }
}

// Find lines with 'ط©' corruption pattern
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('ط©') || lines[i].includes('ˆ')) {
    console.log(`Corruption at line ${i + 1}: ${lines[i].substring(0, 200)}`);
  }
}

// Check the last few lines
console.log('\n--- Last 5 lines ---');
for (let i = Math.max(0, lines.length - 5); i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i].substring(0, 200)}`);
}
