// Build öncesi kontrol. Statik sayfalar public/ altından aynen yayınlanıyor; aşağıdaki hatalar
// sessizce 404'e ya da başvuru kaybına yol açtığı için build'i düşürür.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

// vercel.json yoksa Vercel "Other" preset'iyle public/'i statik yayınlar ve /api/lead 404 olur.
// Başka anahtar (rewrites, cleanUrls, headers) Next yönlendirmesiyle çakışır.
const vercelJson = path.join(root, 'vercel.json');
if (!existsSync(vercelJson) || JSON.stringify(JSON.parse(readFileSync(vercelJson, 'utf8'))) !== '{"framework":"nextjs"}') {
  errors.push('vercel.json yalnız {"framework":"nextjs"} olmalı');
}

// Kökte yalnız bu girdiler olabilir. Eski yapıya (kök, blog/, kampusler/) açılmış bir içerik
// PR'ı merge edilirse dosya yayına çıkmaz; build geçip içerik sessizce kaybolmasın.
const ALLOWED_ROOT = new Set(['app', 'public', 'scripts', 'package.json', 'package-lock.json', 'next.config.ts', 'tsconfig.json', 'vercel.json', '.gitignore', '.vercelignore', '.git']);
const ignored = readFileSync(path.join(root, '.gitignore'), 'utf8').split('\n').map((l) => l.trim().replace(/\/$/, '')).filter((l) => l && !l.startsWith('#') && !l.startsWith('!'));
const isIgnored = (name) => ignored.some((p) => new RegExp('^' + p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$').test(name));
for (const name of readdirSync(root)) {
  if (!ALLOWED_ROOT.has(name) && !isIgnored(name)) errors.push(`kökte beklenmeyen girdi: ${name} (site dosyaları public/ altında olmalı)`);
}

for (const required of ['index.html', 'robots.txt', 'sitemap.xml', 'programlar/index.html', 'blog/index.html']) {
  if (!existsSync(path.join(root, 'public', required))) errors.push(`public/${required} yok`);
}

// public/ altındaki dosya aynı yoldaki route'u gölgeler.
if (existsSync(path.join(root, 'public', 'api'))) errors.push("public/api, /api route'larını gölgeler");

// .DS_Store gitignore'da olduğu için yayına çıkamaz; diğer nokta dosyalarında Next 500 döndürüyor.
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.startsWith('.') && entry.name !== '.DS_Store') errors.push(`public/ altında nokta dosyası: ${path.relative(root, full)}`);
  }
};
walk(path.join(root, 'public'));

if (errors.length) {
  console.error('check-public: build durduruldu\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('check-public: tamam');
