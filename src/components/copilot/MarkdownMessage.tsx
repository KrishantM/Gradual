/**
 * Renders a G.ai assistant reply as Markdown.
 *
 * The model emits GitHub-flavoured Markdown (headings, bold, lists, links,
 * code). This component renders it with the Gradual design system — all colours
 * come from CSS variables, never hardcoded dark-mode classes. Used by both the
 * Copilot page and the Paths G.ai pane so formatting is identical everywhere.
 *
 * Safe by construction: react-markdown does not use dangerouslySetInnerHTML and
 * raw HTML in the source is ignored (no rehype-raw), so model output cannot
 * inject markup.
 */

'use client';

import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const COMPONENTS: Components = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0 leading-relaxed">{children}</p>,
  h1: ({ children }) => <h1 className="mt-4 mb-2 first:mt-0 text-base font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-4 mb-2 first:mt-0 text-[15px] font-semibold">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 mb-1.5 first:mt-0 text-sm font-semibold">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-3 mb-1.5 first:mt-0 text-sm font-semibold">{children}</h4>,
  ul: ({ children }) => <ul className="my-2 ml-1 space-y-1 list-disc list-inside marker:text-[var(--text-subtle)]">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 ml-1 space-y-1 list-decimal list-inside marker:text-[var(--text-subtle)]">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed [&>ul]:mt-1 [&>ol]:mt-1 [&>ul]:ml-4 [&>ol]:ml-4">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-[var(--foreground)]">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--accent-blue)] underline underline-offset-2 hover:text-[var(--accent-blue-strong)]"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = (className ?? '').includes('language-');
    if (isBlock) {
      return (
        <code className="block my-2 overflow-x-auto rounded-lg border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-3 text-[12px] font-mono leading-relaxed">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-[var(--surface-subtle)] px-1 py-0.5 text-[0.85em] font-mono">{children}</code>
    );
  },
  pre: ({ children }) => <pre className="my-2">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-[var(--border)] pl-3 text-[var(--text-muted)]">{children}</blockquote>
  ),
  hr: () => <hr className="my-3 border-[var(--border-soft)]" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-[var(--border-soft)] px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border border-[var(--border-soft)] px-2 py-1">{children}</td>,
};

export function MarkdownMessage({ content, className }: { content: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
