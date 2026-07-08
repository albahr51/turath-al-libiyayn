import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('src/data/extracted-quotes.json', 'utf-8');

// Remove BOM
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.substring(1);
  console.log('BOM removed');
}

// Ensure starts with [
if (!content.trimStart().startsWith('[')) {
  console.log('Adding missing [');
  content = '[' + content.trimStart();
}

// Ensure ends with ]
const trimmed = content.trimEnd();
if (!trimmed.endsWith(']')) {
  // If it ends with }, add ] 
  if (trimmed.endsWith('},') || trimmed.endsWith('}')) {
    const lastComma = trimmed.lastIndexOf(',');
    if (lastComma > 0 && !trimmed.substring(lastComma).includes(']')) {
      content = trimmed.substring(0, lastComma) + '\n]';
      console.log('Fixed missing ]');
    } else {
      content = trimmed + '\n]';
      console.log('Added missing ]');
    }
  } else {
    content = trimmed + '\n]';
    console.log('Added missing ]');
  }
}

// Remove duplicate consecutive { { (extra opening braces from corruption)
content = content.replace(/(\n\s*\}\s*,\s*)\n\s*\{\s*\n\s*\{/g, '$1\n  {');
console.log('Fixed duplicate braces');

writeFileSync('src/data/extracted-quotes.json', content, 'utf-8');

// Validate
try {
  const data = JSON.parse(content);
  console.log('VALID JSON:', data.length, 'quotes');
} catch (e) {
  console.log('STILL INVALID:', e.message);
  const m = e.message.match(/position (\d+)/);
  if (m) {
    const p = parseInt(m[1]);
    const before = content.substring(0, p);
    const line = (before.match(/\n/g) || []).length + 1;
    console.log('Line:', line);
    const lines = content.split('\n');
    for (let i = Math.max(0, line - 2); i < Math.min(lines.length, line + 3); i++) {
      console.log((i + 1) + ':', lines[i].substring(0, 200));
    }
  }
}
