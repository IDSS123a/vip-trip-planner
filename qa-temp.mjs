import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;

// Stub URL/Blob for jsPDF save; we'll use output('arraybuffer')
import fs from 'node:fs';
import path from 'node:path';
process.chdir('/dev-server');

// Dynamic import after globals set
const { createIdssPdf, paginate, drawSectionTitle, drawDivider, writeWrapped, writeKeyValue, setFill, setText, setDraw, PDF_THEME } = await import('./src/lib/pdfTheme');

const doc = createIdssPdf();
const ML = PDF_THEME.margin.left, MR = PDF_THEME.margin.right, PW = PDF_THEME.page.width;
const cw = PW - ML - MR;
let y = PDF_THEME.margin.top + 10;

// Title
doc.setFont('DejaVu','bold'); doc.setFontSize(20);
const title = 'Sarajevo → Zagreb → Ljubljana → Postojna';
doc.text(title, PW/2, y, { align: 'center' }); y += 10;

// Badge
const badge = 'Standard  ·  645 EUR / učenik';
doc.setFontSize(10); doc.setFont('DejaVu','bold');
const bw = doc.getTextWidth(badge) + 10;
const bx = (PW - bw) / 2;
setFill(doc, PDF_THEME.color.primary);
doc.roundedRect(bx, y - 4, bw, 7, 1.5, 1.5, 'F');
setText(doc, PDF_THEME.color.white);
doc.text(badge, PW/2, y + 1, { align: 'center' });
setText(doc, PDF_THEME.color.text);
y += 10;

y = drawDivider(doc, y) + 4;
y = drawSectionTitle(doc, 'Detalji putovanja', y);

const pairs = [
  ['Ruta', 'Sarajevo → Zagreb → Ljubljana → Postojna → Sarajevo'],
  ['Polazište', 'Sarajevo, Buka 13'],
  ['Destinacije', 'Zagreb  →  Ljubljana  →  Postojnska Jama'],
  ['Datum polaska', '18.05.2026'],
  ['Datum povratka', '22.05.2026'],
  ['Razred', '7. razred'],
  ['Broj učenika', '14'],
  ['Trajanje', '5 dana'],
  ['Udaljenost', '1 240 km'],
  ['Vrijeme putovanja', '18 h'],
  ['Pouzdanost', '92%'],
  ['Pratitelji', 'Amina Hadžić, Davor Mulalić'],
];
const cardStartY = y - 1;
for (const [k,v] of pairs) y = writeKeyValue(doc, k, v, y);
setDraw(doc, PDF_THEME.color.rule);
doc.setLineWidth(0.2);
doc.roundedRect(ML - 3, cardStartY - 4, cw + 6, y - cardStartY + 2, 1.5, 1.5);
y += 6;

y = drawSectionTitle(doc, 'Troškovi po učeniku (EUR)', y);
// Header row
setFill(doc, PDF_THEME.color.primary);
doc.rect(ML, y - 4.5, cw, 7, 'F');
doc.setFont('DejaVu','bold'); doc.setFontSize(9);
setText(doc, PDF_THEME.color.white);
doc.text('Stavka', ML+2, y);
doc.text('Iznos (EUR)', ML+70, y);
doc.text('Detalji', ML+100, y);
setText(doc, PDF_THEME.color.text);
y += 6;

const rows = [
  ['Transport', 180, 'Bus, 2 dana puta'],
  ['Smještaj', 220, '4 noći, 3* hotel'],
  ['Obroci', 120, 'Polupansion'],
  ['Ulaznice', 45, 'Postojnska Jama, Plitvice'],
  ['Aktivnosti', 30, ''],
  ['Lokalni prijevoz', 20, ''],
  ['Rezerva (5%)', 30, ''],
];
doc.setFont('DejaVu','normal');
rows.forEach(([l,v,d], i) => {
  if (i % 2 === 0) { setFill(doc, PDF_THEME.color.rowAlt); doc.rect(ML, y - 4, cw, 5.8, 'F'); }
  doc.setFontSize(9); setText(doc, PDF_THEME.color.text);
  doc.text(String(l), ML+2, y); doc.text(String(v), ML+70, y);
  if (d) { doc.setFontSize(7.5); setText(doc, PDF_THEME.color.muted); doc.text(String(d), ML+100, y); setText(doc, PDF_THEME.color.text); }
  y += 6;
});
setFill(doc, PDF_THEME.color.primaryDark);
doc.rect(ML, y - 4.5, cw, 8, 'F');
doc.setFont('DejaVu','bold'); doc.setFontSize(10);
setText(doc, PDF_THEME.color.white);
doc.text('UKUPNO', ML+2, y+0.5);
doc.text('645 EUR', ML+70, y+0.5);
doc.text('645 EUR / učenik', ML+100, y+0.5);
setText(doc, PDF_THEME.color.text);
y += 12;

y = drawDivider(doc, y) + 2;
y = drawSectionTitle(doc, 'Smještaj', y);
y = writeWrapped(doc, 'Hotel Phoenix 3* u Zagrebu (2 noći) i Hotel Park 3* u Ljubljani (2 noći). Sve sobe sa privatnim kupatilom, doručak i večera uključeni. Wifi besplatan.', y);
y += 4;

y = drawDivider(doc, y) + 2;
y = drawSectionTitle(doc, 'Dnevni itinerar', y, { fontSize: 14 });
const days = [
  { day: 1, title: 'Polazak iz Sarajeva', date: '18.05.2026', acts: [
    { t: '07:00', d: 'Okupljanje učenika ispred škole, Buka 13', loc: 'IDSS Sarajevo' },
    { t: '07:30', d: 'Polazak autobusom prema Zagrebu', loc: 'Sarajevo' },
    { t: '13:00', d: 'Pauza za ručak na granici', loc: 'Stara Gradiška' },
    { t: '17:00', d: 'Smještaj u hotel, slobodno vrijeme', loc: 'Hotel Phoenix, Zagreb', notes: 'Lights out u 22:00' },
  ]},
  { day: 2, title: 'Razgledanje Zagreba', date: '19.05.2026', acts: [
    { t: '08:00', d: 'Doručak u hotelu', loc: 'Hotel Phoenix' },
    { t: '09:30', d: 'Vođena tura kroz Gornji Grad i Katedralu', loc: 'Centar Zagreba' },
    { t: '13:00', d: 'Ručak na Dolcu', loc: 'Dolac, Zagreb' },
    { t: '15:00', d: 'Tehnički muzej Nikola Tesla', loc: 'Savska 18, Zagreb' },
    { t: '19:00', d: 'Večera, Viber javljanje roditeljima 19:00–20:00', loc: 'Hotel' },
  ]},
];
days.forEach(day => {
  setFill(doc, PDF_THEME.color.primary);
  doc.rect(ML, y - 5, cw, 8, 'F');
  doc.setFont('DejaVu','bold'); doc.setFontSize(11);
  setText(doc, PDF_THEME.color.white);
  doc.text(`Dan ${day.day}: ${day.title}`, ML+3, y);
  doc.setFontSize(9); doc.setFont('DejaVu','normal');
  doc.text(day.date, PW - MR - 3, y, { align: 'right' });
  setText(doc, PDF_THEME.color.text);
  y += 8;
  day.acts.forEach(a => {
    doc.setFontSize(9); doc.setFont('DejaVu','bold');
    setText(doc, PDF_THEME.color.primaryDark);
    doc.text(a.t, ML+2, y);
    setText(doc, PDF_THEME.color.text);
    doc.setFont('DejaVu','normal');
    doc.text(a.d, ML+22, y); y += 4.4;
    if (a.loc) { doc.setFontSize(8); setText(doc, PDF_THEME.color.muted); doc.text('📍 ' + a.loc, ML+22, y); setText(doc, PDF_THEME.color.text); y += 4; }
    if (a.notes) { doc.setFontSize(8); setText(doc, PDF_THEME.color.primaryDark); doc.text('Napomena: ' + a.notes, ML+22, y); setText(doc, PDF_THEME.color.text); y += 4; }
    setDraw(doc, PDF_THEME.color.rule); doc.setLineWidth(0.15);
    doc.line(ML+2, y, PW-MR-2, y); y += 2.5;
  });
  y += 4;
});

paginate(doc);
const buf = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync('/tmp/qa-trip.pdf', buf);
console.log('OK', buf.length, 'pages:', doc.getNumberOfPages());
