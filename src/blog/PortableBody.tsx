import { stegaClean } from 'next-sanity';
import { Fragment, type ReactNode } from 'react';

type Span = { _type: 'span'; _key: string; text: string; marks?: string[] };
type MarkDef = { _key: string; _type: string; href?: string; id?: string };
type Block = {
  _type: 'block';
  _key: string;
  style?: string;
  listItem?: 'bullet' | 'number';
  markDefs?: MarkDef[];
  children: Span[];
};
type Table = { _type: 'table'; _key: string; rows: { _key: string; cells: string[] }[] };
type CtaBox = { _type: 'ctaBox'; _key: string; title: string; text: string; buttons: { _key: string; label: string; href: string }[] };
type FaqItem = { _key: string; question: string; answer: Block[]; onPage?: boolean; inJsonLd?: boolean; jsonLdAnswer?: string };
type FaqList = { _type: 'faqList'; _key: string; items: FaqItem[] };
export type BodyBlock = Block | Table | CtaBox | FaqList;

export function anchorId(b: Block): string | undefined {
  const def = b.markDefs?.find((d) => d._type === 'anchor');
  return def?.id ? stegaClean(def.id) : undefined;
}

export function blockText(b: Block): string {
  return b.children.map((c) => c.text).join('');
}

export function inlineNodes(b: Block): ReactNode[] {
  const defs = new Map((b.markDefs ?? []).map((d) => [d._key, d]));
  return b.children.map((span) => {
    let node: ReactNode = span.text;
    for (const mark of span.marks ?? []) {
      if (mark === 'strong') node = <strong>{node}</strong>;
      else if (mark === 'em') node = <em>{node}</em>;
      else {
        const def = defs.get(mark);
        if (def?._type === 'link') node = <a href={stegaClean(def.href ?? '')}>{node}</a>;
      }
    }
    return <Fragment key={span._key}>{node}</Fragment>;
  });
}

export function PortableBody({ blocks }: { blocks: BodyBlock[] }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b._type === 'block' && b.listItem) {
      const kind = b.listItem;
      const items: Block[] = [];
      while (i < blocks.length) {
        const n = blocks[i];
        if (n._type === 'block' && n.listItem === kind) items.push(n);
        else break;
        i++;
      }
      i--;
      const Tag = kind === 'bullet' ? 'ul' : 'ol';
      out.push(
        <Tag key={items[0]._key}>
          {items.map((li) => (
            <li key={li._key}>{inlineNodes(li)}</li>
          ))}
        </Tag>,
      );
    } else if (b._type === 'block') {
      if (b.style === 'h2') out.push(<h2 key={b._key} id={anchorId(b)}>{inlineNodes(b)}</h2>);
      else if (b.style === 'h3') out.push(<h3 key={b._key}>{inlineNodes(b)}</h3>);
      else out.push(<p key={b._key}>{inlineNodes(b)}</p>);
    } else if (b._type === 'table') {
      const [head, ...rows] = b.rows;
      out.push(
        <div className="table-wrap" key={b._key}>
          <table>
            <thead>
              <tr>{head.cells.map((c, ci) => <th key={ci}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._key}>{r.cells.map((c, ci) => <td key={ci}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    } else if (b._type === 'ctaBox') {
      out.push(
        <div className="cta-box" key={b._key}>
          <h3>{b.title}</h3>
          <p>{b.text}</p>
          {b.buttons.map((btn, bi) => (
            <Fragment key={btn._key}>
              {bi > 0 && ' '}
              <a href={stegaClean(btn.href)}>{btn.label}</a>
            </Fragment>
          ))}
        </div>,
      );
    } else if (b._type === 'faqList') {
      for (const item of b.items.filter((x) => x.onPage !== false)) {
        out.push(<h3 key={`${item._key}-q`}>{item.question}</h3>);
        for (const a of item.answer) out.push(<p key={a._key}>{inlineNodes(a)}</p>);
      }
    }
  }
  return <>{out}</>;
}
