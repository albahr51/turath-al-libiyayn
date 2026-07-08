import { readFileSync } from 'fs';

const html = readFileSync('dist/index.html', 'utf-8');
console.log('Length:', html.length);

// Check for quotes-data
const idx = html.indexOf('quotes-data');
if (idx >= 0) {
  console.log('quotes-data found at', idx);
  console.log('Context:', html.substring(idx, idx + 200));
} else {
  console.log('quotes-data NOT found');
  // Check for the bundled script
  const scriptIdx = html.indexOf('_astro/index');
  if (scriptIdx >= 0) {
    console.log('Bundled script at', scriptIdx);
    console.log('Context:', html.substring(scriptIdx, scriptIdx + 80));
  }
  // Check for quote-body
  const qbIdx = html.indexOf('quote-body');
  if (qbIdx >= 0) {
    console.log('quote-body found at', qbIdx);
    console.log('Context:', html.substring(qbIdx - 50, qbIdx + 50));
  }
  // Check the full end of body
  const bodyEnd = html.lastIndexOf('</body>');
  if (bodyEnd >= 0) {
    console.log('Last 500 chars before </body>:');
    console.log(html.substring(bodyEnd - 500, bodyEnd));
  }
}
