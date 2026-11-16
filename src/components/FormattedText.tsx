'use client';

import React from 'react';

/**
 * Renders AI text safely and readably:
 *  - `code` -> inline code
 *  - **bold** -> emphasis
 *  - blank lines -> paragraphs, single newlines -> line breaks
 *  - stray LaTeX ($\rightarrow$, $O(n)$, \log) is cleaned up
 * Everything is rendered as React text nodes (no HTML injection).
 */

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\$\s*\\rightarrow\s*\$|\\rightarrow/g, '→')
    .replace(/ -> /g, ' → ') // only spaced arrows, so C++ `node->next` stays intact
    .replace(/\$\s*\\leftarrow\s*\$|\\leftarrow/g, '←')
    .replace(/\$([^$\n]{1,40})\$/g, '$1')
    .replace(/\\log/g, 'log')
    .replace(/\\le(q)?\b/g, '≤')
    .replace(/\\ge(q)?\b/g, '≥')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×');
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(`[^`\n]+`|\*\*[^*\n]+\*\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    nodes.push(
      token.startsWith('`') ? (
        <code key={`${keyPrefix}-${i++}`} className="inline-code break-words">
          {token.slice(1, -1)}
        </code>
      ) : (
        <strong key={`${keyPrefix}-${i++}`} className="font-semibold text-fg">
          {token.slice(2, -2)}
        </strong>
      )
    );
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderLines(text: string, keyPrefix: string) {
  return text.split('\n').map((line, li) => (
    <React.Fragment key={li}>
      {li > 0 && <br />}
      {renderInline(line, `${keyPrefix}${li}`)}
    </React.Fragment>
  ));
}

export default function FormattedText({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null;
  const paragraphs = normalize(text).split(/\n{2,}/).filter((p) => p.trim());

  if (paragraphs.length <= 1) {
    return <span className={className}>{renderLines(paragraphs[0] || '', 'l')}</span>;
  }
  return (
    <div className={`space-y-2 ${className}`}>
      {paragraphs.map((p, pi) => (
        <p key={pi}>{renderLines(p, `p${pi}-`)}</p>
      ))}
    </div>
  );
}
