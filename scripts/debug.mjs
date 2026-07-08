import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(c))
    .replace(/\s+/g, ' ')
    .trim();
}

const filePath = join(projectRoot, 'src/content/books/abu-yahya/55-الجهاد-ومعركة-الشبهات.md');
console.log('File exists:', filePath);
const content = readFileSync(filePath, 'utf-8');

// Parse YAML
const yamlMatch = content.match(/^---\s*\n(.*?)\n---\s*\n([\s\S]*)$/);
console.log('YAML match:', !!yamlMatch);

if (yamlMatch) {
  const yamlBlock = yamlMatch[1];
  const body = yamlMatch[2];
  
  console.log('--- YAML ---');
  console.log(yamlBlock);
  console.log('--- BODY (first 300 chars) ---');
  console.log(body.substring(0, 300));
  
  // Extract page
  const pageMatch = body.match(/الصفحة:\s*(\d+)/);
  console.log('Page match:', pageMatch ? pageMatch[1] : 'none');
  
  // Test paragraph extraction
  const paraRegex = /<div class="paragraph-wrap"[^>]*>([\s\S]*?)<\/div>/g;
  let count = 0;
  let m;
  while ((m = paraRegex.exec(body)) !== null) {
    count++;
    if (count <= 3) {
      const blockHtml = m[1];
      const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
      let pMatch;
      while ((pMatch = pRegex.exec(blockHtml)) !== null) {
        const text = stripHtml(pMatch[1]);
        console.log(`Block ${count} p text (first 100): "${text.substring(0, 100)}" (len=${text.length})`);
      }
    }
  }
  console.log('Total paragraph-wrap blocks:', count);
}
