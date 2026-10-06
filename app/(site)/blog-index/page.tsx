import type { Metadata } from 'next';
import { sanityFetch } from '../../../src/sanity/live';
import { blogJsonLd, ldScript } from '../../../src/blog/jsonld';
import { POST_LIST_QUERY } from '../../../src/blog/queries';
import { indexCss } from '../../../src/blog/shell';
import type { PostListItem } from '../../../src/blog/types';
import { formatDate, SITE } from '../../../src/blog/util';

export const metadata: Metadata = {
  title: { absolute: 'Uzay Koleji Blog | Adana Mesleki Lise Rehberi' },
  description:
    "Uzay Koleji blog: Adana'da mesleki lise, devlet destekli özel eğitim, LGS sonrası tercih ve mesleki kariyer rehberleri. Veliler ve öğrenciler için güncel içerik.",
  alternates: { canonical: `${SITE}/blog/` },
};

export default async function BlogIndex() {
  const { data } = await sanityFetch({ query: POST_LIST_QUERY });
  const posts = data as PostListItem[];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: indexCss }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(blogJsonLd) }} />
      <main className="container">
        <a href="../index.html" className="back-link">← Ana sayfaya dön</a>
        <header className="blog-hero">
          <div className="blog-hero__eyebrow">Uzay Koleji Blog</div>
          <h1>Adana&apos;da Mesleki Lise Rehberi</h1>
          <p>Devlet destekli özel mesleki eğitim, LGS sonrası tercih, kariyer rehberleri ve veliler için güncel içerik. Uzay Koleji editör ekibi tarafından hazırlanır.</p>
        </header>
        <section className="blog-grid">
          {posts.map((p) => (
            <a key={p._id} href={`${p.slug}.html`} className="blog-card">
              <span className="blog-card__tag">{p.tag}</span>
              <h2 className="blog-card__title">{p.title}</h2>
              <p className="blog-card__excerpt">{p.excerpt}</p>
              <div className="blog-card__meta">
                <span>{formatDate(p.publishedAt)} · {p.readingMinutes} dk okuma</span>
                <span className="blog-card__cta">Okumaya başla →</span>
              </div>
            </a>
          ))}
        </section>
      </main>
    </>
  );
}
