import { NextResponse, type NextRequest } from 'next/server';

// Dizin index'leri. next.config rewrites/redirects burada kullanılmıyor, çünkü:
// - redirects() ile /programlar -> /programlar/ sonsuz döngü yapar (skipTrailingSlashRedirect
//   altında route regex'i slash'ı opsiyonel sayar),
// - rewrites() harf duyarsızdır; /BLOG/ gibi eskiden 404 olan adresler 200 dönerdi.
const INDEX_DIRS = ['/programlar', '/blog'];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  for (const dir of INDEX_DIRS) {
    if (pathname === dir) {
      // nextUrl.clone() sondaki slash'ı siler.
      return NextResponse.redirect(new URL(dir + '/' + search, request.url), 301);
    }
    if (pathname === dir + '/') {
      return NextResponse.rewrite(new URL(dir + '/index.html' + search, request.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ['/programlar', '/blog'] };
