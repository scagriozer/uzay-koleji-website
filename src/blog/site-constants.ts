// Sanity'ye tasinmamis statik sayfalar (sitemap.ts bunlari Sanity yazilariyla birlestirir). Sayfa tasindikca buradan cikar.
export const STATIC_URLS = [
  { path: '/', lastModified: '2026-07-12', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/etkinlikler.html', lastModified: '2026-06-10', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/kayit.html', lastModified: '2026-07-01', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/programlar/', lastModified: '2026-06-03', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/programlar/havacilik.html', lastModified: '2026-06-03', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/programlar/biyomedikal.html', lastModified: '2026-06-03', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/programlar/saglik-hizmetleri.html', lastModified: '2026-06-03', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/programlar/elektrik-elektronik.html', lastModified: '2026-06-03', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/programlar/enerji.html', lastModified: '2026-06-03', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/programlar/gida-teknolojileri.html', lastModified: '2026-06-03', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/programlar/turizm-otelcilik.html', lastModified: '2026-06-03', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/kampusler/cukurova.html', lastModified: '2026-06-03', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/kampusler/seyhan.html', lastModified: '2026-06-03', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/kampusler/yuregir.html', lastModified: '2026-06-03', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/gizlilik-politikasi.html', lastModified: '2026-06-02', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/gurur/sampiyonluklar.html', lastModified: '2026-08-31', changeFrequency: 'monthly', priority: 0.6 },
] as const;
