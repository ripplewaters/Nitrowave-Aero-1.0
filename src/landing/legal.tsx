import { StrictMode, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/audiowide/index.css';
import '@fontsource/vt323/index.css';
import '@fontsource/orbitron/600.css';
import '@fontsource/orbitron/700.css';
import { SiteFooter, SiteHeader, WindowBar } from './SiteChrome';
import './landing.css';

// The legal pages render the same .txt files that ship in the installer, so there is one source
// of truth. The plain files stay downloadable from each page.
type DocId = 'license' | 'privacy' | 'notices';
const DOCS: Record<DocId, { file: string; window: string; title: string; chip: string; lede: string }> = {
  license: { file: 'LICENSE.txt', window: 'LICENSE.TXT', title: 'License', chip: 'MIT LICENSE', lede: 'Nitrowave Aero is open source under the MIT License. You may use, copy, modify and share it, as long as the notice stays with it.' },
  privacy: { file: 'PRIVACY.txt', window: 'PRIVACY.TXT', title: 'Privacy', chip: 'ZERO TRACKING', lede: 'Nitrowave collects nothing about you. Everything happens on your own computer.' },
  notices: { file: 'THIRD-PARTY-NOTICES.txt', window: 'NOTICES.TXT', title: 'Open source', chip: 'THANK YOU', lede: 'Nitrowave is built on open-source software. These are the projects inside it and their licences.' },
};

type Block =
  | { kind: 'heading'; text: string; id: string }
  | { kind: 'section'; num: string; text: string; id: string; body: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'meta'; text: string }
  | { kind: 'lead'; text: string }
  | { kind: 'para'; text: string };

const flat = (text: string) => text.replace(/\s*\n\s*/g, ' ').trim();
const sentence = (caps: string) => caps.charAt(0) + caps.slice(1).toLowerCase();
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Parses the plain-text documents: ALL-CAPS lines are headings, "1. TITLE. body" are numbered
// sections, "- " blocks are lists, everything else is a paragraph.
function parseDocument(text: string): { title: string; blocks: Block[] } {
  const [first, ...rest] = text.replace(/\r/g, '').trim().split(/\n\s*\n/);
  const blocks = rest.map((raw): Block => {
    const block = raw.trim();
    if (/^[A-Z][A-Z '&,-]+$/.test(block)) return { kind: 'heading', text: sentence(block), id: slug(block) };
    if (block.startsWith('- ')) return { kind: 'list', items: block.split(/\n- /).map((item) => flat(item.replace(/^- /, ''))) };
    const numbered = flat(block).match(/^(\d+)\.\s+([A-Z][A-Z ,'&-]+?)\.\s+(.*)$/);
    if (numbered) return { kind: 'section', num: numbered[1], text: sentence(numbered[2]), id: slug(numbered[2]), body: numbered[3] };
    if (/^(Last updated|Copyright)/.test(block)) return { kind: 'meta', text: flat(block) };
    if (/^Short version:/.test(block)) return { kind: 'lead', text: flat(block.replace(/^Short version:\s*/, '')) };
    return { kind: 'para', text: flat(block) };
  });
  return { title: first.trim(), blocks };
}

// Plain URLs in the documents become links (only http(s), opened safely in a new tab).
function linkify(text: string): ReactNode[] {
  return text.split(/(https?:\/\/[^\s)]+[^\s).,])/g).map((part, i) =>
    /^https?:\/\//.test(part) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part.replace(/^https?:\/\//, '')}</a> : part);
}

function Prose({ blocks }: { blocks: Block[] }) {
  return <div className="legal-prose">{blocks.map((block, i) => {
    if (block.kind === 'heading') return <h2 key={i} id={block.id}>{block.text}</h2>;
    if (block.kind === 'section') return <section key={i} id={block.id} className="legal-section">
      <h2><span className="legal-num">{block.num.padStart(2, '0')}</span>{block.text}</h2>
      <p>{linkify(block.body)}</p>
    </section>;
    if (block.kind === 'list') return <ul key={i}>{block.items.map((item, j) => <li key={j}>{linkify(item)}</li>)}</ul>;
    if (block.kind === 'meta') return <p key={i} className="legal-meta">{block.text}</p>;
    if (block.kind === 'lead') return <p key={i} className="legal-lead">{block.text}</p>;
    return <p key={i}>{linkify(block.text)}</p>;
  })}</div>;
}

type Group = { names: string[]; licence: string; body: string };

function parseNotices(text: string): { intro: Block[]; groups: Group[] } {
  const [head, ...parts] = text.replace(/\r/g, '').split(/\n==== LICENCE GROUP \d+ =+\n/);
  const groups = parts.map((part) => {
    const split = part.search(/\n---- TEXT -+\n/);
    const top = split < 0 ? part : part.slice(0, split);
    const body = split < 0 ? '' : part.slice(split).replace(/^\n---- TEXT -+\n/, '');
    const lines = top.split('\n');
    const licenceLine = lines.findIndex((line) => line.startsWith('Licence: '));
    return { names: lines.slice(0, licenceLine).filter(Boolean), licence: lines[licenceLine]?.slice(9) ?? '', body: body.trim() };
  });
  return { intro: parseDocument(head).blocks, groups };
}

function Notices({ text }: { text: string }) {
  const { intro, groups } = useMemo(() => parseNotices(text), [text]);
  const [query, setQuery] = useState('');
  const all = groups.flatMap((g) => g.names);
  const counts = new Map<string, number>();
  for (const g of groups) for (const name of g.names) counts.set(g.licence, (counts.get(g.licence) ?? 0) + (name ? 1 : 0));
  const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const q = query.trim().toLowerCase();
  const shown = q ? groups.filter((g) => g.licence.toLowerCase().includes(q) || g.names.some((n) => n.toLowerCase().includes(q))) : groups;
  return <>
    <div className="notice-stats">
      <div className="lcd"><b>{all.filter((n) => n.endsWith('(crate)')).length}</b><span>RUST CRATES</span></div>
      <div className="lcd"><b>{all.filter((n) => n.endsWith('(npm)')).length}</b><span>JS + FONTS</span></div>
      <div className="lcd"><b>{groups.filter((g) => /GPL/i.test(g.licence)).reduce((n, g) => n + g.names.length, 0)}</b><span>GPL COMPONENTS</span></div>
    </div>
    <Prose blocks={intro.filter((b) => !(b.kind === 'para' && b.text.startsWith('Components:')))} />
    <div className="licence-chips" aria-label="Most common licences">{top.map(([licence, n]) => <button type="button" key={licence} onClick={() => setQuery(licence)}>{licence} <b>{n}</b></button>)}</div>
    <label className="notice-search"><span>SEARCH</span><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Component or licence, e.g. tauri or MIT" maxLength={80} /></label>
    <p className="notice-count">{shown.length} of {groups.length} licence texts</p>
    <div className="notice-groups">{shown.map((group, i) => <details key={i} className="notice-group">
      <summary>
        <span className="licence-badge">{group.licence}</span>
        <span className="notice-names">{group.names.slice(0, 5).map((n) => n.replace(/ \((crate|npm)\)$/, '')).join(' · ')}{group.names.length > 5 ? ` · +${group.names.length - 5} more` : ''}</span>
      </summary>
      <ul className="notice-list">{group.names.map((n, j) => <li key={j}>{n}</li>)}</ul>
      <pre>{group.body}</pre>
    </details>)}</div>
  </>;
}

function Legal({ doc }: { doc: DocId }) {
  const meta = DOCS[doc];
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch(`./downloads/${meta.file}`).then((r) => { if (!r.ok) throw new Error(); return r.text(); }).then(setText).catch(() => setFailed(true));
  }, [meta.file]);
  const parsed = useMemo(() => (text && doc !== 'notices' ? parseDocument(text) : null), [text, doc]);
  const toc = parsed?.blocks.filter((b): b is Extract<Block, { id: string }> => b.kind === 'heading' || b.kind === 'section') ?? [];
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <SiteHeader home="./" />
    <main id="main" className="legal-page">
      <div className="starfield" aria-hidden="true" />
      <div className="legal-hero">
        <p className="pixel-chip"><span className="blink-dot" /> LEGAL ▸ {meta.chip}</p>
        <h1><span className="chrome-text">{meta.title}</span></h1>
        <p>{meta.lede}</p>
        <nav className="legal-tabs" aria-label="Legal documents">{(Object.keys(DOCS) as DocId[]).map((id) =>
          <a key={id} href={`./${id}.html`} aria-current={id === doc ? 'page' : undefined}>{DOCS[id].title}</a>)}</nav>
      </div>
      <div className={`legal-layout${toc.length ? '' : ' no-toc'}`}>
        {toc.length > 0 && <aside className="legal-toc" aria-label="On this page"><p>ON THIS PAGE</p>{toc.map((b) =>
          <a key={b.id} href={`#${b.id}`}>{b.kind === 'section' && <span>{b.num.padStart(2, '0')}</span>}{b.text}</a>)}</aside>}
        <article className="legal-window">
          <WindowBar title={meta.window} tone={doc === 'privacy' ? 'pink' : 'blue'} />
          <div className="legal-body">
            {failed && <p className="legal-meta">This document could not be loaded. <a href={`./downloads/${meta.file}`}>Open the plain text file</a>.</p>}
            {!text && !failed && <p className="legal-meta">Loading…</p>}
            {parsed && <><p className="legal-doc-title">{parsed.title}</p><Prose blocks={parsed.blocks} /></>}
            {text && doc === 'notices' && <Notices text={text} />}
            <p className="legal-download"><a href={`./downloads/${meta.file}`} download>Download {meta.file} ↓</a></p>
          </div>
        </article>
      </div>
    </main>
    <SiteFooter home="./" />
  </>;
}

const root = document.getElementById('root')!;
createRoot(root).render(<StrictMode><Legal doc={(root.dataset.doc as DocId) ?? 'license'} /></StrictMode>);
