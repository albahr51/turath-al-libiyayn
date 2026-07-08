import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync, renameSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');
const contentDir = join(projectRoot, 'src', 'content', 'books');
const outputFile = join(projectRoot, 'src', 'data', 'extracted-quotes.json');

const bookNames = {
  'abu-yahya': 'مجموع أعمال الشيخ أبي يحيى الليبي',
  'atiyatullah': 'مجموع أعمال الشيخ عطية الله الليبي',
};

const urlPrefixes = {
  'abu-yahya': '/book/abu-yahya',
  'atiyatullah': '/book/atiyatullah',
};

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

// Remove diacritics (tashkeel) for easier pattern matching
function stripTashkeel(text) {
  return text.replace(/[\u064B-\u0652\u0670]/g, '');
}

// Check if text is purely external transmission (hadith, ayah, quote from other scholar)
function isExternalTransmission(pText) {
  const t = stripTashkeel(pText).trim();
  
  // Too short
  if (t.length < 60) return true;
  
  // Leading dash, bullet, or numbered list item
  if (/^[-–—•]\s/.test(t)) return true;
  if (/^\d+\s*[-–—]\s/.test(t)) return true;
  
  // Formal openings
  if (/^الحمد لله/.test(t)) return true;
  if (/^إن الحمد لله/.test(t)) return true;
  if (/^وبعد/.test(t)) return true;
  if (/^بسم الله/.test(t)) return true;
  if (/^ربنا/.test(t) && t.split(/\s+/).length < 12) return true;
  
  // Starts with hadith numbering or chains
  if (/^الحديث/.test(t)) return true;
  if (/^(عَنْ|عَن )/.test(t)) return true;
  if (/^(روى|رَوَى|حَدَّثَ|حدَّثَ)/.test(t)) return true;
  
  // Quran verse only
  if (/^﴿/.test(t)) return true;
  if (/^قوله تعالى/.test(t)) return true;
  
  // Quote from other scholar (starts with "قال [someone]")
  if (/^قال\s+/.test(t)) {
    const afterQal = t.replace(/^قال\s+/, '');
    // Known title patterns
    if (/^(الامام|الإمام|الشيخ|الحافظ|العلامة|ابن|أبو|أبي|مولانا|سيدي)/.test(afterQal)) return true;
    // Contains "رحمه الله" or "رضي الله عنه" right after the name (clear quote of someone else)
    if (/^[ء-ي]+\s+(رحمه|رضي)/.test(afterQal)) return true;
    // "قال رسول" or "قال النبي" is quoting Prophet, not the scholar
    if (/^(رسول|النبي|الله)/.test(afterQal)) return true;
  }
  
  // Starts with "نقل" from another scholar
  if (/^(نقل|ذكر|حكى)\s+(الامام|الإمام|الشيخ|الحافظ|العلامة|ابن|أبو|أبي)/.test(t)) return true;
  
  // Letter opening
  if (/^(الأخ الحبيب|الأخ الفاضل|الأخ الكريم|إلى الشيخ|سماحة الشيخ|فضيلة الشيخ|أخي الكريم|أخي الحبيب|عزيزي|إلى من)/.test(t)) return true;
  
  // Interview question / media outlet name at start
  if (/^(شبكة|موقع|صحيفة|جريدة|مجلة|قناة|وكالة)\s/.test(t)) return true;
  
  // Poetry attributed to someone else
  if (/نُسبت|نسبت/.test(t)) return true;
  
  // "وبالجملة" summary openings (not standalone)
  if (/^وبالجملة/.test(t)) return true;
  
  // Header-like text (very short, colon-heavy)
  if (t.length < 100 && /[:：]/.test(t)) return true;
  
  // Mostly numbers and citation marks (bibliographic reference)
  const citationRatio = (t.match(/[١٢٣٤٥٦٧٨٩٠0-9،,.:;\-\(\)\[\]٬٭]/g) || []).length / t.length;
  if (citationRatio > 0.3) return true;
  
  return false;
}

function hasArabic(text) {
  return (/[\u0600-\u06FF\u0750-\u077F]/).test(text);
}

function countArabic(text) {
  return (text.match(/[\u0600-\u06FF\u0750-\u077F]/g) || []).length;
}

const allQuotes = [];
let totalFiles = 0;

for (const author of ['abu-yahya', 'atiyatullah']) {
  const dir = join(contentDir, author);
  if (!existsSync(dir)) continue;
  
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  totalFiles += files.length;
  
  for (const filename of files) {
    const filePath = join(dir, filename);
    const content = readFileSync(filePath, 'utf-8');
    
    // Parse YAML frontmatter (handles multi-line values)
    const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!yamlMatch) continue;
    
    const yamlBlock = yamlMatch[1];
    const body = yamlMatch[2];
    
    // Extract fields from YAML (title can span multiple lines)
    const lines = yamlBlock.split('\n');
    let title = '';
    let slug = '';
    let order = 0;
    let inTitle = false;
    
    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, '');
      const trimmed = line.trim();
      if (line.startsWith('title:')) {
        inTitle = true;
        const afterColon = line.replace(/^title:\s*/, '');
        if (afterColon.startsWith('"') && afterColon.endsWith('"')) {
          title = afterColon.slice(1, -1);
          inTitle = false;
        } else if (afterColon.startsWith('"')) {
          title = afterColon.slice(1);
        } else {
          title = afterColon;
          inTitle = false;
        }
      } else if (inTitle) {
        if (trimmed.endsWith('"')) {
          title += ' ' + trimmed.slice(0, -1);
          inTitle = false;
        } else {
          title += ' ' + trimmed;
        }
      } else if (line.startsWith('slug:')) {
        const m = line.match(/slug:\s*"([^"]+)"/);
        if (m) slug = m[1];
      } else if (line.startsWith('order:')) {
        const m = line.match(/order:\s*(\d+)/);
        if (m) order = parseInt(m[1]);
      }
    }
    
    title = title.replace(/\s+/g, ' ').trim();
    if (!slug) continue;
    
    // Skip muhaqqiq/compiler introduction pages
    const compilerPatterns = ['تقديم', 'مقدمة جامع', 'مقدمة الطبعة', 'منهجية العمل', 'الجديد في الطبعة', 'سيرة الشيخ'];
    const isCompilerIntro = compilerPatterns.some(p => title.includes(p)) || /^عرض[ٌ]?\s+إجمالي/.test(title) || /^۞/.test(title);
    if (isCompilerIntro) continue;

    // Extract page number
    const pageMatch = body.match(/الصفحة:\s*(\d+)/);
    const page = pageMatch ? parseInt(pageMatch[1]) : 0;
    
    const bookName = bookNames[author];
    const urlPrefix = urlPrefixes[author];
    
    // Collect all candidate paragraphs with quality scores
    const candidates = [];
    const paragraphRegex = /<div class="paragraph-wrap"[^>]*>([\s\S]*?)<\/div>/g;
    let blockMatch;
    
    while ((blockMatch = paragraphRegex.exec(body)) !== null) {
      const blockHtml = blockMatch[1];
      
      if (/page-break-marker/.test(blockHtml)) continue;
      if (/subsections-toc/.test(blockHtml)) continue;
      
      const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
      let pMatch;
      
      while ((pMatch = pRegex.exec(blockHtml)) !== null) {
        let pText = stripHtml(pMatch[1]);
        
        if (pText.length < 60) continue;
        if (pText.length > 500) continue;
        
        const arabicCount = countArabic(pText);
        if (arabicCount < 20) continue;
        
        // Skip verse-heavy text
        const verseChars = (pText.match(/﴿|﴾/g) || []).length;
        if (verseChars > 10) continue;
        
        // Skip external transmissions (hadith, ayah, quotes from others)
        if (isExternalTransmission(pText)) continue;
        
        // Score the paragraph as a standalone quote
        let score = 0;
        const t = stripTashkeel(pText).trim();
        
        // Penalize context-dependent openings
        if (/^كان/.test(t)) score -= 30;
        if (/^منذ/.test(t)) score -= 30;
        if (/^بعد/.test(t)) score -= 20;
        if (/^قبل/.test(t)) score -= 20;
        if (/^أثناء/.test(t)) score -= 20;
        if (/^عند/.test(t)) score -= 15;
        if (/^في الوقت/.test(t)) score -= 20;
        
        // Questions don't stand alone well
        if (/^(هل|أ|ما ذا|ماذا|كيف|لماذا|أين|متى)/.test(t)) score -= 20;
        
        // Penalize texts ending with citation references
        if (/\d+[٬,]\s*\d+\s*\[/.test(t)) score -= 20;
        if (/انظر\s*:/.test(t)) score -= 20;
        if (/\d+\s*جـ?\s*\/\s*\d+/i.test(t)) score -= 15;
        
        // Penalize poetry attribution
        if (/\[قائله/.test(t)) score -= 30;
        
        // Reward standalone opinion/conclusion markers
        if (/^(إن |فإن |وإن |أما |فأما |إنما|فإنما|لا بد|قد |لقد )/.test(t)) score += 30;
        
        // Reward fatwa-like language
        if (/(يجب|لا يجوز|حرام|حلال|واجب|محرم|ينبغي|من الواجب|من المهم|اعلم|نرى أن|نقول|والذي|والله|فالله)/.test(t)) score += 20;
        
        // Reward wisdom-like statements
        if (/^(إن من|من أهم|من أعظم|إن أعظم|إن أجل|الحمد لله الذي)/.test(t)) score += 15;
        
        // Reward appropriate length (100-350 is ideal)
        if (pText.length >= 100 && pText.length <= 350) score += 10;
        
        // Prefer paragraphs with the scholar's distinctive voice
        if (/والذي أراه|والذي نرى|الذي نعتقد|هذا هو|وهذا هو|فالحق أن|والصحيح/.test(t)) score += 20;
        
        candidates.push({ text: pText, score, idx: candidates.length });
      }
    }
    
    // Pick the highest-scored candidate
    candidates.sort((a, b) => b.score - a.score);
    const bestText = candidates.length > 0 ? candidates[0].text : '';
    
    if (bestText) {
      const url = `${urlPrefix}/${slug}/`;
      allQuotes.push({
        text: bestText,
        book: bookName,
        title: title.replace(/\s+/g, ' ').trim(),
        author,
        page,
        order,
        url,
        slug,
      });
    }
  }
}

// Remove any duplicates by slug
const seen = new Set();
const unique = [];
for (const q of allQuotes) {
  const key = `${q.author}:${q.slug}`;
  if (!seen.has(key)) {
    seen.add(key);
    unique.push(q);
  }
}
unique.sort((a, b) => a.author.localeCompare(b.author) || a.order - b.order);

console.log(`Extracted ${unique.length} quotes from ${totalFiles} files.`);

// Ensure output directory exists
const outputDir = join(projectRoot, 'src', 'data');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Safety: do not overwrite manually-edited file without --force flag
const force = process.argv.includes('--force');
if (!force && existsSync(outputFile)) {
  const existing = readFileSync(outputFile, 'utf-8');
  const existingQuotes = JSON.parse(existing);
  
  const oldSlugs = new Set(existingQuotes.map(q => `${q.author}:${q.slug}`));
  const newSlugs = new Set(unique.map(q => `${q.author}:${q.slug}`));
  
  // Preserve: entries in old file whose slug no longer exists in content (user added them manually)
  const userAdded = existingQuotes.filter(q => !newSlugs.has(`${q.author}:${q.slug}`));
  
  // Respect deletions: entries in new generation that the user manually removed from old file
  const userDeleted = unique.filter(q => !oldSlugs.has(`${q.author}:${q.slug}`));
  
  if (userAdded.length > 0) {
    console.log(`Preserving ${userAdded.length} entries that exist only in the old file (user-added).`);
    for (const p of userAdded) {
      unique.push(p);
    }
  }
  
  if (userDeleted.length > 0) {
    console.log(`Respecting removal of ${userDeleted.length} entries that the user deleted from the old file.`);
    // Remove these from the generated list
    const slugsToRemove = new Set(userDeleted.map(q => `${q.author}:${q.slug}`));
    unique = unique.filter(q => !slugsToRemove.has(`${q.author}:${q.slug}`));
  }
  
  if (userAdded.length > 0 || userDeleted.length > 0) {
    unique.sort((a, b) => a.author.localeCompare(b.author) || a.order - b.order);
  }
  
  // Notify if no manual changes detected
  if (userAdded.length === 0 && userDeleted.length === 0) {
    const diff = unique.length - existingQuotes.length;
    console.log(`No manual changes detected. Regenerated with ${unique.length} entries (${diff >= 0 ? '+' : ''}${diff} from before).`);
  }
}

const json = JSON.stringify(unique, null, 2);
// Validate JSON before writing
JSON.parse(json);

// Write to a temp file first, then rename (atomic write)
const tmpFile = outputFile + '.tmp';
writeFileSync(tmpFile, json, 'utf-8');
// Copy the old file as backup if it exists
if (existsSync(outputFile)) {
  const bakFile = outputFile + '.bak';
  try {
    copyFileSync(outputFile, bakFile);
  } catch(e) {
    // backup is best-effort
  }
}
renameSync(tmpFile, outputFile);
console.log(`Saved ${unique.length} entries to: ${outputFile}`);
if (!force && existsSync(outputFile.replace('.json', '.json.bak'))) {
  console.log('Backup saved with .bak extension.');
}
