import React, { useState, useMemo } from "react";
import { LayoutDashboard, CheckSquare, LayoutList, FileText } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import MarkdownRenderer from "./MarkdownRenderer";
import AuditDashboard from "./AuditDashboard";
import AuditChecklist from "./AuditChecklist";
import AuditStructureView from "./AuditStructureView";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "#6366f1" },
  { id: "checklist", label: "Checklista", icon: CheckSquare, color: "#f97316" },
  { id: "structure", label: "Struktura", icon: LayoutList, color: "#38bdf8" },
  { id: "details", label: "Pełny raport", icon: FileText, color: "#64748b" },
];

// Priority classification based on recommendation type
const PRIORITY_RULES = {
  critical: [
    /\b(H1|title|tytuł)\b/i,
    /\bbrak\b.*\b(H1|title|tytuł)/i,
    /\bcritical\b/i,
    /\bkrytyczn/i,
    /\bindexing\b/i,
    /\bcanonical\b/i,
    /\b404\b/,
    /\bnoindex\b/i,
  ],
  important: [
    /\b(meta desc|description|opis)\b/i,
    /\b(H2|H3|heading|nagłów)\b/i,
    /\balt\s*text/i,
    /\b(link|anchor|odnośnik)\b/i,
    /\bschema\b/i,
    /\bstructured data\b/i,
    /\binternal link/i,
  ],
  // everything else is optional
};

function classifyPriority(text) {
  const lower = text.toLowerCase();
  for (const [priority, patterns] of Object.entries(PRIORITY_RULES)) {
    for (const pattern of patterns) {
      if (pattern.test(lower)) return priority;
    }
  }
  return "optional";
}

// User-friendly descriptions for common SEO recommendations
const WHY_MAP = {
  "H1": "Główny tytuł strony informuje Google o temacie — brak H1 to jak książka bez tytułu.",
  "title": "Tag title to pierwszy tekst widoczny w Google — bezpośrednio wpływa na klikalność.",
  "meta desc": "Opis w wynikach Google — dobry opis zwiększa CTR o 5-10%.",
  "alt text": "Opisy obrazków pomagają Google zrozumieć ich treść i wpływają na ruch z Google Images.",
  "canonical": "Wskazuje Google, którą wersję strony traktować jako główną — chroni przed duplikacją.",
  "schema": "Dane strukturalne zwiększają szansę na rozszerzone wyniki w Google (gwiazdki, FAQ, etc.).",
  "internal link": "Linki wewnętrzne pomagają Google odkryć i ocenić ważność podstron.",
  "heading": "Dobrze zorganizowane nagłówki ułatwiają czytanie i pomagają AI zrozumieć strukturę.",
};

function getWhyForItem(text) {
  const lower = text.toLowerCase();
  for (const [key, why] of Object.entries(WHY_MAP)) {
    if (lower.includes(key.toLowerCase())) return why;
  }
  return null;
}

/**
 * Parse the audit markdown into sections and extract priorities + checklist items.
 */
function parseAuditSections(md) {
  if (!md) return { fix: "", missing: "", structure: "", nerd: "", priorities: [], checklistItems: [] };

  const lines = md.split("\n");
  const fixParts = [];
  const missingParts = [];
  const structureParts = [];
  const nerdParts = [];
  const priorities = [];
  const checklistItems = [];

  let currentH2 = "";
  let currentH3 = "";
  let buffer = [];
  let inSection = null;
  let itemIdCounter = 0;

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    const text = buffer.join("\n");
    if (inSection === "fix") fixParts.push(text);
    else if (inSection === "missing") missingParts.push(text);
    else if (inSection === "structure") structureParts.push(text);
    else if (inSection === "nerd") nerdParts.push(text);
    buffer = [];
  };

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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isH2 = /^##\s+[^#]/.test(line);
    const isH3 = /^###\s+/.test(line);
    const isH4 = /^####\s+/.test(line);

    // Extract REC-* items for priorities
    const recMatch = line.match(/\*?\*?REC-\d+[^:]*:\s*(.+)/i);
    if (recMatch) {
      const title = recMatch[1].replace(/\*\*/g, "").trim();
      const priority = classifyPriority(title);
      const why = getWhyForItem(title);

      // Look ahead for BEFORE/AFTER or instructions
      let howToFix = "";
      let j = i + 1;
      while (j < lines.length && !lines[j].match(/^\s*\*?\*?REC-/i) && !lines[j].match(/^##/)) {
        if (/BEFORE|AFTER|ZMIEŃ|Krok|→/i.test(lines[j])) {
          howToFix += lines[j] + "\n";
        }
        j++;
      }

      priorities.push({
        id: `priority-${itemIdCounter}`,
        title,
        priority,
        why: why || "Poprawa tego elementu zwiększy widoczność Twojej strony w wynikach wyszukiwania.",
        howToFix: howToFix.trim() || null,
      });
    }

    // Extract checklist items [ ] or [x]
    const checklistMatch = line.match(/^\s*[-*]?\s*\[\s*([xX]?)\s*\]\s*\*?\*?(.*)/);
    if (checklistMatch) {
      const title = checklistMatch[2].replace(/\*\*/g, "").trim();
      if (title.length > 3) {
        const priority = classifyPriority(title);
        const why = getWhyForItem(title);
        checklistItems.push({
          id: `check-${itemIdCounter}`,
          title,
          priority,
          why: why || null,
          howToFix: null,
          initiallyChecked: !!checklistMatch[1],
        });
        itemIdCounter++;
      }
    }

    if (isH2) {
      flushBuffer();
      currentH2 = line;
      currentH3 = "";
      if (isFixSection(currentH2, "", "")) inSection = "fix";
      else if (isMissingSection(currentH2, "", "")) inSection = "missing";
      else if (isStructureSection(currentH2, "", "")) inSection = "structure";
      else if (isNerdSection(currentH2, "", "")) inSection = "nerd";
      else inSection = "nerd";
      buffer.push(line);
    } else if (isH3 || isH4) {
      flushBuffer();
      currentH3 = line;
      if (isFixSection(currentH2, currentH3, "")) inSection = "fix";
      else if (isMissingSection(currentH2, currentH3, "")) inSection = "missing";
      else if (isStructureSection(currentH2, currentH3, "")) inSection = "structure";
      else if (isNerdSection(currentH2, currentH3, "")) inSection = "nerd";
      buffer.push(line);
    } else {
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

    itemIdCounter++;
  }
  flushBuffer();

  // If no checklist items found from markdown, create them from priorities
  if (checklistItems.length === 0 && priorities.length > 0) {
    priorities.forEach((p, idx) => {
      checklistItems.push({
        id: `check-from-priority-${idx}`,
        title: p.title,
        priority: p.priority,
        why: p.why,
        howToFix: p.howToFix,
        initiallyChecked: false,
      });
    });
  }

  // Sort priorities: critical first, then important, then optional
  const priorityOrder = { critical: 0, important: 1, optional: 2 };
  priorities.sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));
  checklistItems.sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));

  return {
    fix: fixParts.join("\n\n").trim(),
    missing: missingParts.join("\n\n").trim(),
    structure: structureParts.join("\n\n").trim(),
    nerd: nerdParts.join("\n\n").trim(),
    priorities,
    checklistItems,
  };
}

/**
 * Extract radar chart data from markdown scores/content
 */
function extractRadarData(auditMd, scoresMd) {
  const categories = [
    { key: "content", label: "Treść", patterns: [/content\s*quality|jakość treści|cqs|content score/i, /treść|content/i] },
    { key: "structure", label: "Struktura", patterns: [/structure|struktur|heading|nagłów|outline/i] },
    { key: "keywords", label: "Słowa kluczowe", patterns: [/keyword|słow.*klucz|tf-idf|pokrycie|coverage/i] },
    { key: "links", label: "Linki", patterns: [/link|odnośnik|anchor|internal/i] },
    { key: "technical", label: "Techniczne", patterns: [/technical|technicz|schema|canonical|meta/i] },
  ];

  const combined = `${auditMd || ""}\n${scoresMd || ""}`;

  // Try to extract scores from markdown tables or score mentions
  return categories.map(cat => {
    let score = 50; // default

    // Look for percentage or score patterns near category keywords
    for (const pattern of cat.patterns) {
      const regex = new RegExp(`${pattern.source}[^\\n]*?(\\d{1,3})\\s*[%/]`, "i");
      const match = combined.match(regex);
      if (match) {
        const val = parseInt(match[1]);
        if (val >= 0 && val <= 100) {
          score = val;
          break;
        }
      }
    }

    // If we have ✅ and ❌ counts, estimate score
    if (score === 50) {
      let pass = 0, fail = 0;
      const lines = combined.split("\n");
      for (const line of lines) {
        const lower = line.toLowerCase();
        let relevant = false;
        for (const p of cat.patterns) {
          if (p.test(lower)) { relevant = true; break; }
        }
        if (relevant) {
          pass += (line.match(/✅|✓|OK/g) || []).length;
          fail += (line.match(/❌|✗|ZMIENIĆ|BRAK/gi) || []).length;
        }
      }
      if (pass + fail > 0) {
        score = Math.round((pass / (pass + fail)) * 100);
      }
    }

    return { category: cat.label, score };
  });
}

function buildNerdContent(auditNerd, scoresMd, benchmarkMd) {
  const parts = [];
  if (auditNerd) parts.push(auditNerd);
  if (scoresMd) parts.push("---\n\n## Szczegółowe wyniki (Scores)\n\n" + scoresMd);
  if (benchmarkMd) parts.push("---\n\n## Benchmark SERP\n\n" + benchmarkMd);
  return parts.join("\n\n") || "_Brak danych statystycznych._";
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="text-center py-16">
      <Icon className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export default function AuditResultsView({ auditMd, scoresMd, benchmarkMd, cqs = 0, citability = 0, jobId = "" }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const parsed = useMemo(() => {
    const result = parseAuditSections(auditMd);
    return {
      ...result,
      nerd: buildNerdContent(result.nerd, scoresMd, benchmarkMd),
    };
  }, [auditMd, scoresMd, benchmarkMd]);

  const radarData = useMemo(() => extractRadarData(auditMd, scoresMd), [auditMd, scoresMd]);

  // Detail sections for the "full report" tab
  const detailSections = useMemo(() => {
    const sections = [];
    if (parsed.fix) sections.push({ id: "fix", label: "Co poprawić", content: parsed.fix });
    if (parsed.missing) sections.push({ id: "missing", label: "Czego brakuje", content: parsed.missing });
    if (parsed.nerd) sections.push({ id: "nerd", label: "Statystyki i dane", content: parsed.nerd });
    return sections;
  }, [parsed]);

  const checklistCount = parsed.checklistItems.length;
  const priorityCount = parsed.priorities.length;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-muted/50 rounded-xl p-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tab.id === "checklist" ? checklistCount : tab.id === "dashboard" ? priorityCount : 0;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-semibold border-none cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 text-[11px] font-bold ${
                  isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {activeTab === "dashboard" && (
          <AuditDashboard
            cqs={cqs}
            citability={citability}
            priorities={parsed.priorities}
            radarData={radarData}
          />
        )}

        {activeTab === "checklist" && (
          <AuditChecklist
            checklistItems={parsed.checklistItems}
            jobId={jobId}
          />
        )}

        {activeTab === "structure" && (
          <AuditStructureView structureMd={parsed.structure} />
        )}

        {activeTab === "details" && (
          <div>
            {detailSections.length === 0 ? (
              <EmptyState icon={FileText} text="Brak danych raportu." />
            ) : (
              <Accordion type="multiple" defaultValue={[detailSections[0]?.id]}>
                {detailSections.map(section => (
                  <AccordionItem key={section.id} value={section.id} className="border rounded-lg mb-3 overflow-hidden">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline">
                      <span className="text-sm font-semibold text-foreground">{section.label}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5">
                      <MarkdownRenderer content={section.content} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
