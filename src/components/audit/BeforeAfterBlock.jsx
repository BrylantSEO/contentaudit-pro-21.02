import React from "react";
import ReactMarkdown from "react-markdown";

/**
 * Parses howToFix text containing BEFORE/AFTER patterns and renders them
 * as styled blocks. Falls back to markdown rendering for other content.
 */
export default function BeforeAfterBlock({ content }) {
  if (!content) return null;

  const lines = content.split("\n");
  const blocks = [];
  let currentType = null; // "before" | "after" | "other"
  let currentLines = [];

  const flush = () => {
    if (currentLines.length === 0) return;
    const text = currentLines.join("\n").trim();
    if (text) {
      blocks.push({ type: currentType || "other", text });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const stripped = line.replace(/^>\s*/, "").trim();

    // Detect BEFORE: / AFTER: markers
    const beforeMatch = stripped.match(/^\*?\*?BEFORE:?\*?\*?\s*(.*)/i);
    const afterMatch = stripped.match(/^\*?\*?AFTER:?\*?\*?\s*(.*)/i);

    if (beforeMatch) {
      flush();
      currentType = "before";
      if (beforeMatch[1].trim()) currentLines.push(beforeMatch[1].trim());
    } else if (afterMatch) {
      flush();
      currentType = "after";
      if (afterMatch[1].trim()) currentLines.push(afterMatch[1].trim());
    } else if (stripped === "---" || stripped === "") {
      // skip separators and empty lines between blocks
      if (currentLines.length > 0) currentLines.push("");
    } else {
      if (!currentType) currentType = "other";
      // Clean up leading > or * formatting
      const cleaned = line.replace(/^>\s*/, "").replace(/^\*\s*/, "");
      currentLines.push(cleaned);
    }
  }
  flush();

  if (blocks.length === 0) {
    return (
      <div className="text-xs text-muted-foreground whitespace-pre-line">
        {content}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        if (block.type === "before") {
          return (
            <div key={i} className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Before</span>
              </div>
              <div className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="my-0.5">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    code: ({ children }) => <code className="bg-red-100 dark:bg-red-900/40 px-1 py-0.5 rounded text-[11px]">{children}</code>,
                  }}
                >
                  {block.text}
                </ReactMarkdown>
              </div>
            </div>
          );
        }

        if (block.type === "after") {
          return (
            <div key={i} className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">After</span>
              </div>
              <div className="text-xs text-green-800 dark:text-green-300 leading-relaxed">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="my-0.5">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    code: ({ children }) => <code className="bg-green-100 dark:bg-green-900/40 px-1 py-0.5 rounded text-[11px]">{children}</code>,
                  }}
                >
                  {block.text}
                </ReactMarkdown>
              </div>
            </div>
          );
        }

        // "other" — general instruction
        return (
          <div key={i} className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="text-xs text-muted-foreground leading-relaxed">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="my-0.5">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-[11px]">{children}</code>,
                }}
              >
                {block.text}
              </ReactMarkdown>
            </div>
          </div>
        );
      })}
    </div>
  );
}