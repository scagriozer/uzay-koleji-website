// Sanity'den uretilen blog sayfalarini eski statik HTML ile karsilastirir.
// Kullanim: node scripts/compare-blog.mjs <base-url> [orijinal-dizin]
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

const base = process.argv[2] ?? 'http://localhost:3111';
const orig = process.argv[3] ?? '.planning/faz2/blog-original';
const files = fs.readdirSync(orig).filter((f) => f.endsWith('.html'));
// Kaynak HTML'deki bicimlendirme bosluklari (bloklar arasi) sayilmaz.
const norm = (s) => s.replace(/\s+/g, '');
let bad = 0;
const diff = (name, msg) => { bad++; console.log(`FARK ${name}: ${msg}`); };

for (const f of files) {
  const url = f === 'index.html' ? `${base}/blog/` : `${base}/blog/${f}`;
  const html = await (await fetch(url, { headers: process.env.BYPASS ? { 'x-vercel-protection-bypass': process.env.BYPASS } : {} })).text();
  const a = new JSDOM(fs.readFileSync(`${orig}/${f}`, 'utf8')).window.document;
  const b = new JSDOM(html).window.document;
  const get = (d, s, at) => (at ? d.querySelector(s)?.getAttribute(at) : d.querySelector(s)?.textContent) ?? null;
  for (const [label, sel, at] of [['title', 'title'], ['description', 'meta[name=description]', 'content'], ['canonical', 'link[rel=canonical]', 'href'], ['og:title', 'meta[property="og:title"]', 'content'], ['og:description', 'meta[property="og:description"]', 'content'], ['og:type', 'meta[property="og:type"]', 'content'], ['og:locale', 'meta[property="og:locale"]', 'content']]) {
    const x = get(a, sel, at), y = get(b, sel, at);
    if (x !== y) diff(f, `${label}: "${x}" != "${y}"`);
  }
  // JSON-LD deep-equal
  // Kasitli farklar: Article.description meta aciklamasina esitlenir (4 yazida eski kisa surum kalmisti),
  // publisher.logo her yazida bulunur (2 yazida eksik/yarimdi).
  const ld = (d) => [...d.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
    const j = JSON.parse(s.textContent);
    for (const g of j['@graph'] ?? []) if (g['@type'] === 'Article') { g.description = '*'; delete g.publisher?.logo; }
    for (const g of j['@graph'] ?? []) if (g['@type'] === 'FAQPage') g.mainEntity.sort((x, y) => x.name.localeCompare(y.name, 'tr'));
    return j;
  });
  if (!isDeepStrictEqual(ld(a), ld(b))) {
    const ja = JSON.stringify(ld(a), null, 1).split('\n'), jb = JSON.stringify(ld(b), null, 1).split('\n');
    const k = ja.findIndex((l, i) => l !== jb[i]);
    diff(f, `JSON-LD farkli satir ${k}: ${ja[k]?.slice(0, 120)} != ${jb[k]?.slice(0, 120)}`);
  }
  // main metni
  // TOC etiketleri artik basliklari yansitir (2 yazida elle kisaltilmisti); index kartlari siradan bagimsiz.
  const mainText = (d) => {
    const m = d.querySelector('main').cloneNode(true);
    m.querySelectorAll('.toc').forEach((e) => e.remove());
    if (f === 'index.html') { const g = m.querySelector('.blog-grid'); const cards = [...g.children].map((c) => c.textContent.replace(/\s+/g, '') + '|' + c.getAttribute('href')).sort(); g.textContent = cards.join(''); }
    return norm(m.textContent);
  };
  const ta = mainText(a), tb = mainText(b);
  if (ta !== tb) {
    let i = 0; while (ta[i] === tb[i]) i++;
    diff(f, `main metni farkli @${i}: "${ta.slice(Math.max(0, i - 40), i + 60)}" != "${tb.slice(Math.max(0, i - 40), i + 60)}"`);
  }
  // id seti ve baglantilar
  const ids = (d) => [...d.querySelectorAll('main [id]')].map((e) => e.id).sort().join(',');
  if (ids(a) !== ids(b)) diff(f, 'id listesi farkli');
  const hrefs = (d) => [...d.querySelectorAll('main a:not(.toc a)')].map((e) => e.getAttribute('href')).sort().join(' ');
  if (hrefs(a) !== hrefs(b)) diff(f, 'main baglantilari farkli');
  const tags = (d) => [...d.querySelectorAll('main *')].map((e) => e.tagName + '.' + e.className).join(' ');
  if (f !== 'index.html' && tags(a).replace(/DIV\.table-wrap /g, '') !== tags(b).replace(/DIV\.table-wrap /g, '').replace(/TABLE\. /g, 'TABLE. ')) diff(f, 'main DOM etiket dizisi farkli (table-wrap haric)');
  // kabuk: banner ve tracking
  if (!b.querySelector('#uzay-cookie-banner') || (f !== 'index.html' && !b.querySelector('a[data-cookie-prefs]'))) diff(f, 'cerez banner/baglantisi yok');
  if (!html.includes('GTM-M8J5QPW7')) diff(f, 'GTM yok');
  if (/[​-‏﻿]/.test(html)) diff(f, 'stega karakteri var');
}
console.log(bad ? `${bad} fark` : `${files.length} sayfa: fark yok`);
process.exit(bad ? 1 : 0);
