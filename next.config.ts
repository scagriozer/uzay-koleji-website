import type { NextConfig } from 'next';

const config: NextConfig = {
  // /api/lead/ ve /programlar gibi yollar 308 almasın.
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  // Sayfalar statik; /_next/image ucu kullanılmıyor. unoptimized tek başına Vercel'deki ucu
  // kapatmıyor; boş izin listeleri hiçbir kaynağın dönüştürülmesine izin vermez.
  images: { unoptimized: true, localPatterns: [], remotePatterns: [] },
  async rewrites() {
    return {
      // Next, public/ altından dizin index'i sunmaz. Slash'lı ve slash'sız adres bugünkü canlı
      // davranıştaki gibi ikisi de 200 döner. Slash yönlendirmesi burada yapılmaz: redirects()
      // sonsuz döngüye girer, proxy ise bu sayfaları her istekte fonksiyondan geçirir.
      beforeFiles: [
        { source: '/', destination: '/index.html' },
        { source: '/programlar', destination: '/programlar/index.html' },
        { source: '/programlar/', destination: '/programlar/index.html' },
        { source: '/blog', destination: '/blog/index.html' },
        { source: '/blog/', destination: '/blog/index.html' },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default config;
