import React from 'react';

interface MarkdownLiteProps {
  text: string;
}

/**
 * Dependency-free renderer for a small, safe markdown subset used by
 * LearningTopic.theory: "## " headings, "- "/"* " bullet lines, and plain
 * paragraphs separated by blank lines. No HTML injection — every token is
 * rendered as a React element, never via dangerouslySetInnerHTML.
 */
export const MarkdownLite: React.FC<MarkdownLiteProps> = ({ text }) => {
  if (!text) return null;

  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) return null;

        if (lines[0].startsWith('## ')) {
          const heading = lines[0].replace(/^##\s+/, '');
          const rest = lines.slice(1);
          const isList = rest.length > 0 && rest.every((l) => /^[-*]\s+/.test(l));
          return (
            <div key={i}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-700 mb-1.5">{heading}</h3>
              {isList ? (
                <ul className="space-y-1">
                  {rest.map((l, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-sm text-slate-700">
                      <span className="text-indigo-400 font-bold mt-0.5">•</span>
                      <span>{l.replace(/^[-*]\s+/, '')}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-1">
                  {rest.map((l, j) => (
                    <p key={j} className="text-sm text-slate-700">{l}</p>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (lines.every((l) => /^[-*]\s+/.test(l))) {
          return (
            <ul key={i} className="space-y-1">
              {lines.map((l, j) => (
                <li key={j} className="flex items-start gap-1.5 text-sm text-slate-700">
                  <span className="text-indigo-400 font-bold mt-0.5">•</span>
                  <span>{l.replace(/^[-*]\s+/, '')}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <div key={i} className="space-y-1">
            {lines.map((l, j) => (
              <p key={j} className="text-sm text-slate-700 leading-relaxed">{l}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default MarkdownLite;
