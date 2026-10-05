import type { NextConfig } from 'next';

const config: NextConfig = {
  // /api/lead/ gibi yollar 308 almasın; slash yönlendirmeleri proxy.ts'te.
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  // Sayfalar statik; /_next/image ucu kullanılmıyor, açık kalmasın.
  images: { unoptimized: true },
  async rewrites() {
    return {
      // Next, public/ altından dizin index'i sunmaz. /programlar/ ve /blog/ proxy.ts'te.
      beforeFiles: [{ source: '/', destination: '/index.html' }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default config;
