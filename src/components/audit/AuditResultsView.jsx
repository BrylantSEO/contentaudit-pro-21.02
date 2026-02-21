import React, { useState, useMemo } from "react";
import { Wrench, Search, LayoutList, BarChart3, ChevronDown, ChevronRight } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

const TABS = [
  { id: "fix", label: "Co poprawić", icon: Wrench, color: "#f97316" },
  { id: "missing", label: "Czego brakuje", icon: Search, color: "#a78bfa" },
  { id: "structure", label: "Idealna struktura", icon: LayoutList, color: "#38bdf8" },
  { id: "nerd", label: "Statystyki dla nerdów", icon: BarChart3, color: "#64748b" },
];

/**
 * Parse the audit markdown into user-friendly sections.
 * Looks for known section headers and checklist patterns.
 */
function parseAuditSections(md) {
  if (!md) return { fix: "", missing: "", structure: "", nerd: "" };

  const lines = md.split("\n");

  // Collect all BEFORE/AFTER blocks, concrete recommendations, and checklist
  const fixParts = [];
  const missingParts = [];
  const structureParts = [];
  const nerdParts = [];

  let currentH2 = "";
  let currentH3 = "";
  let buffer = [];
  let inSection = null; // track which bucket

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    const text = buffer.join("\n");
    if (inSection === "fix") fixParts.push(text);
    else if (inSection === "missing") missingParts.push(text);
    else if (inSection === "structure") structureParts.push(text);
    else if (inSection === "nerd") nerdParts.push(text);
    buffer = [];
  };

  // Classification rules based on section content
  const isFixSection = (h2, h3, line) => {
    const lower = (h2 + " " + h3 + " " + line).toLowerCase();
    return (
      lower.includes("before") || lower.includes("after") ||
      lower.includes("rekomendacj") || lower.includes("gotowy kod") ||
      lower.includes("checklist") || lower.includes("rec-") ||
      lower.includes("co poprawić") || lower.includes("zalecen") ||
      lower.includes("chunk") || lower.includes("rozbuduj") ||
      lower.includes("dodaj blok") || lower.includes("dodaj datę") ||
      lower.includes("dodaj źródła")
    );
  };

  const isMissingSection = (h2, h3, line) => {
    const lower = (h2 + " " + h3 + " " + line).toLowerCase();
    return (
      lower.includes("gap") || lower.includes("brakując") ||
      lower.includes("luki") || lower.includes("tf-idf") ||
      lower.includes("urr") || lower.includes("pokrycie") ||
      lower.includes("benchmark") || lower.includes("konkurencj") ||
      lower.includes("paa") || lower.includes("eav")
    );
  };

  const isStructureSection = (h2, h3, line) => {
    const lower = (h2 + " " + h3 + " " + line).toLowerCase();
    return (
      lower.includes("struktur") || lower.includes("outline") ||
      lower.includes("proponowana") || lower.includes("idealna") ||
      lower.includes("sugerowana") || lower.includes("draft")
    );
  };

  const isNerdSection = (h2, h3, line) => {
    const lower = (h2 + " " + h3 + " " + line).toLowerCase();
    return (
      lower.includes("srl") || lower.includes("salience") ||
      lower.includes("density") || lower.includes("information density") ||
      lower.includes("cqs formula") || lower.includes("cost of retrieval") ||
      lower.includes("csi") && lower.includes("alignment")
    );
  };

  // Simple state machine — parse line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isH2 = /^##\s+[^#]/.test(line);
    const isH3 = /^###\s+/.test(line);
    const isH4 = /^####\s+/.test(line);

    if (isH2) {
      flushBuffer();
      currentH2 = line;
      currentH3 = "";
      // Determine bucket for this H2
      if (isFixSection(currentH2, "", "")) inSection = "fix";
      else if (isMissingSection(currentH2, "", "")) inSection = "missing";
      else if (isStructureSection(currentH2, "", "")) inSection = "structure";
      else if (isNerdSection(currentH2, "", "")) inSection = "nerd";
      else inSection = "nerd"; // default: nerd
      buffer.push(line);
    } else if (isH3 || isH4) {
      flushBuffer();
      currentH3 = line;
      // Re-evaluate bucket at H3 level
      if (isFixSection(currentH2, currentH3, "")) inSection = "fix";
      else if (isMissingSection(currentH2, currentH3, "")) inSection = "missing";
      else if (isStructureSection(currentH2, currentH3, "")) inSection = "structure";
      else if (isNerdSection(currentH2, currentH3, "")) inSection = "nerd";
      buffer.push(line);
    } else {
      // Check if individual line has BEFORE/AFTER or checklist
      if (/BEFORE|AFTER/i.test(line) && inSection !== "fix") {
        flushBuffer();
        inSection = "fix";
      }
      if (/\[\s*\]\s*\*?\*?REC-/i.test(line) && inSection !== "fix") {
        flushBuffer();
        inSection = "fix";
      }
      buffer.push(line);
    }
  }
  flushBuffer();

  // If we couldn't parse anything meaningful into fix/missing, put the whole report in "fix"
  const fixContent = fixParts.join("\n\n").trim();
  const missingContent = missingParts.join("\n\n").trim();
  const structureContent = structureParts.join("\n\n").trim();
  const nerdContent = nerdParts.join("\n\n").trim();

  return {
    fix: fixContent,
    missing: missingContent,
    structure: structureContent,
    nerd: nerdContent,
  };
}

/**
 * Merge scores + benchmark markdown into "nerd" tab
 */
function buildNerdContent(auditNerd, scoresMd, benchmarkMd) {
  const parts = [];
  if (auditNerd) parts.push(auditNerd);
  if (scoresMd) parts.push("---\n\n## 📊 Szczegółowe wyniki (Scores)\n\n" + scoresMd);
  if (benchmarkMd) parts.push("---\n\n## 🔍 Benchmark SERP\n\n" + benchmarkMd);
  return parts.join("\n\n") || "_Brak danych statystycznych._";
}

function EmptyState({ icon: Icon, text, color }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <Icon style={{ width: 40, height: 40, color: color || "#334155", margin: "0 auto 16px" }} />
      <p style={{ color: "#475569", fontSize: "14px" }}>{text}</p>
    </div>
  );
}

export default function AuditResultsView({ auditMd, scoresMd, benchmarkMd }) {
  const [activeTab, setActiveTab] = useState("fix");

  const sections = useMemo(() => {
    const parsed = parseAuditSections(auditMd);
    return {
      ...parsed,
      nerd: buildNerdContent(parsed.nerd, scoresMd, benchmarkMd),
    };
  }, [auditMd, scoresMd, benchmarkMd]);

  // Count items per tab for badges
  const fixCount = (sections.fix.match(/\[\s*\]/g) || []).length;
  const missingCount = (sections.missing.match(/❌|GAP/gi) || []).length;

  const currentContent = sections[activeTab];

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: "flex",
        gap: "4px",
        marginBottom: "24px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "14px",
        padding: "4px",
        overflowX: "auto",
      }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tab.id === "fix" ? fixCount : tab.id === "missing" ? missingCount : 0;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                background: isActive ? `${tab.color}20` : "transparent",
                color: isActive ? tab.color : "#475569",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <Icon style={{ width: 15, height: 15 }} />
              {tab.label}
              {count > 0 && (
                <span style={{
                  background: isActive ? `${tab.color}30` : "rgba(255,255,255,0.06)",
                  borderRadius: "999px",
                  padding: "1px 7px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: isActive ? tab.color : "#64748b",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "20px",
        padding: "32px",
        minHeight: "400px",
      }}>
        {!currentContent || currentContent.trim() === "" ? (
          <EmptyState
            icon={TABS.find(t => t.id === activeTab)?.icon || BarChart3}
            text={
              activeTab === "fix" ? "Brak konkretnych rekomendacji w raporcie." :
              activeTab === "missing" ? "Brak analizy luk w raporcie." :
              activeTab === "structure" ? "Brak proponowanej struktury w raporcie." :
              "Brak danych statystycznych."
            }
            color={TABS.find(t => t.id === activeTab)?.color}
          />
        ) : (
          <MarkdownRenderer content={currentContent} />
        )}
      </div>
    </div>
  );
}