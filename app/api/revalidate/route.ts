import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

type Payload = { _type: string; slug?: string | null; previousSlug?: string | null };

// Sanity webhook (filter: _type == "post"; projection: {_type, "slug": slug.current}) yayın/güncelleme/silme sonrası çağırır.
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ message: 'secret tanimli degil' }, { status: 500 });

  const { isValidSignature, body } = await parseBody<Payload>(req, secret, true);
  if (!isValidSignature) return NextResponse.json({ message: 'gecersiz imza' }, { status: 401 });
  if (body?._type !== 'post') return NextResponse.json({ message: 'post degil, islem yok' }, { status: 200 });

  const paths = ['/blog-index', '/sitemap.xml'];
  if (body.slug) paths.push(`/blog-post/${body.slug}`);
  for (const p of paths) revalidatePath(p);
  return NextResponse.json({ revalidated: paths });
}
