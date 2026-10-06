// public/blog/*.html -> Sanity NDJSON (post). Kullanim: node scripts/migrate-blog.mjs [giris-dizini] [cikis-dizini]
// Varsayilan cikis .planning/faz2/ (gitignore'da). Hata verirse hicbir dosya yazilmaz.
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

const inDir = process.argv[2] ?? 'public/blog';
const outDir = process.argv[3] ?? '.planning/faz2';
const EM = String.fromCharCode(8212);
const MONTHS = { Ocak: 1, Şubat: 2, Mart: 3, Nisan: 4, Mayıs: 5, Haziran: 6, Temmuz: 7, Ağustos: 8, Eylül: 9, Ekim: 10, Kasım: 11, Aralık: 12 };
const STD_NOTE = 'Bu içerik bilgilendirme amaçlıdır. Güncel program ve kontenjan bilgisi için okulla iletişime geçiniz.';
const errors = [];
const fail = (slug, msg) => errors.push(`${slug}: ${msg}`);

const toIso = (txt, slug) => {
  const m = txt.trim().match(/^(\d{1,2}) (\S+) (\d{4})$/);
  if (!m || !MONTHS[m[2]]) { fail(slug, `tarih ayrilamadi: "${txt}"`); return null; }
  return `${m[3]}-${String(MONTHS[m[2]]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
};
const norm = (s) => s.replace(/\s+/g, ' ').trim();

function makeKeys() {
  let n = 0;
  return () => `k${(n++).toString(36)}`;
}

// Satir ici icerik -> { children, markDefs }
function inline(el, key, slug) {
  const children = [];
  const markDefs = [];
  const walk = (node, marks) => {
    for (const c of node.childNodes) {
      if (c.nodeType === 3) {
        const text = c.textContent.replace(/\s+/g, ' ');
        if (text) children.push({ _type: 'span', _key: key(), text, marks: [...marks] });
      } else if (c.nodeType === 1) {
        const tag = c.tagName;
        if (tag === 'STRONG') walk(c, [...marks, 'strong']);
        else if (tag === 'EM') walk(c, [...marks, 'em']);
        else if (tag === 'A') {
          const k = key();
          markDefs.push({ _type: 'link', _key: k, href: c.getAttribute('href') });
          walk(c, [...marks, k]);
        } else fail(slug, `desteklenmeyen satir ici etiket: ${tag}`);
      }
    }
  };
  walk(el, []);
  if (children.length) {
    children[0].text = children[0].text.replace(/^ /, '');
    children[children.length - 1].text = children[children.length - 1].text.replace(/ $/, '');
  }
  return { children: children.filter((c) => c.text !== ''), markDefs };
}

function block(el, style, key, slug, extra = {}) {
  const { children, markDefs } = inline(el, key, slug);
  return { _type: 'block', _key: key(), style, markDefs, children, ...extra };
}

function convertBody(body, key, slug, linkedFaqs) {
  const out = [];
  const usedLd = new Set();
  const kids = [...body.children];
  let i = 0;
  while (i < kids.length) {
    const el = kids[i];
    const tag = el.tagName;
    if (tag === 'P') out.push(block(el, 'normal', key, slug));
    else if (tag === 'H2' || tag === 'H3') {
      const b = block(el, tag.toLowerCase(), key, slug);
      if (tag === 'H2') {
        const id = el.getAttribute('id');
        if (!id) fail(slug, `h2 id yok: ${norm(el.textContent)}`);
        const k = key();
        b.markDefs.push({ _type: 'anchor', _key: k, id });
        for (const c of b.children) c.marks.push(k);
      } else if (el.getAttribute('id')) fail(slug, 'h3 id beklenmiyordu');
      out.push(b);
      // SSS: h2 sonrasi ard arda h3+p ciftleri tek faqList blogu olur
      if (tag === 'H2' && el.getAttribute('id') === 'sss') {
        const items = [];
        let j = i + 1;
        while (j < kids.length && kids[j].tagName === 'H3' && kids[j + 1]?.tagName === 'P') {
          const q = norm(kids[j].textContent);
          const aEl = kids[j + 1];
          const plain = norm(aEl.textContent);
          const item = { _key: key(), _type: 'faqItem', question: q, answer: [block(aEl, 'normal', key, slug)], onPage: true, inJsonLd: linkedFaqs.has(q) };
          if (item.inJsonLd && linkedFaqs.get(q) !== plain) item.jsonLdAnswer = linkedFaqs.get(q);
          if (item.inJsonLd) usedLd.add(q);
          items.push(item);
          j += 2;
        }
        // JSON-LD'de olup sayfada gorunmeyen sorular
        for (const [name, text] of linkedFaqs) {
          if (!usedLd.has(name)) items.push({ _key: key(), _type: 'faqItem', question: name, answer: [{ _type: 'block', _key: key(), style: 'normal', markDefs: [], children: [{ _type: 'span', _key: key(), text, marks: [] }] }], onPage: false, inJsonLd: true });
        }
        out.push({ _type: 'faqList', _key: key(), items });
        i = j;
        continue;
      }
    } else if (tag === 'UL' || tag === 'OL') {
      for (const li of el.children) {
        if (li.tagName !== 'LI') { fail(slug, 'liste icinde LI disi cocuk'); continue; }
        if (li.querySelector('ul,ol')) fail(slug, 'ic ice liste');
        out.push(block(li, 'normal', key, slug, { listItem: tag === 'UL' ? 'bullet' : 'number', level: 1 }));
      }
    } else if (tag === 'TABLE' || (tag === 'DIV' && el.classList.contains('table-wrap'))) {
      const table = tag === 'TABLE' ? el : el.querySelector('table');
      if (!table || (tag === 'DIV' && el.children.length !== 1)) fail(slug, 'table-wrap beklenmeyen icerik');
      const heads = table.querySelectorAll('thead tr');
      if (heads.length !== 1) fail(slug, `thead satir sayisi ${heads.length}`);
      const rows = [...table.querySelectorAll('tr')].map((tr) => ({
        _key: key(),
        _type: 'row',
        cells: [...tr.children].map((c) => {
          if (c.querySelector('*')) fail(slug, 'tablo hucresinde etiket var');
          return norm(c.textContent);
        }),
      }));
      if (table.querySelector('tbody th')) fail(slug, 'tbody icinde th');
      out.push({ _type: 'table', _key: key(), rows });
    } else if (tag === 'DIV' && el.classList.contains('cta-box')) {
      const h3 = el.querySelector('h3');
      const p = el.querySelector('p');
      const as = [...el.querySelectorAll('a')];
      const order = [...el.children].map((c) => c.tagName).join(',');
      if (!h3 || !p || !as.length || !/^H3,P(,A)+$/.test(order)) fail(slug, `cta-box beklenmeyen yapi: ${order}`);
      out.push({
        _type: 'ctaBox',
        _key: key(),
        title: norm(h3.textContent),
        text: norm(p.textContent),
        buttons: as.map((a) => ({ _key: key(), _type: 'button', label: norm(a.textContent), href: a.getAttribute('href') })),
      });
    } else if (tag === 'FOOTER') {
      // Sablon uretir
    } else fail(slug, `desteklenmeyen govde ogesi: ${tag}.${el.className}`);
    i++;
  }
  return out;
}

const files = fs.readdirSync(inDir).filter((f) => f.endsWith('.html') && f !== 'index.html').sort();
const index = new JSDOM(fs.readFileSync(path.join(inDir, 'index.html'), 'utf8')).window.document;
const cards = new Map([...index.querySelectorAll('.blog-card')].map((c) => [c.getAttribute('href'), c]));
if (cards.size !== files.length) fail('index', `kart ${cards.size} != dosya ${files.length}`);

const docs = [];
const expectedLd = {};
for (const f of files) {
  const slug = f.replace(/\.html$/, '');
  const d = new JSDOM(fs.readFileSync(path.join(inDir, f), 'utf8')).window.document;
  const q = (s) => d.querySelector(s);
  const attr = (s, a) => q(s)?.getAttribute(a) ?? null;
  const card = cards.get(f);
  if (!card) fail(slug, 'index kartı yok');

  const ld = JSON.parse(q('script[type="application/ld+json"]').textContent);
  expectedLd[slug] = ld;
  const faqLd = ld['@graph'].find((g) => g['@type'] === 'FAQPage');
  const ldQs = new Map(faqLd.mainEntity.map((e) => [e.name, e.acceptedAnswer.text]));
  const article = ld['@graph'].find((g) => g['@type'] === 'Article');
  const crumb = ld['@graph'].find((g) => g['@type'] === 'BreadcrumbList').itemListElement[2].name;

  const titleTag = q('title').textContent;
  if (!titleTag.endsWith(' | Uzay Koleji')) fail(slug, 'title son eki beklenenden farkli');
  const meta = norm(q('.article-meta').textContent);
  const rd = meta.match(/(\d+) dk okuma/);
  const footPs = [...q('.article-footer').querySelectorAll('p')].map((p) => norm(p.textContent));
  const foot = (footPs[1] ?? '').match(/^Yayın tarihi: (.+?) · Son güncelleme: (.+)$/);
  const footNote = footPs[2];
  if (footPs.length !== 4 || footPs[0] !== 'Yazar: Uzay Koleji Editör Ekibi' || footPs[3] !== 'Çerez Tercihleri') fail(slug, `footer beklenmeyen: ${footPs.length} p`);
  const published = foot && toIso(foot[1], slug);
  const updated = foot && toIso(foot[2], slug);
  if (published && published !== article.datePublished) fail(slug, 'datePublished tutmuyor');
  if (updated && updated !== article.dateModified) fail(slug, 'dateModified tutmuyor');
  const key = makeKeys();
  const body = convertBody(q('.article-body'), key, slug, ldQs);

  if (!body.some((b) => b._type === 'faqList')) fail(slug, 'faqList yok');

  const doc = {
    _id: `post-${slug}`,
    _type: 'post',
    title: norm(q('h1').textContent),
    slug: { _type: 'slug', current: slug },
    excerpt: card ? norm(card.querySelector('.blog-card__excerpt').textContent) : null,
    seoDescription: attr('meta[name="description"]', 'content'),
    tldr: norm(q('.tldr p').textContent),
    footerNote: footNote,
    tag: norm(q('.article-tag').textContent),
    readingMinutes: Number(rd?.[1]),
    publishedAt: published,
    updatedAt: updated,
    breadcrumbName: crumb,
    seoTitle: titleTag.replace(/ \| Uzay Koleji$/, ''),
    ogTitle: attr('meta[property="og:title"]', 'content'),
    ogDescription: attr('meta[property="og:description"]', 'content'),
    body,
  };
  // Sablon geri dusurme: alan bossa baska alandan turetilir
  if (doc.breadcrumbName === doc.title) delete doc.breadcrumbName;
  if (doc.ogTitle === doc.seoTitle) delete doc.ogTitle;
  if (doc.ogDescription === doc.seoDescription) delete doc.ogDescription;
  if (doc.seoTitle === doc.title) delete doc.seoTitle;
  if (updated === published) delete doc.updatedAt;
  if (doc.footerNote === STD_NOTE) delete doc.footerNote;

  for (const [k, v] of Object.entries(doc)) {
    if (v === null || Number.isNaN(v)) fail(slug, `${k} bos`);
    if (typeof v === 'string' && v.includes(EM)) fail(slug, `${k} em-dash iceriyor`);
  }
  if (JSON.stringify(body).includes(EM)) fail(slug, 'govde em-dash iceriyor');
  docs.push(doc);
}

if (errors.length) {
  console.error(`HATA (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
fs.mkdirSync(path.join(outDir, 'expected-jsonld'), { recursive: true });
fs.writeFileSync(path.join(outDir, 'posts.ndjson'), docs.map((x) => JSON.stringify(x)).join('\n') + '\n');
for (const [slug, ld] of Object.entries(expectedLd)) fs.writeFileSync(path.join(outDir, 'expected-jsonld', `${slug}.json`), JSON.stringify(ld, null, 2));
console.log(`${docs.length} yazi yazildi: ${path.join(outDir, 'posts.ndjson')}`);
