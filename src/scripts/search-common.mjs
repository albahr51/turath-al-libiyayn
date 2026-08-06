export function normArabic(s) {
  return s
    .replace(/[\u0610-\u061A\u064B-\u0652\u0670\u06D6-\u06ED\u08F0-\u08FF]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي');
}

const PREFIXES = ['وال', 'فال', 'بال', 'ال'];
const CONNECTIVES = ['و', 'ف', 'ب'];
const PRESENT = ['ي', 'ت'];
const SUFFIXES = ['هما', 'كما', 'هم', 'هن', 'كن', 'كم', 'ها', 'نا', 'وا', 'ون', 'ين', 'ان', 'ات', 'ه', 'ك'];

const FIXED_FORMS = { 'الله': 'الله' };

export function stemWord(w) {
  let s = w;
  if (!s || s.length <= 3) return s || '';
  if (FIXED_FORMS[s]) return FIXED_FORMS[s];

  for (const c of CONNECTIVES) {
    if (s.startsWith(c)) {
      const rest = s.slice(1);
      if (FIXED_FORMS[rest]) return FIXED_FORMS[rest];
    }
  }

  for (let i = 0; i < 3; i++) {
    const before = s;
    if (s.length > 3) {
      for (const p of PREFIXES) {
        if (s.startsWith(p) && s.length - p.length >= 3) { s = s.slice(p.length); break; }
      }
      for (const c of CONNECTIVES) {
        if (s.startsWith(c) && s.length - 1 >= 3) { s = s.slice(1); break; }
      }
      for (const c of PRESENT) {
        if (s.startsWith(c) && s.length - 1 >= 3) { s = s.slice(1); break; }
      }
    }
    if (s === before) break;
  }

  for (let i = 0; i < 2; i++) {
    const before = s;
    for (const suf of SUFFIXES) {
      if (s.endsWith(suf) && s.length - suf.length >= 3) { s = s.slice(0, -suf.length); break; }
    }
    if (s === before) break;
  }

  if (s.length < 3) return w;
  return s;
}

export function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildHighlightRegex(terms) {
  const alts = [];
  for (const t of terms) {
    if (!t) continue;
    const words = normArabic(t).split(/\s+/).filter(w => w.length >= 2);
    for (const w of words) {
      const forms = [...new Set([w, stemWord(w)])].filter(Boolean);
      for (const f of forms) {
        alts.push('(?:وال|فال|بال|ال|و|ف|ب)?' + escapeRe(f) + '(?:هما|كما|هم|هن|كن|كم|ها|نا|وا|ون|ين|ان|ات|ه|ك)?');
      }
    }
  }
  if (!alts.length) return null;
  return new RegExp('(' + alts.join('|') + ')', 'gi');
}
