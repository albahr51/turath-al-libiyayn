import { readFileSync } from 'fs';

const html = readFileSync('dist/index.html', 'utf-8');

// Find all script tags
const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>/g;
let match;
let count = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  count++;
  console.log('Script', count, ':', match[0].substring(0, 150));
}

console.log('---');

// Check if the specific index script exists
const files = readdirSync('dist/_astro/');
for (const f of files) {
  if (f.includes('index') && f.endsWith('.js')) {
    console.log('Found index JS:', f);
  }
}

import { readdirSync } from 'fs';
