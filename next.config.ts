import type { NextConfig } from 'next';

const config: NextConfig = {
  // /api/lead/ ve /programlar gibi yollar 308 almasın.
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  // Sayfalar statik; /_next/image ucu kullanılmıyor. unoptimized tek başına Vercel'deki ucu
  // kapatmıyor; boş izin listeleri hiçbir kaynağın dönüştürülmesine izin vermez.
  images: { unoptimized: true, localPatterns: [], remotePatterns: [] },
  async redirects() {
    return [{ source: '/blog/index.html', destination: '/blog/', statusCode: 301 }];
  },
  async headers() {
    // Dahili rewrite hedefleri doğrudan açılırsa mükerrer içerik olmasın.
    return [
      { source: '/blog-post/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
      { source: '/blog-index', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
      { source: '/studio/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
    ];
  },
  async rewrites() {
    return {
      // Next, public/ altından dizin index'i sunmaz. Slash'lı ve slash'sız adres bugünkü canlı
      // davranıştaki gibi ikisi de 200 döner. Slash yönlendirmesi burada yapılmaz: redirects()
      // sonsuz döngüye girer, proxy ise bu sayfaları her istekte fonksiyondan geçirir.
      beforeFiles: [
        { source: '/', destination: '/index.html' },
        { source: '/programlar', destination: '/programlar/index.html' },
        { source: '/programlar/', destination: '/programlar/index.html' },
        { source: '/blog', destination: '/blog-index' },
        { source: '/blog/', destination: '/blog-index' },
        { source: '/blog/:slug.html', destination: '/blog-post/:slug' },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default config;
