import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { client } from '../../../../src/sanity/client';
import { sanityFetch } from '../../../../src/sanity/live';
import { anchorId, inlineNodes, PortableBody } from '../../../../src/blog/PortableBody';
import { ldScript, postJsonLd } from '../../../../src/blog/jsonld';
import { POST_QUERY, POST_SLUGS_QUERY } from '../../../../src/blog/queries';
import { burslulukHideCss, postCss } from '../../../../src/blog/shell';
import type { PostFull } from '../../../../src/blog/types';
import { FOOTER_NOTE, formatDate, SITE } from '../../../../src/blog/util';

type Params = { slug: string };

export async function generateStaticParams() {
  const slugs = (await client.fetch(POST_SLUGS_QUERY, {}, { stega: false, useCdn: false })) as string[];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await sanityFetch({ query: POST_QUERY, params: { slug }, stega: false });
  const post = data as PostFull | null;
  if (!post) return {};
  const url = `${SITE}/blog/${post.slug}.html`;
  const seoTitle = post.seoTitle || post.title;
  const ogTitle = post.ogTitle || seoTitle;
  const ogDescription = post.ogDescription || post.seoDescription;
  return {
    title: { absolute: `${seoTitle} | Uzay Koleji` },
    description: post.seoDescription,
    alternates: { canonical: url },
    openGraph: { type: 'article', title: ogTitle, description: ogDescription, locale: 'tr_TR' },
  };
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const { data } = await sanityFetch({ query: POST_QUERY, params: { slug } });
  const post = data as PostFull | null;
  if (!post) notFound();

  const body = post.body;
  const h2s = body.flatMap((b) => (b._type === 'block' && b.style === 'h2' ? [b] : []));
  const ld = postJsonLd(post);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: postCss }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(ld) }} />
      <main className="container">
        <article>
          <header className="article-header">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <a href="../index.html">Ana Sayfa</a> › <a href="index.html">Blog</a> › <span>{post.breadcrumbName || post.title}</span>
            </nav>
            <span className="article-tag">{post.tag}</span>
            <h1>{post.title}</h1>
            <div className="article-meta">
              <span>{formatDate(post.publishedAt)}</span>
              <span>{post.readingMinutes} dk okuma</span>
              <span>Uzay Koleji Editör Ekibi</span>
            </div>
            <div className="tldr">
              <strong>Özet</strong>
              <p>{post.tldr}</p>
            </div>
          </header>
          <div className="article-layout">
            <nav className="toc" aria-label="İçindekiler">
              <h3>İçindekiler</h3>
              <ol>
                {h2s.map((h) => (
                  <li key={h._key}>
                    <a href={`#${anchorId(h)}`}>{inlineNodes(h)}</a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="article-body">
              <PortableBody blocks={body} />
              <footer className="article-footer">
                <p><strong>Yazar:</strong> Uzay Koleji Editör Ekibi</p>
                <p>Yayın tarihi: {formatDate(post.publishedAt)} · Son güncelleme: {formatDate(post.updatedAt || post.publishedAt)}</p>
                <p style={{ marginTop: '1rem' }}>{post.footerNote || FOOTER_NOTE}</p>
                <p style={{ marginTop: '1rem' }}><a href="#" data-cookie-prefs>Çerez Tercihleri</a></p>
              </footer>
            </div>
          </div>
        </article>
      </main>
      <style dangerouslySetInnerHTML={{ __html: burslulukHideCss }} />
    </>
  );
}
