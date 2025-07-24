"use client";
import React, { useEffect, useRef } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { SyntaxHighlighterProps } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Copy, Check, ExternalLink, Quote } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Mermaid component for rendering diagrams (No changes needed here)
const MermaidDiagram: React.FC<{ code: string }> = ({ code }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  useEffect(() => {
    const loadMermaid = async () => {
      try {
        const mermaid = await import("mermaid");
        mermaid.default.initialize({
          startOnLoad: true,
          theme: "dark",
          themeVariables: {
            darkMode: true,
            primaryColor: "#10b981",
            primaryTextColor: "#f4f4f5",
            primaryBorderColor: "#374151",
            lineColor: "#6b7280",
            secondaryColor: "#1f2937",
            tertiaryColor: "#111827",
            background: "#0f172a",
            mainBkg: "#1f2937",
            secondBkg: "#374151",
            tertiaryBkg: "#4b5563",
          },
        });

        if (mermaidRef.current) {
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          // Ensure the container is clean before rendering
          mermaidRef.current.innerHTML = `<div class="mermaid" id="${id}">${code}</div>`;
          await mermaid.default.init(undefined, mermaidRef.current);
          setIsLoaded(true);
        }
      } catch (error) {
        console.log("Failed to load Mermaid:", error);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `<div class="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400">
            <div>Failed to render Mermaid diagram</div>
          </div>`;
        }
      }
    };

    loadMermaid();
  }, [code]);

  return (
    <div className="my-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800 overflow-x-auto">
      <div ref={mermaidRef} className="flex justify-center">
        {!isLoaded && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-400 border-t-transparent"></div>
            <span className="ml-2 text-zinc-400">Loading diagram...</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Copy button component for code blocks (No changes needed here)
const CopyButton: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-2 bg-zinc-800 hover:bg-zinc-700
                   rounded-md border border-zinc-700 transition-all duration-200
                   group hover:scale-105"
      title="Copy code"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-400" />
      ) : (
        <Copy className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200" />
      )}
    </button>
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  const components: Components = {
    // No changes needed for code blocks
    code({ node, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const code = String(children).replace(/\n$/, "");

      if (match && match[1] === "mermaid") {
        return <MermaidDiagram code={code} />;
      }

      if (match) {
        return (
          <div className="relative group my-4">
            <div className="absolute top-0 left-0 right-0 h-12 bg-zinc-800 rounded-t-lg border-b border-zinc-700 flex items-center justify-between px-4">
              <span className="text-sm font-mono text-zinc-300 font-medium">
                {match[1]}
              </span>
              <CopyButton code={code} />
            </div>
            <div className="overflow-x-auto">
              <SyntaxHighlighter
                style={oneDark as any}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderRadius: "0 0 0.5rem 0.5rem",
                  paddingTop: "3rem",
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  fontSize: "0.9rem",
                  minWidth: "100%",
                }}
                {...(props as SyntaxHighlighterProps)}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      }
      return (
        <code
          className="px-2 py-1 bg-zinc-900 text-emerald-400 rounded font-mono text-sm border border-zinc-800 mx-1 break-words"
          {...props}
        >
          {children}
        </code>
      );
    },

    // FIX: Correctly read alignment from node?.properties for all headings
    h1: ({ node, children }) => {
      const align = node?.properties.align || "left";
      const alignClass =
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left";
      return (
        <h1
          className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-zinc-100 border-b border-zinc-800 pb-4 mt-8 first:mt-0 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text ${alignClass}`}
        >
          {children}
        </h1>
      );
    },
    h2: ({ node, children }) => {
      const align = node?.properties.align || "left";
      const alignClass =
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left";
      return (
        <h2
          className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-zinc-100 mt-10 first:mt-0 relative pl-4 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1 before:h-8 before:bg-emerald-500 before:rounded-full ${alignClass}`}
        >
          {children}
        </h2>
      );
    },
    h3: ({ node, children }) => {
      const align = node?.properties.align || "left";
      const alignClass =
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left";
      return (
        <h3
          className={`text-xl sm:text-2xl lg:text-3xl font-semibold mb-3 text-zinc-200 mt-8 first:mt-0 ${alignClass}`}
        >
          {children}
        </h3>
      );
    },
    h4: ({ node, children }) => {
      const align = node?.properties.align || "left";
      const alignClass =
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left";
      return (
        <h4
          className={`text-lg sm:text-xl lg:text-2xl font-semibold mb-2 text-zinc-200 mt-6 first:mt-0 ${alignClass}`}
        >
          {children}
        </h4>
      );
    },
    h5: ({ node, children }) => {
      const align = node?.properties.align || "left";
      const alignClass =
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left";
      return (
        <h5
          className={`text-base sm:text-lg lg:text-xl font-semibold mb-2 text-zinc-300 mt-4 first:mt-0 ${alignClass}`}
        >
          {children}
        </h5>
      );
    },
    h6: ({ node, children }) => {
      const align = node?.properties.align || "left";
      const alignClass =
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left";
      return (
        <h6
          className={`text-sm sm:text-base lg:text-lg font-semibold mb-2 text-zinc-300 mt-4 first:mt-0 ${alignClass}`}
        >
          {children}
        </h6>
      );
    },

    // FIX: Prevent wrapping block-level elements (like images) in a <div> tag
    p: ({ node, children }) => {
      // Check if the paragraph contains an image or other block-level elements.
      // `rehype-raw` creates nodes with `tagName` properties.
      const hasBlockElement = node?.children.some(
        (child: any) => child.tagName === "img" || child.tagName === "div",
      );

      const align = node?.properties.align || "left";
      const alignClass =
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left";

      // If it contains a block element, render a <div> instead of a <div>
      // to maintain alignment and spacing without invalid HTML.
      if (hasBlockElement) {
        return (
          <div className={`mb-4 first:mt-0 ${alignClass}`}>{children}</div>
        );
      }

      // Otherwise, render a normal <div> tag.
      return (
        <div
          className={`mb-4 text-zinc-300 leading-relaxed text-base sm:text-lg first:mt-0 ${alignClass}`}
        >
          {children}
        </div>
      );
    },

    ul: ({ children }) => (
      <ul className="list-none mb-6 text-zinc-300 flex flex-col gap-2">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-none mb-6 text-zinc-300 flex flex-col gap-2 counter-reset-custom">
        {children}
      </ol>
    ),

    // FIX: Use the `ordered` prop to distinguish between <ol> and <ul> list items
    li: ({ children }) => {
      const ordered = false;
      return (
        <li
          className={`flex items-start ${
            ordered ? "counter-increment-custom" : ""
          }`}
        >
          <span
            className={`flex-shrink-0 w-6 h-6 rounded-full mr-3 mt-0.5 flex items-center justify-center text-sm font-medium
              ${
                ordered
                  ? "bg-emerald-500 text-black before:content-[counter(custom-counter)]"
                  : "bg-zinc-700 text-emerald-400"
              }`}
          >
            {!ordered && "•"}
          </span>
          <span className="flex-1 break-words">{children}</span>
        </li>
      );
    },

    a: ({ href, children }) => (
      <a
        href={href}
        className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200
                   underline decoration-emerald-400/50 hover:decoration-emerald-300
                   inline-flex items-center gap-1 group break-words"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </a>
    ),

    // FIX: Read alignment from node?.properties for the wrapper div
    img: ({ node, src, alt }) => {
      const align = node?.properties.align || "left";
      const alignClass =
        align === "center"
          ? "mx-auto"
          : align === "right"
            ? "ml-auto"
            : "mr-auto";
      const wrapperAlignClass =
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left";

      // The wrapping div is kept because it provides consistent styling (margin, etc.)
      return (
        <div className={`my-6 ${wrapperAlignClass}`}>
          <img
            src={src}
            alt={alt}
            className={`max-w-full h-auto rounded-lg shadow-lg border border-zinc-800 ${alignClass}`}
            loading="lazy"
          />
        </div>
      );
    },

    // No changes needed for the remaining components
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-emerald-500 pl-4 sm:pl-6 py-2 my-6 bg-zinc-900/50 rounded-r-lg italic text-zinc-300 relative">
        <Quote className="absolute top-2 left-2 h-5 w-5 text-emerald-500 opacity-50" />
        <div className="ml-4 break-words">{children}</div>
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-6 rounded-lg border border-zinc-800 shadow-lg">
        <table className="min-w-full bg-zinc-900">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-zinc-800 border-b border-zinc-700">{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-zinc-800">{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-zinc-800/50 transition-colors duration-200">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-3 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-zinc-100 uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-zinc-300 break-words">
        {children}
      </td>
    ),
    hr: () => (
      <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-zinc-100">{children}</strong>
    ),
    em: ({ children }) => <em className="italic text-zinc-200">{children}</em>,
    del: ({ children }) => (
      <del className="line-through text-zinc-500">{children}</del>
    ),
    div: ({ node, children }) => {
      const align = node?.properties.align || "left";
      const alignClass =
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left";
      return <div className={`${alignClass} break-words`}>{children}</div>;
    },
    span: ({ children, ...props }) => (
      <span className="break-words" {...props}>
        {children}
      </span>
    ),
  };

  return (
    <div
      className={`prose prose-lg max-w-none w-full overflow-hidden ${className}`}
      suppressHydrationWarning
    >
      <style jsx global>{`
        .counter-reset-custom {
          counter-reset: custom-counter;
        }
        .counter-increment-custom {
          counter-increment: custom-counter;
        }
        .counter-increment-custom::before {
          content: counter(custom-counter);
        }
        @media (max-width: 640px) {
          .prose {
            font-size: 14px;
          }
        }
        pre {
          overflow-x: auto;
          max-width: 100%;
        }
        .prose a {
          word-break: break-word;
        }
        @media (max-width: 768px) {
          .prose table {
            font-size: 12px;
          }
        }
      `}</style>
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
