import { NextResponse, type NextRequest } from 'next/server';

// next.config redirects() ile /programlar -> /programlar/ sonsuz döngü yapar
// (skipTrailingSlashRedirect altında route regex'i slash'ı opsiyonel sayar); bu yüzden burada.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === '/programlar' || pathname === '/blog') {
    // nextUrl.clone() sondaki slash'ı siler.
    return NextResponse.redirect(new URL(pathname + '/' + search, request.url), 301);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/programlar', '/blog'] };
