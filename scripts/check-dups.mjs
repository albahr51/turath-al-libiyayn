import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

for (const author of ['abu-yahya', 'atiyatullah']) {
  const dir = join('src/content/books', author);
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  const slugs = new Map();
  for (const f of files) {
    const content = readFileSync(join(dir, f), 'utf-8');
    const m = content.match(/slug:\s*"([^"]+)"/);
    if (m) {
      const slug = m[1];
      if (slugs.has(slug)) {
        console.log('DUPLICATE SLUG in', author, ':', slug, 'files:', slugs.get(slug), f);
      }
      slugs.set(slug, f);
    }
  }
  console.log(author, ': unique slugs:', slugs.size, 'files:', files.length);
}
