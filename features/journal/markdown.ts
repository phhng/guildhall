// Tiny, safe markdown: headings, lists, **bold**, *italic*, [text](https://link).
// Output is a plain data tree that is rendered only as <Text> nodes, so raw HTML can never execute or render.
export type Inline = { t: 'text'; s: string; b?: boolean; i?: boolean } | { t: 'link'; s: string; url: string };
export type Block = { t: 'h'; level: 1 | 2 | 3; inl: Inline[] } | { t: 'li' | 'p'; inl: Inline[] };

// Only https links are allowed. javascript:, data:, http:, file: and every other scheme render as plain text.
export const safeUrl = (u: string) => (/^https:\/\/[^\s<>"'`]{1,2000}$/i.test(u) ? u : null);

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: 'text', s: s.slice(last, m.index) });
    if (m[1]) out.push({ t: 'text', s: m[1], b: true });
    else if (m[2]) out.push({ t: 'text', s: m[2], i: true });
    else { const url = safeUrl(m[4]); out.push(url ? { t: 'link', s: m[3], url } : { t: 'text', s: m[3] }); }
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: 'text', s: s.slice(last) });
  return out;
}

export function parseMarkdown(src: string): Block[] {
  return src.slice(0, 5000).split('\n').map((l) => l.trimEnd()).filter((l) => l.trim()).map((l): Block => {
    const h = /^(#{1,3})\s+(.*)$/.exec(l);
    if (h) return { t: 'h', level: h[1].length as 1 | 2 | 3, inl: parseInline(h[2]) };
    const li = /^\s*[-*]\s+(.*)$/.exec(l);
    if (li) return { t: 'li', inl: parseInline(li[1]) };
    return { t: 'p', inl: parseInline(l) };
  });
}
