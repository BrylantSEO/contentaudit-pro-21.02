import React from "react";
import ReactMarkdown from "react-markdown";

/**
 * Pre-processes raw markdown to convert pipe-delimited tables
 * into HTML tables, since react-markdown without remark-gfm
 * doesn't handle GFM tables.
 */
function preprocessMarkdown(raw) {
  if (!raw) return "";

  const lines = raw.split("\n");
  const result = [];
  let i = 0;

  while (i < lines.length) {
    // Detect table: current line has pipes and next line is a separator (|---|---|)
    if (isTableRow(lines[i]) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      // Collect all table rows
      const tableLines = [];
      tableLines.push(lines[i]); // header
      i++; // skip separator
      i++; // move past separator
      while (i < lines.length && isTableRow(lines[i]) && !isSeparatorRow(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      // Convert to HTML table
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
  // Must start or end with pipe and have at least 3 pipe-separated cells
  if (!trimmed.startsWith("|") && !trimmed.endsWith("|")) return false;
  return trimmed.split("|").filter(c => c.trim() !== "").length >= 2;
}

function isSeparatorRow(line) {
  if (!line) return false;
  const trimmed = line.trim();
  // Match rows like |---|---|---| or |:---|:---:|---:|
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
    row.forEach((cell, ci) => {
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
  // Convert emoji checkmarks/crosses to colored badges
  let out = text;
  out = out.replace(/✅/g, '<span class="cell-pass">✓</span>');
  out = out.replace(/❌/g, '<span class="cell-fail">✗</span>');
  // Bold text
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return out;
}

const mdComponents = {
  h1: ({ children }) => (
    <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f8fafc", margin: "40px 0 14px", lineHeight: 1.3, letterSpacing: "-0.01em" }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <div style={{ margin: "36px 0 16px" }}>
      <h2 style={{
        fontSize: "17px", fontWeight: 700, color: "#c7d2fe",
        paddingBottom: "10px",
        borderBottom: "1px solid rgba(99,102,241,0.2)",
        lineHeight: 1.4,
        letterSpacing: "0.01em",
      }}>{children}</h2>
    </div>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#a5b4fc", margin: "24px 0 8px", lineHeight: 1.4 }}>{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#94a3b8", margin: "18px 0 6px" }}>{children}</h4>
  ),
  p: ({ children }) => (
    <p style={{ color: "#b0bec5", lineHeight: 1.8, margin: "12px 0", fontSize: "14px" }}>{children}</p>
  ),
  li: ({ children }) => (
    <li style={{ color: "#b0bec5", fontSize: "14px", lineHeight: 1.8, marginBottom: "4px" }}>{children}</li>
  ),
  ul: ({ children }) => <ul style={{ paddingLeft: "22px", margin: "10px 0", listStyleType: "disc" }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: "22px", margin: "10px 0" }}>{children}</ol>,
  strong: ({ children }) => <strong style={{ color: "#e2e8f0", fontWeight: 700 }}>{children}</strong>,
  em: ({ children }) => <em style={{ color: "#94a3b8", fontStyle: "italic" }}>{children}</em>,
  code: ({ node, inline, className, children, ...props }) => {
    const content = String(children).replace(/\n$/, "");
    const isBlock = className || content.includes("\n") || content.length > 120;
    
    // Inline code — render as small colored badge
    if (inline || !isBlock) {
      return (
        <code style={{
          background: "rgba(99,102,241,0.1)",
          border: "1px solid rgba(99,102,241,0.15)",
          borderRadius: "6px",
          padding: "2px 8px",
          fontSize: "13px",
          color: "#c7d2fe",
          fontFamily: "inherit",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}>{children}</code>
      );
    }
    // Block code inside <pre>
    return (
      <code style={{ color: "#c7d2fe", fontSize: "13px", fontFamily: "'JetBrains Mono', 'SF Mono', monospace", lineHeight: 1.7 }}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre style={{
      background: "rgba(15,15,30,0.6)",
      borderRadius: "12px",
      padding: "20px 24px",
      margin: "16px 0",
      overflowX: "auto",
      border: "1px solid rgba(99,102,241,0.12)",
      fontSize: "13px",
    }}>
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote style={{
      borderLeft: "3px solid #6366f1",
      paddingLeft: "18px",
      margin: "16px 0",
      color: "#b0bec5",
      background: "rgba(99,102,241,0.05)",
      padding: "14px 20px",
      borderRadius: "0 10px 10px 0",
    }}>{children}</blockquote>
  ),
  hr: () => <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: "32px 0" }} />,
  table: ({ children }) => (
    <div style={{ overflowX: "auto", margin: "20px 0", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
      <table style={{
        borderCollapse: "collapse",
        width: "100%",
        fontSize: "13px",
      }}>{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead style={{ background: "rgba(99,102,241,0.12)" }}>{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{children}</tr>
  ),
  th: ({ children }) => (
    <th style={{
      padding: "10px 14px",
      textAlign: "left",
      color: "#a5b4fc",
      fontWeight: 700,
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      whiteSpace: "nowrap",
    }}>{children}</th>
  ),
  td: ({ children }) => (
    <td style={{
      padding: "10px 14px",
      color: "#cbd5e1",
      fontSize: "13px",
      lineHeight: 1.5,
    }}>{children}</td>
  ),
};

export default function MarkdownRenderer({ content }) {
  if (!content) {
    return <p style={{ color: "#475569", fontStyle: "italic" }}>Brak danych.</p>;
  }

  const processed = preprocessMarkdown(content);

  // Check if there are HTML tables injected
  const hasHtmlTables = processed.includes('<table class="audit-table">');

  if (hasHtmlTables) {
    // Split by HTML tables and render mixed content
    const parts = processed.split(/(<table class="audit-table">[\s\S]*?<\/table>)/g);

    return (
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
            border: 1px solid rgba(255,255,255,0.1);
          }
          .audit-report-content .audit-table thead tr {
            background: rgba(99,102,241,0.12);
          }
          .audit-report-content .audit-table th {
            padding: 11px 14px;
            text-align: left;
            color: #a5b4fc;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            white-space: nowrap;
            border-bottom: 1px solid rgba(99,102,241,0.2);
          }
          .audit-report-content .audit-table td {
            padding: 10px 14px;
            color: #cbd5e1;
            font-size: 13px;
            line-height: 1.55;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            max-width: 320px;
            word-wrap: break-word;
          }
          .audit-report-content .audit-table tbody tr:hover {
            background: rgba(255,255,255,0.03);
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
            background: rgba(74,222,128,0.15);
            color: #4ade80;
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
            background: rgba(248,113,113,0.15);
            color: #f87171;
            font-weight: 700;
            font-size: 13px;
          }
          .audit-report-content .audit-table strong {
            color: #e2e8f0;
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
    );
  }

  return (
    <div className="audit-report-content">
      <ReactMarkdown components={mdComponents}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}