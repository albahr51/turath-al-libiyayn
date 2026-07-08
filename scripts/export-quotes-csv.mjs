import fs from 'fs';
const quotes = JSON.parse(fs.readFileSync('src/data/extracted-quotes.json', 'utf8'));
// UTF-8 BOM for Excel
const BOM = '\uFEFF';
let csv = BOM + 'id,text,book,title,author,page,decision\n';
quotes.forEach((q, i) => {
  const escape = s => '"' + (s || '').replace(/"/g, '""') + '"';
  csv += (i + 1) + ',' + escape(q.text) + ',' + escape(q.book) + ',' + escape(q.title) + ',' + q.author + ',' + q.page + ',\n';
});
fs.writeFileSync('src/data/quotes-review.csv', csv, 'utf8');
console.log('Done! ' + quotes.length + ' quotes exported to src/data/quotes-review.csv');
