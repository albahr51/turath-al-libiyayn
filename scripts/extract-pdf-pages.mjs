import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const authors = [
  {
    id: 'abu-yahya',
    pdfRelPath: 'public/media/مجموع أعمال الشيخ أبي يحيى.pdf',
    coverPages: 8,
    sectionDividers: [9, 62, 1660, 2122, 2783, 2949, 3003, 3077, 3113]
  },
  {
    id: 'atiyatullah',
    pdfRelPath: 'public/media/مجموع_الشيخ_عطية_الله_الطبعة_الثانية.pdf',
    coverPages: 6,
    sectionDividers: []
  }
];

const sidebarFiles = {
  'abu-yahya': join(root, 'src/data/sidebar-abu-yahya.json'),
  'atiyatullah': join(root, 'src/data/sidebar-atiyatullah.json')
};

const printMappingsPath = join(root, 'src/data/print-mappings.json');

function extractFullSlug(link) {
  return link.split('/').pop();
}

function lookupPdfPage(slug, printMappings) {
  for (const [pageStr, slugs] of Object.entries(printMappings)) {
    if (slugs.includes(slug)) return parseInt(pageStr);
  }
  return null;
}

function analyzeSidebar(sidebar, printMappings, sectionDividers) {
  // Build map: slug → print-mapping PDF page number
  const slugToPdfPage = {};
  for (const [pageStr, slugs] of Object.entries(printMappings)) {
    const pageNum = parseInt(pageStr);
    for (const slug of slugs) {
      slugToPdfPage[slug] = pageNum;
    }
  }

  // Sort keys and add section dividers for range calculation
  const allBoundaries = [
    ...Object.keys(printMappings).map(Number),
    ...(sectionDividers || [])
  ].sort((a, b) => a - b);

  const keyRanges = {};
  for (let i = 0; i < allBoundaries.length; i++) {
    const start = allBoundaries[i];
    if (!printMappings[String(start)]) continue; // skip dividers
    const end = i < allBoundaries.length - 1 ? allBoundaries[i + 1] - 1 : start + 500;
    keyRanges[start] = [start, end];
  }

  const rangeMap = {};
  for (const [pageStr, slugs] of Object.entries(printMappings)) {
    const range = keyRanges[parseInt(pageStr)];
    if (slugs.length > 0 && range) {
      rangeMap[slugs[0]] = range;
    }
  }

  return rangeMap;
}

async function extractPages(pdfDoc, pageRange, outputPath, coverPages, totalPdfPages) {
  if (existsSync(outputPath)) return;
  const [start, end] = pageRange;

  const newDoc = await PDFDocument.create();

  // Include cover pages (cover, title, front matter)
  const pageIndices = [];
  const coverEnd = Math.min(coverPages, totalPdfPages);
  for (let i = 1; i <= coverEnd; i++) {
    pageIndices.push(i - 1);
  }
  // Then the chapter's page range
  for (let i = start; i <= end; i++) {
    if (i > totalPdfPages) break;
    pageIndices.push(i - 1);
  }

  // Deduplicate while preserving order
  const seen = new Set();
  const uniqueIndices = pageIndices.filter(i => {
    if (seen.has(i)) return false;
    seen.add(i);
    return true;
  });

  const copiedPages = await newDoc.copyPages(pdfDoc, uniqueIndices);
  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  const outBytes = await newDoc.save();
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, outBytes);
  console.log(`  Extracted pages 1-${coverEnd} + ${start}-${end} → ${outputPath}`);
}

async function main() {
  const printMappings = JSON.parse(readFileSync(printMappingsPath, 'utf-8'));

  for (const author of authors) {
    const sidebar = JSON.parse(readFileSync(sidebarFiles[author.id], 'utf-8'));
    const authorMappings = printMappings[author.id];

    const rangeMap = analyzeSidebar(sidebar, authorMappings, author.sectionDividers);
    const pdfPath = join(root, author.pdfRelPath);

    if (!existsSync(pdfPath)) {
      console.error(`PDF not found: ${pdfPath}`);
      continue;
    }

    const outDir = join(root, 'public/media/extracted', author.id);
    let extracted = 0;

    // Load the PDF once for all items of this author
    const pdfBytes = readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const totalPdfPages = pdfDoc.getPageCount();
    console.log(`Loaded ${pdfPath} (${totalPdfPages} pages)`);

    for (const [slug, range] of Object.entries(rangeMap)) {
      const [start, end] = range;
      const outPath = join(outDir, `${slug}.pdf`);
      try {
        await extractPages(pdfDoc, [start, end], outPath, author.coverPages, totalPdfPages);
        extracted++;
      } catch (err) {
        console.error(`Failed to extract slug ${slug} for ${author.id}: ${err.message}`);
      }
    }

    writeFileSync(join(outDir, 'ranges.json'), JSON.stringify(rangeMap, null, 2));
    console.log(`Extracted ${extracted} entries for ${author.id}`);
  }

  console.log('Done extracting PDF pages.');
}

main().catch(console.error);
