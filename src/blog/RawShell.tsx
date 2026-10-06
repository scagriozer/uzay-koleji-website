import type { ReactNode } from 'react';

type Piece = { kind: 'style' | 'script' | 'html'; content: string };

// Mevcut sayfalardan çıkarılan ham kabuğu üst düzey style/script/html parçalarına böler.
export function splitShell(html: string): Piece[] {
  const pieces: Piece[] = [];
  const re = /<(style|script)(?:\s[^>]*)?>([\s\S]*?)<\/\1>|<!--[\s\S]*?-->/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const pushHtml = (s: string) => {
    if (s.trim()) pieces.push({ kind: 'html', content: s });
  };
  while ((m = re.exec(html))) {
    pushHtml(html.slice(last, m.index));
    if (m[1]) {
      const srcMatch = m[0].match(/^<script\s+src="([^"]+)"/);
      if (srcMatch) pieces.push({ kind: 'html', content: m[0] });
      else pieces.push({ kind: m[1] as 'style' | 'script', content: m[2] });
    }
    last = re.lastIndex;
  }
  pushHtml(html.slice(last));
  return pieces;
}

export function RawShell({ html }: { html: string }): ReactNode {
  return splitShell(html).map((p, i) => {
    if (p.kind === 'style') return <style key={i} dangerouslySetInnerHTML={{ __html: p.content }} />;
    if (p.kind === 'script') return <script key={i} dangerouslySetInnerHTML={{ __html: p.content }} />;
    const srcMatch = p.content.match(/^<script\s+src="([^"]+)"\s+defer><\/script>$/);
    if (srcMatch) return <script key={i} src={srcMatch[1]} defer />;
    return <div key={i} style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: p.content }} />;
  });
}
