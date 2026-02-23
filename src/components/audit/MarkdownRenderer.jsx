import React, { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const SEO_GLOSSARY = {
  "H1": "Główny tytuł strony — jak tytuł artykułu w gazecie. Powinien być jeden na stronę.",
  "H2": "Podtytuł strony — dzieli treść na główne sekcje, jak rozdziały w książce.",
  "H3": "Nagłówek trzeciego poziomu — podsekcja wewnątrz H2.",
  "meta description": "Krótki opis strony (do 160 znaków) widoczny w wynikach Google pod tytułem.",
  "meta title": "Tytuł strony wyświetlany w karcie przeglądarki i w wynikach Google.",
  "canonical": "Adres URL, który Google powinien traktować jako główny — zapobiega duplikacji.",
  "alt text": "Opis obrazka dla wyszukiwarek i osób niewidomych — pomaga w Google Images.",
  "anchor text": "Tekst klikalnego linku — powinien opisywać, dokąd prowadzi.",
  "internal link": "Link prowadzący do innej strony w tej samej witrynie.",
  "external link": "Link prowadzący do innej witryny.",
  "schema": "Kod (JSON-LD), który pomaga Google zrozumieć treść strony (np. FAQ, produkt).",
  "structured data": "Dane strukturalne — dodatkowe informacje dla Google w formacie JSON-LD.",
  "E-E-A-T": "Experience, Expertise, Authoritativeness, Trust — kryteria jakości treści wg Google.",
  "SERP": "Search Engine Results Page — strona wyników wyszukiwania Google.",
  "CTR": "Click-Through Rate — procent osób, które kliknęły w wynik wyszukiwania.",
  "CQS": "Content Quality Score — ocena jakości treści strony (0-100).",
  "TF-IDF": "Miara istotności słów — jak ważne jest dane słowo w kontekście dokumentu.",
  "NAP": "Name, Address, Phone — dane firmy ważne dla lokalnego SEO.",
  "noindex": "Dyrektywa mówiąca Google, żeby nie pokazywał strony w wynikach wyszukiwania.",
  "robots.txt": "Plik informujący wyszukiwarki, które strony mogą odwiedzać.",
  "sitemap": "Mapa witryny — plik XML z listą stron do zaindeksowania przez Google.",
};

// Build a regex to match glossary terms (case-insensitive, word boundaries)
const glossaryTerms = Object.keys(SEO_GLOSSARY).sort((a, b) => b.length - a.length);
const glossaryRegex = new RegExp(
  `\\b(${glossaryTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "gi"
);

function addTooltipsToText(text) {
  if (typeof text !== "string") return text;

  const parts = [];
  let lastIndex = 0;
  let match;

  // Reset regex
  glossaryRegex.lastIndex = 0;

  while ((match = glossaryRegex.exec(text)) !== null) {
    const term = match[0];
    const matchedKey = glossaryTerms.find(t => t.toLowerCase() === term.toLowerCase());
    if (!matchedKey) continue;

    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    parts.push(
      <Tooltip key={match.index}>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted decoration-indigo-400/50 underline-offset-2 cursor-help">
            {term}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs leading-relaxed">
          {SEO_GLOSSARY[matchedKey]}
        </TooltipContent>
      </Tooltip>
    );

    lastIndex = match.index + term.length;
  }

  if (lastIndex === 0) return text;
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function processChildrenWithTooltips(children) {
  if (typeof children === "string") return addTooltipsToText(children);
  if (Array.isArray(children)) return children.map((child, i) => {
    if (typeof child === "string") return <React.Fragment key={i}>{addTooltipsToText(child)}</React.Fragment>;
    return child;
  });
  return children;
}

/**
 * Pre-processes raw markdown to convert pipe-delimited tables
 * into HTML tables, since react-markdown without remark-gfm
 * doesn't handle GFM tables.
 */
function preprocessMarkdown(raw) {
  if (!raw) return "";

  let cleaned = raw.replace(/\\\|/g, "|");
  const lines = cleaned.split("\n");
  const result = [];
  let i = 0;

  while (i < lines.length) {
    if (isTableRow(lines[i]) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      const tableLines = [];
      tableLines.push(lines[i]);
      i++;
      i++;
      while (i < lines.length && isTableRow(lines[i]) && !isSeparatorRow(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      result.push(buildHtmlTable(tableLines));
    } else {
      result.push(lines[i]);
      i++;
    }
  }

  return result.join("\n");
}

function isTableRow(line) {
  if (!line) return false;
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") && !trimmed.endsWith("|")) return false;
  return trimmed.split("|").filter(c => c.trim() !== "").length >= 2;
}

function isSeparatorRow(line) {
  if (!line) return false;
  const trimmed = line.trim();
  return /^\|?[\s\-:]+(\|[\s\-:]+)+\|?$/.test(trimmed);
}

function parseCells(line) {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((c) => c.trim());
}

function buildHtmlTable(lines) {
  if (lines.length === 0) return "";
  const header = parseCells(lines[0]);
  const rows = lines.slice(1).map(parseCells);

  let html = '\n<table class="audit-table">\n<thead><tr>';
  header.forEach((h) => {
    html += `<th>${escapeHtml(h)}</th>`;
  });
  html += "</tr></thead>\n<tbody>\n";
  rows.forEach((row) => {
    html += "<tr>";
    row.forEach((cell) => {
      html += `<td>${formatCell(escapeHtml(cell))}</td>`;
    });
    html += "</tr>\n";
  });
  html += "</tbody></table>\n";
  return html;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCell(text) {
  let out = text;
  out = out.replace(/✅/g, '<span class="cell-pass">✓</span>');
  out = out.replace(/❌/g, '<span class="cell-fail">✗</span>');
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return out;
}

const mdComponents = {
  h1: ({ children }) => (
    <h1 className="text-xl font-extrabold text-foreground mt-10 mb-3.5 leading-snug tracking-tight">
      {processChildrenWithTooltips(children)}
    </h1>
  ),
  h2: ({ children }) => (
    <div className="mt-9 mb-4">
      <h2 className="text-[17px] font-bold text-foreground pb-2.5 border-b border-border leading-normal tracking-wide">
        {processChildrenWithTooltips(children)}
      </h2>
    </div>
  ),
  h3: ({ children }) => (
    <h3 className="text-[15px] font-semibold text-foreground/80 mt-6 mb-2 leading-normal">
      {processChildrenWithTooltips(children)}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-muted-foreground mt-4 mb-1.5">
      {processChildrenWithTooltips(children)}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-muted-foreground leading-7 my-3 text-sm">
      {processChildrenWithTooltips(children)}
    </p>
  ),
  li: ({ children }) => {
    const textContent = extractText(children);
    const uncheckedMatch = textContent.match(/^\[\s*\]\s*/);
    const checkedMatch = textContent.match(/^\[\s*[xX]\s*\]\s*/);

    if (uncheckedMatch || checkedMatch) {
      return <ChecklistItem checked={!!checkedMatch}>{children}</ChecklistItem>;
    }

    return (
      <li className="text-muted-foreground text-sm leading-7 mb-1">
        {processChildrenWithTooltips(children)}
      </li>
    );
  },
  ul: ({ children }) => <ul className="pl-5 my-2.5 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="pl-5 my-2.5">{children}</ol>,
  strong: ({ children }) => <strong className="text-foreground font-bold">{children}</strong>,
  em: ({ children }) => <em className="text-muted-foreground italic">{children}</em>,
  code: ({ inline, className, children }) => {
    const content = String(children).replace(/\n$/, "");
    const isBlock = className || content.includes("\n") || content.length > 120;

    if (inline || !isBlock) {
      return (
        <code className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/30 rounded-md px-2 py-0.5 text-[13px] text-indigo-700 dark:text-indigo-300 font-medium whitespace-nowrap">
          {children}
        </code>
      );
    }
    return (
      <code className="text-indigo-700 dark:text-indigo-300 text-[13px] font-mono leading-relaxed">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-muted/60 rounded-xl p-5 my-4 overflow-x-auto border border-border text-[13px]">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-[3px] border-indigo-500 pl-4 my-4 text-muted-foreground bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 rounded-r-xl">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-none border-t border-border my-8" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-5 rounded-xl border border-border">
      <table className="border-collapse w-full text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/60">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-border">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3.5 py-2.5 text-left text-foreground font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3.5 py-2.5 text-muted-foreground text-[13px] leading-normal">
      {children}
    </td>
  ),
};

function extractText(children) {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children?.props?.children) return extractText(children.props.children);
  return "";
}

function stripCheckboxPrefix(children) {
  if (!children) return children;

  const processNode = (node) => {
    if (typeof node === "string") {
      return node.replace(/^\[\s*[xX]?\s*\]\s*/, "");
    }
    return node;
  };

  if (Array.isArray(children)) {
    const result = [...children];
    for (let i = 0; i < result.length; i++) {
      const processed = processNode(result[i]);
      if (processed !== result[i]) {
        result[i] = processed;
        return result;
      }
      if (result[i]?.props?.children) {
        const inner = result[i].props.children;
        if (typeof inner === "string") {
          const stripped = inner.replace(/^\[\s*[xX]?\s*\]\s*/, "");
          if (stripped !== inner) {
            result[i] = React.cloneElement(result[i], {}, stripped);
            return result;
          }
        }
        if (Array.isArray(inner)) {
          const newInner = stripCheckboxPrefix(inner);
          if (newInner !== inner) {
            result[i] = React.cloneElement(result[i], {}, ...newInner);
            return result;
          }
        }
      }
    }
    return result;
  }

  return processNode(children);
}

function ChecklistItem({ checked: initialChecked, children }) {
  const [checked, setChecked] = useState(initialChecked);

  const toggle = useCallback(() => setChecked(prev => !prev), []);
  const strippedChildren = stripCheckboxPrefix(children);

  return (
    <li
      onClick={toggle}
      className={`text-sm leading-7 mb-1.5 list-none flex items-start gap-2.5 cursor-pointer transition-all select-none ${
        checked ? "text-muted-foreground line-through opacity-60" : "text-muted-foreground"
      }`}
    >
      <span className={`inline-flex items-center justify-center w-5 h-5 min-w-[20px] rounded-md mt-0.5 text-xs font-bold transition-all ${
        checked
          ? "bg-green-100 dark:bg-green-900/30 text-green-600"
          : "border-2 border-indigo-300 dark:border-indigo-600 bg-transparent text-transparent"
      }`}>
        {checked ? "✓" : ""}
      </span>
      <span className="flex-1">{strippedChildren}</span>
    </li>
  );
}

export default function MarkdownRenderer({ content }) {
  if (!content) {
    return <p className="text-muted-foreground italic">Brak danych.</p>;
  }

  const processed = preprocessMarkdown(content);
  const hasHtmlTables = processed.includes('<table class="audit-table">');

  if (hasHtmlTables) {
    const parts = processed.split(/(<table class="audit-table">[\s\S]*?<\/table>)/g);

    return (
      <TooltipProvider delayDuration={200}>
        <div className="audit-report-content">
          <style>{`
            .audit-report-content .audit-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              font-size: 13px;
              margin: 20px 0;
              border-radius: 12px;
              overflow: hidden;
              border: 1px solid hsl(var(--border));
            }
            .audit-report-content .audit-table thead tr {
              background: hsl(var(--muted));
            }
            .audit-report-content .audit-table th {
              padding: 11px 14px;
              text-align: left;
              color: hsl(var(--foreground));
              font-weight: 700;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              white-space: nowrap;
              border-bottom: 1px solid hsl(var(--border));
            }
            .audit-report-content .audit-table td {
              padding: 10px 14px;
              color: hsl(var(--muted-foreground));
              font-size: 13px;
              line-height: 1.55;
              border-bottom: 1px solid hsl(var(--border));
              max-width: 320px;
              word-wrap: break-word;
            }
            .audit-report-content .audit-table tbody tr:hover {
              background: hsl(var(--muted) / 0.5);
            }
            .audit-report-content .audit-table tbody tr:last-child td {
              border-bottom: none;
            }
            .audit-report-content .cell-pass {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 22px;
              height: 22px;
              border-radius: 6px;
              background: rgba(34,197,94,0.15);
              color: #22c55e;
              font-weight: 700;
              font-size: 13px;
            }
            .audit-report-content .cell-fail {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 22px;
              height: 22px;
              border-radius: 6px;
              background: rgba(239,68,68,0.15);
              color: #ef4444;
              font-weight: 700;
              font-size: 13px;
            }
            .audit-report-content .audit-table strong {
              color: hsl(var(--foreground));
              font-weight: 700;
            }
          `}</style>
          {parts.map((part, i) => {
            if (part.startsWith('<table class="audit-table">')) {
              return <div key={i} dangerouslySetInnerHTML={{ __html: part }} />;
            }
            if (!part.trim()) return null;
            return (
              <ReactMarkdown key={i} components={mdComponents}>
                {part}
              </ReactMarkdown>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="audit-report-content">
        <ReactMarkdown components={mdComponents}>
          {processed}
        </ReactMarkdown>
      </div>
    </TooltipProvider>
  );
}
