import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');

const filePath = join(projectRoot, 'src/content/books/abu-yahya/2-تقديم-الجامع.md');
const content = readFileSync(filePath, 'utf-8');

const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
if (yamlMatch) {
  const yamlBlock = yamlMatch[1];
  console.log('YAML block lines with char codes:');
  const lines = yamlBlock.split('\n');
  for (let i = 0; i < lines.length; i++) {
    console.log(`Line ${i}: "${lines[i]}" (starts with title: ${lines[i].startsWith('title:')}) codes: ${[...lines[i]].map(c => c.charCodeAt(0).toString(16)).join(' ')}`);
  }
}
