import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-custom-text-100 mb-2 mt-3 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-custom-text-100 mb-2 mt-3 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-custom-text-100 mb-1.5 mt-2 first:mt-0">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-custom-text-100 mb-1 mt-2 first:mt-0">{children}</h4>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="text-xs text-custom-text-200 mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-4 mb-2 last:mb-0 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-4 mb-2 last:mb-0 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-xs text-custom-text-200 leading-relaxed">{children}</li>
          ),

          // Inline code
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="px-1 py-0.5 rounded bg-custom-background-90 text-custom-primary-100 text-xs font-mono">
                  {children}
                </code>
              );
            }
            // Code block
            return (
              <code className={`block p-2 rounded bg-custom-background-90 text-xs font-mono overflow-x-auto ${className}`} {...props}>
                {children}
              </code>
            );
          },

          // Code blocks
          pre: ({ children }) => (
            <pre className="mb-2 last:mb-0 rounded bg-custom-background-90 overflow-hidden">
              {children}
            </pre>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-custom-primary-100/50 pl-3 my-2 italic text-custom-text-300">
              {children}
            </blockquote>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-custom-primary-100 hover:underline"
            >
              {children}
            </a>
          ),

          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-custom-text-100">{children}</strong>
          ),

          // Emphasis/Italic
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="my-3 border-custom-border-200" />
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full text-xs border border-custom-border-200 rounded">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-custom-background-80">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-custom-border-200">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr>{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-2 py-1.5 text-left font-semibold text-custom-text-100 border-b border-custom-border-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1.5 text-custom-text-200">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
