import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
        // Personnaliser les composants pour un meilleur styling
        h1: ({ children }) => (
          <h1 className="text-lg font-bold text-gray-900 mb-2 mt-3 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold text-gray-800 mb-2 mt-2 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-gray-800 mb-1 mt-2 first:mt-0">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-xs leading-relaxed mb-2 last:mb-0">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-gray-800">
            {children}
          </em>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-4 mb-2 space-y-1">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-4 mb-2 space-y-1">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-xs leading-relaxed">
            {children}
          </li>
        ),
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-gray-800">
                {children}
              </code>
            );
          }
          return (
            <pre className="bg-gray-100 p-2 rounded-lg text-xs font-mono overflow-x-auto mb-2">
              <code className="text-gray-800">
                {children}
              </code>
            </pre>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-300 pl-3 py-1 bg-blue-50 rounded-r text-xs mb-2">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
