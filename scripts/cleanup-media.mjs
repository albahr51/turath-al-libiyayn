import { readdirSync, statSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const dir = join(import.meta.dirname, '..', 'dist', 'media');
if (!existsSync(dir)) process.exit(0);

function walk(root) {
  for (const name of readdirSync(root)) {
    const fp = join(root, name);
    const s = statSync(fp);
    if (s.isDirectory()) walk(fp);
    else if (s.size > 25 * 1024 * 1024) {
      unlinkSync(fp);
      console.log(`Deleted ( >25MB): ${fp}`);
    }
  }
}

walk(dir);
