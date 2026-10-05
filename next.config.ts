import type { NextConfig } from 'next';

const config: NextConfig = {
  // /api/lead/ gibi yollar 308 almasın; slash yönlendirmeleri proxy.ts'te.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return {
      // Next, public/ altından dizin index'i sunmaz.
      beforeFiles: [
        { source: '/', destination: '/index.html' },
        { source: '/programlar/', destination: '/programlar/index.html' },
        { source: '/blog/', destination: '/blog/index.html' },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    // permanent: true 308 üretir; 301 için statusCode.
    return [{ source: '/index.html', destination: '/', statusCode: 301 }];
  },
};

export default config;
