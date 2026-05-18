"use client";

import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Copy, Check } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

function MarkdownRendererImpl({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert prose-sm max-w-none break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !className;

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-muted/80 text-sm font-mono border border-border/40"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock language={match?.[1] || ""}>
                {String(children).replace(/\n$/, "")}
              </CodeBlock>
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
          p({ children }) {
            return <p className="mb-2.5 last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 mb-2.5 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 mb-2.5 space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 hover:underline transition-colors"
              >
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3 rounded-xl border border-border">
                <table className="border-collapse text-sm w-full">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-border px-3 py-2 bg-muted/60 text-left font-medium text-xs uppercase tracking-wider">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-border px-3 py-2">
                {children}
              </td>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-[3px] border-primary/40 pl-4 py-1 my-3 text-muted-foreground italic">
                {children}
              </blockquote>
            );
          },
          hr() {
            return <hr className="my-4 border-border/60" />;
          },
          h1({ children }) {
            return <h1 className="text-lg font-semibold mt-4 mb-2">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-base font-semibold mt-3 mb-2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-sm font-semibold mt-3 mb-1.5">{children}</h3>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ children, language }: { children: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            {language || "text"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-[13px] font-mono leading-relaxed">{children}</code>
      </pre>
    </div>
  );
}

/**
 * Memoize so that streaming chunks only re-parse markdown when the content
 * actually changes. Without this, every keypress in another part of the UI
 * (sidebar search, model picker open) re-parses the full markdown tree.
 */
export const MarkdownRenderer = memo(
  MarkdownRendererImpl,
  (prev, next) => prev.content === next.content
);
