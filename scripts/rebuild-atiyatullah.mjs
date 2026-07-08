import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const index = JSON.parse(readFileSync(join(root, 'src/data/atiyatullah-index.json'), 'utf-8'));
const sidebar = JSON.parse(readFileSync(join(root, 'src/data/sidebar-atiyatullah.json'), 'utf-8'));
const oldPrintMappings = JSON.parse(readFileSync(join(root, 'src/data/print-mappings.json'), 'utf-8'));
const quotes = JSON.parse(readFileSync(join(root, 'src/data/extracted-quotes.json'), 'utf-8'));

// ===== USER'S PAGE MAP: title keyword → new page number =====
const pageMap = [
  { match: 'مقدمة الطبعة الثانية', page: 8 },
  { match: 'سيف العدل المصري', page: 9 },
  { match: 'أبي قتادة الفلسطيني', page: 12 },
  { match: 'أبي الحسن رشيد البليدي', page: 15 },
  { match: 'أبي عياض التونسي', page: 19 },
  { match: 'عمر الحدوشي', page: 21 },
  { match: 'الفقيه الليبي', page: 23 },
  { match: 'سامي العريدي', page: 26 },
  { match: 'هاني السباعي', page: 28 },
  { match: 'سيرة الشيخ رحمه الله', page: 36 },
  { match: 'مسرد بكتب الشيخ', page: 81 },
  { match: 'منهجية العمل في المجموع', page: 87 },
  { match: 'محمد رسول الله صلى الله عليه وسلم', page: 91 },
  { match: 'اللقاء المفتوح مع الشيخ عطية الله', page: 103 },
  { match: 'كلمات في نصرة', page: 533 },
  { match: 'حزب الله اللبناني', page: 551 },
  { match: 'لقاء مركز اليقين', page: 601 },
  { match: 'اليقين الإعلامي', page: 601 },
  { match: 'جواب سؤال في جهاد الدفع', page: 659 },
  { match: 'انفذ على رسلك', page: 709 },
  { match: 'الأمريكان المجرمون', page: 779 },
  { match: 'امرأة وقائد', page: 787 },
  { match: 'التعليق على كتاب جهاد بلا قائد', page: 799 },
  { match: 'كتاث جهاد بلا قائد', page: 799 },
  { match: 'في ظلال آية', page: 811 },
  { match: 'النصح والإشفاق', page: 821 },
  { match: 'أجوبة في حكم النفير', page: 846 },
  { match: 'فجار لكنهم', page: 854 },
  { match: 'ثورة الشعوب', page: 866 },
  { match: 'ما ليس عنه انفكاك', page: 874 },
  { match: 'الثورات العربية وموسم الحصاد', page: 898 },
  { match: 'حوار الشيخ مع شبكة أنا المسلم', page: 912 },
  { match: 'إجابات أسئلة موجهة من اللجنة', page: 991 },
  { match: 'إجابات على بعض التساؤلات من مجاهدي قطاع غزة', page: 1032 },
  { match: 'الأسئلة الصومالية', page: 1045 },
  { match: 'أسئلة الأخ أبي مصعب الكردي', page: 1054 },
  { match: 'جواب في القسم بين الأزواج', page: 1060 },
  { match: 'جواب في البدعة', page: 1062 },
  { match: 'جواب على رسالة السلفيين الباكستانيين', page: 1087 },
  { match: 'إجابة السائل عن بعض الأحكام', page: 1101 },
  { match: 'زواج الأرامل', page: 1101 },
  { match: 'أسئلة في حضانة الأطفال', page: 1119 },
  { match: 'توضيحات في المسألة الجزائرية', page: 1146 },
  { match: 'تذكرة رمضان', page: 1167 },
  { match: 'أسئلة وأجوبة نافعة', page: 1199 },
  { match: 'أمة الشهادة', page: 1203 },
  { match: 'ما بعد هزيمة أمريكا', page: 1207 },
  { match: 'قصيدة مرثية في الشيخ المهاجر', page: 1211 },
  { match: 'في بيان حكم التصوير', page: 1214 },
  { match: 'التعليق على كتاب الفيديو الإسلامي', page: 1223 },
  { match: 'مقدمة كتاب وبل الغمامة', page: 1232 },
  { match: 'حكم الانضمام إلى الجيش والشرطة العراقيين', page: 1234 },
  { match: 'تحية وتقدير للشيخ القائد أبي حمزة', page: 1239 },
  { match: 'مذمة الناقص البطال', page: 1243 },
  { match: 'تعليق على بيان في مسألة التحالف', page: 1247 },
  { match: 'التحالف مع العلمانيين', page: 1247 },
  { match: 'التعليقات السداد', page: 1264 },
  { match: 'رثاء وعزاء في وفاة عالمي موريتانيا', page: 1271 },
  { match: 'توجيهات في العمل الإعلامي', page: 1273 },
  { match: 'مقدمة كتاب الأربعون في الشهادة', page: 1280 },
  { match: 'مقدمة قصيدة رثاء وحداء', page: 1281 },
  { match: 'الرسالة البحرينية', page: 1283 },
  { match: 'الشيخ أسامة بن لادن نسيج وحده', page: 1285 },
  { match: 'نسيج وحده', page: 1285 },
  { match: 'نبذة من سيرة الشيخ مصطفى أبي اليزيد', page: 1289 },
  { match: 'تبشير قلوب الموحدين', page: 1295 },
  { match: 'بعض مشاركات الشيخ في المنتديات', page: 1301 },
  { match: 'وصايا وسلام واستعلام', page: 1302 },
  { match: 'الجهاد فرقان', page: 1303 },
  { match: 'مفهوم مهم جدا', page: 1304 },
  { match: 'إعظام الآمال بجهاد الصومال', page: 1305 },
  { match: 'الشيخ العالم الأسير هل نسيناه', page: 1306 },
  { match: 'تعليقات على بعض ما احتواه بيان الجيش', page: 1307 },
  { match: 'تحية لجيش الإسلام', page: 1308 },
  { match: 'أهل التوحيد في نهر البارد', page: 1309 },
  { match: 'السيف المهند', page: 1310 },
  { match: 'جهاد المرأة المسلمة', page: 1311 },
  { match: 'حتى لا تزل أقدام', page: 1312 },
  { match: 'مجاهيل النت', page: 1313 },
  { match: 'تعظيم حرمة دماء المسلمين', page: 1557 },
  { match: 'تحية لأهلنا في ليبيا', page: 1561 },
  { match: 'بشائر النصر في شهر الصبر', page: 1564 },
  { match: 'درس في التحريض على الجهاد', page: 1573 },
  { match: 'محاورة الشيخ أبي يحيى الليبي', page: 1585 },
  { match: 'سلسلة الثقافة الإسلامية', page: 1599 },
  { match: 'التصور والتصديق', page: 1601 },
  { match: 'تصحيح المفاهيم', page: 1608 },
  { match: 'الهداية أسبابها وموانعها', page: 1614 },
  { match: 'الهداية أسبابها', page: 1614 },
  { match: 'الحق', page: 1630 },
  { match: 'الدين', page: 1639 },
  { match: 'الابتلاء والاختبار والفتنة والامتحان', page: 1658 },
  { match: 'العدل والفضل', page: 1681 },
  { match: 'السبق', page: 1700 },
  { match: 'الجهاد والدعوة', page: 1703 },
  { match: 'غايات الجهاد', page: 1708 },
  { match: 'مناهج وطرائق التغيير', page: 1715 },
  { match: 'التجربة الجزائرية', page: 1735 },
  { match: 'شرح حديث المؤمن القوي', page: 1769 },
  { match: 'المؤمن القوي خير', page: 1769 },
  { match: 'الجندية وأحكامها', page: 1779 },
  { match: 'أسباب النصر', page: 1799 },
  { match: 'مقاصد الجهاد', page: 1810 },
  { match: 'التكفير والردة', page: 1821 },
  { match: 'الموالاة والمعاداة', page: 1840 },
  { match: 'قراءة في كتاب مختصر منهاج القاصدين', page: 1852 },
  { match: 'الهداية ونعمة الجهاد', page: 1860 },
  { match: 'أهل التجارة مع الله', page: 1870 },
  { match: 'كلمات في بعض الإصدارات', page: 1876 },
  { match: 'بعض الإصدارات', page: 1876 },
  { match: 'فجر النصر الوشيك', page: 1894 },
  { match: 'هلاك الأمم الظالمة', page: 1896 },
  { match: 'رسالة إلى الشيخ أبي مصعب الزرقاوي', page: 1912 },
  { match: 'رسائل إلى الشيخ أبي بصير الوحيشي', page: 1927 },
  { match: 'رسالة إلى المجاهدين في الصومال', page: 1938 },
  { match: 'الرسالة الأولى إلى القائد حكيم الله', page: 1953 },
  { match: 'الرسالة الثانية إلى الشيخ عدنان', page: 1956 },
  { match: 'الرسالة الثالثة إلى الشيخ المجدد', page: 1959 },
  { match: 'الرسالة الأولى إلى الشيخ أسامة بعد استلام', page: 1962 },
  { match: 'الرسالة الثانية إلى الشيخ أبي عبد الله أسامة بن لادن', page: 1977 },
  { match: 'الرسالة الثالثة إلى الشيخ أبي عبد الله أسامة بن', page: 1986 },
  { match: 'الرسالة الرابعة إلى الشيخ أبي عبد الله أسامة بن لادن', page: 1993 },
  { match: 'الرسالة الأولى إلى الشيخ أبي بصير ناصر الوحيشي', page: 2001 },
  { match: 'الرسالة الثانية تعليق الشيخين عطية الله وأبي يحيى', page: 2015 },
  { match: 'الرسالة الثانية إلى القائد حكيم الله', page: 2024 },
  { match: 'الرسالة الرابعة إلى المجاهدين في جزيرة العرب', page: 2026 },
  { match: 'الرسالة الخامسة في جواب رسالة', page: 2031 },
  { match: 'من عبق المراسلات إلى قادة المجاهدين', page: 2039 },
  { match: 'رسالة بخصوص التعامل مع إيران', page: 2057 },
  { match: 'تعليقات مختصرة مفيدة على كلمة للشيخ أسامة عن إيران', page: 2081 },
  { match: 'رسالة إلى الشيخ أسامة بعد وصول الشيخ عطية', page: 2086 },
  { match: 'رسالة إلى الشيخ أسامة بن لادن بعد تكليف', page: 2093 },
  { match: 'رسالة إلى الشيخ أسامة بن لادن بخصوص قوائم', page: 2102 },
  { match: 'رسالة إلى الشيخ أسامة بن لادن بخصوص عائلته', page: 2104 },
  { match: 'رسالة مشتركة بين الشيخين أبي اليزيد وعطية الله', page: 2107 },
  { match: 'رسالة مختصرة للشيخ أسامة', page: 2114 },
  { match: 'رسالة مهمة إلى الشيخ أسامة', page: 2116 },
  { match: 'رسالة إلى الشيخ أسامة بن لادن تتضمن تقريرا', page: 2014 },
  { match: 'تعليقات على بعض رسائل الشيخ أسامة', page: 2137 },
  { match: 'ملاحظات ومناقشات وأجوبة على رسائل', page: 2153 },
  { match: 'آخر رسالة من الشيخ عطية للشيخ أسامة', page: 2165 },
  { match: 'تعليقات على المذكرة الاستراتيجية', page: 2177 },
  { match: 'تعليقات من الشيخ عطية الله على كتاب التبرئة', page: 2183 },
  { match: 'رسالة إلى الشيخ القائد مصطفى أبي اليزيد حول أحوال', page: 2188 },
  { match: 'تعليقات على كتاب إعزاز راية التوحيد', page: 2194 },
  { match: 'رسالة إلى الشيخ مصطفى أبي اليزيد بخصوص الجهاد في العراق', page: 2198 },
  { match: 'رسالة لأبي بصير الوحيشي ردا', page: 2004 },
  { match: 'رسالة إلى الأخ أبي محمد صلاح', page: 2202 },
  { match: 'رسالة أخرى إلى الأخ أبي محمد صلاح', page: 2206 },
  { match: 'رسالة إلى أمير الشباب المجاهدين أبي الزبير', page: 2216 },
  { match: 'رسالة ثانية إلى أبي الزبير', page: 2223 },
  { match: 'رسالة ثالثة إلى الصومال', page: 2227 },
  { match: 'رسالة رابعة إلى أمير الشباب', page: 2231 },
  { match: 'فقرات من رسالة مسودة الاستراتيجية', page: 2242 },
  { match: 'رسالة إلى الطيب محمود', page: 2246 },
  { match: 'استطلاع للأوضاع في غزة', page: 2250 },
  { match: 'تعليقات على كتاب دراسات عن السلفية', page: 2256 },
  { match: 'رسالة إلى الشيخ حامد بن عبد الله', page: 2261 },
  { match: 'توصيات جهادية عامة', page: 2280 },
  { match: 'مراسلات الشيخ عطية الله حول لبنان', page: 2291 },
  { match: 'تعليقات الشيخ عطية الله على مقال العراق', page: 2340 },
  { match: 'مراسلات حول جماعة الدولة', page: 2354 },
  { match: 'مراسلات مع الشيخ بشر البشر', page: 2364 },
  { match: 'رسالة في الأمور المالية', page: 2370 },
  { match: 'بعض الإفادات في مسألة مهادنة', page: 2371 },
  { match: 'الهدنة مع المرتدين', page: 2377 },
  { match: 'حول مفاداة المرتدين', page: 2378 },
  { match: 'مقترح إداري بخصوص تزويج', page: 2382 },
  { match: 'لائحة عمل تحريك طالبان', page: 2383 },
  { match: 'تشاور مشترك حول الصومال', page: 2404 },
  { match: 'تشاور مشترك حول العراق', page: 2407 },
  { match: 'جواب إلى الأخ أبي العباس', page: 2408 },
  { match: 'رسالة إلى المولوي حفيظ الله', page: 2418 },
  { match: 'تعليق على نص كلمة الدكتور أيمن', page: 2419 },
  { match: 'رسالة إلى أبي يحيى الليبي', page: 2421 },
  { match: 'من عبق المراسلات مع الشيخ عطية قراءة', page: 2425 },
  { match: 'مسك الختام', page: 2431 },
];

function norm(s) {
  return s
    .replace(/["''،:؛?؟!!.…\-–—()]/g, ' ')
    .replace(/[ًا]/g, 'ا').replace(/[أإآ]/g, 'ا').replace(/[ى]/g, 'ي').replace(/[ة]/g, 'ه')
    .replace(/\s+/g, ' ').trim();
}
function findPage(title) {
  const n = norm(title);
  for (const entry of pageMap) {
    if (n.includes(norm(entry.match))) return entry.page;
  }
  return null;
}

// ===== 1. Update atiyatullah-index.json =====
let updated = 0, skipped = 0;
for (const section of index) {
  for (const item of section.items) {
    if (!item.slug && !item.page) { skipped++; continue; }
    const newPage = findPage(item.title);
    if (newPage) {
      if (item.slug) {
        const parts = item.slug.split('-');
        parts[0] = String(newPage);
        item.slug = parts.join('-');
      }
      item.page = newPage;
      updated++;
    } else {
      console.log('  ⚠ NO MATCH:', item.title);
      skipped++;
    }
  }
}
console.log(`Index: ${updated} updated, ${skipped} skipped`);
writeFileSync(join(root, 'src/data/atiyatullah-index.json'), JSON.stringify(index, null, 2), 'utf-8');
console.log('✓ Written atiyatullah-index.json');

// ===== 2. Update sidebar-atiyatullah.json =====
function updateSidebarItem(obj) {
  if (obj.link && obj.link.startsWith('/book/atiyatullah/')) {
    const oldSlug = obj.link.split('/').pop();
    const oldBody = oldSlug.replace(/^\d+-/, '');
    // Find item by slug body in the updated index
    for (const section of index) {
      for (const item of section.items) {
        if (item.slug) {
          const itemBody = item.slug.replace(/^\d+-/, '');
          if (itemBody === oldBody) {
            obj.link = '/book/atiyatullah/' + item.slug;
            break;
          }
        }
      }
    }
  }
  if (obj.chapters) {
    for (const ch of obj.chapters) {
      updateSidebarItem(ch);
      if (ch.sections) {
        for (const sec of ch.sections) updateSidebarItem(sec);
      }
    }
  }
}
for (const item of sidebar) updateSidebarItem(item);
writeFileSync(join(root, 'src/data/sidebar-atiyatullah.json'), JSON.stringify(sidebar, null, 2), 'utf-8');
console.log('✓ Written sidebar-atiyatullah.json');

// ===== 3. Update print-mappings.json =====
const newPrintMappings = JSON.parse(JSON.stringify(oldPrintMappings));
const newAtiMap = {};
const oldAtiMap = oldPrintMappings['atiyatullah'] || {};

for (const [sourcePageStr, oldSlugs] of Object.entries(oldAtiMap)) {
  const updatedSlugs = [];
  for (const oldSlug of oldSlugs) {
    const slugBody = oldSlug.replace(/^\d+-/, '');
    let newPage = null;
    for (const section of index) {
      for (const item of section.items) {
        if (item.slug) {
          const itemBody = item.slug.replace(/^\d+-/, '');
          if (itemBody === slugBody) {
            newPage = parseInt(item.slug.split('-')[0]);
            break;
          }
        }
      }
      if (newPage) break;
    }
    if (newPage) {
      const parts = oldSlug.split('-');
      parts[0] = String(newPage);
      updatedSlugs.push(parts.join('-'));
    } else {
      updatedSlugs.push(oldSlug);
    }
  }
  // KEY stays as the source PDF page number (unchanged)
  newAtiMap[sourcePageStr] = updatedSlugs;
}
newPrintMappings['atiyatullah'] = newAtiMap;
writeFileSync(join(root, 'src/data/print-mappings.json'), JSON.stringify(newPrintMappings, null, 2), 'utf-8');
console.log('✓ Written print-mappings.json');

// ===== 4. Update extracted-quotes.json =====
let qUpdated = 0;
for (const q of quotes) {
  if (q.url && q.url.includes('/book/atiyatullah/')) {
    const slug = q.url.split('/').pop().replace(/\/$/, '');
    if (!slug) continue;
    const slugBody = slug.replace(/^\d+-/, '');
    // Find in updated index
    for (const section of index) {
      for (const item of section.items) {
        if (item.slug) {
          const itemBody = item.slug.replace(/^\d+-/, '');
          if (itemBody === slugBody) {
            q.url = '/book/atiyatullah/' + item.slug + '/';
            q.slug = item.slug;
            qUpdated++;
            break;
          }
        }
      }
    }
  }
}
writeFileSync(join(root, 'src/data/extracted-quotes.json'), JSON.stringify(quotes, null, 2), 'utf-8');
console.log(`✓ Written extracted-quotes.json (${qUpdated} updated)`);

// ===== 5. Delete old extracted PDFs =====
const extractedDir = join(root, 'public/media/extracted/atiyatullah');
if (existsSync(extractedDir)) {
  let deleted = 0;
  for (const f of readdirSync(extractedDir)) {
    if (f.endsWith('.pdf')) { unlinkSync(join(extractedDir, f)); deleted++; }
  }
  console.log(`✓ Deleted ${deleted} old PDFs`);
}

console.log('\n✅ Done! Now run: node scripts/extract-pdf-pages.mjs');
