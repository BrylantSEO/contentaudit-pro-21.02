import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { Copy, Check, RotateCcw } from "lucide-react";
import { format } from "date-fns";

function ScoreBadge({ label, value, max }) {
  const pct = max === 100 ? value : (value / max) * 100;
  const color = pct > 70 ? "#4ade80" : pct >= 40 ? "#fbbf24" : "#f87171";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "48px", fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {value}
        <span style={{ fontSize: "20px", color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>/{max}</span>
      </div>
      <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "6px" }}>
        {label}
      </div>
    </div>
  );
}

const TABS = ["📋 Raport", "📊 Scores", "🔍 Benchmark"];

const mdComponents = {
  table: ({ children }) => (
    <div style={{ overflowX: "auto", margin: "16px 0" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "13px" }}>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead style={{ background: "rgba(255,255,255,0.06)" }}>{children}</thead>,
  th: ({ children }) => (
    <th style={{ padding: "10px 14px", textAlign: "left", color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" }}>{children}</th>
  ),
  td: ({ children }) => (
    <td style={{ padding: "9px 14px", color: "#cbd5e1", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{children}</td>
  ),
  h1: ({ children }) => <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f8fafc", margin: "28px 0 12px" }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#e2e8f0", margin: "22px 0 10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#cbd5e1", margin: "16px 0 8px" }}>{children}</h3>,
  p: ({ children }) => <p style={{ color: "#94a3b8", lineHeight: 1.7, margin: "8px 0", fontSize: "14px" }}>{children}</p>,
  li: ({ children }) => <li style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.7 }}>{children}</li>,
  ul: ({ children }) => <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: "20px", margin: "8px 0" }}>{children}</ol>,
  strong: ({ children }) => <strong style={{ color: "#e2e8f0", fontWeight: 700 }}>{children}</strong>,
  code: ({ children }) => <code style={{ background: "rgba(255,255,255,0.08)", borderRadius: "4px", padding: "2px 6px", fontSize: "12px", color: "#c7d2fe" }}>{children}</code>,
  blockquote: ({ children }) => (
    <blockquote style={{ borderLeft: "3px solid #6366f1", paddingLeft: "16px", margin: "12px 0", color: "#64748b" }}>{children}</blockquote>
  ),
};

export default function AuditDone({ job }) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const hasBenchmark = !!job.result_benchmark_md;
  const visibleTabs = hasBenchmark ? TABS : TABS.slice(0, 2);

  const copyReport = async () => {
    await navigator.clipboard.writeText(job.result_audit_md || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rerun = async () => {
    navigate(createPageUrl("AuditNew") + `?prefill=${encodeURIComponent(JSON.stringify({
      url: job.url,
      keyword: job.keyword,
      model: job.model,
      modules: job.modules,
    }))}`);
  };

  const cqs = job.result_cqs ?? 0;
  const citability = job.result_citability ?? 0;
  const cqsColor = cqs > 70 ? "#4ade80" : cqs >= 40 ? "#fbbf24" : "#f87171";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Banner */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${cqsColor}30`,
        borderRadius: "24px",
        padding: "32px",
        marginBottom: "32px",
        boxShadow: `0 0 40px ${cqsColor}10`,
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "40px", alignItems: "center", marginBottom: "24px" }}>
          <ScoreBadge label="CQS Score" value={cqs} max={100} />
          <div style={{ width: "1px", height: "60px", background: "rgba(255,255,255,0.08)" }} />
          <ScoreBadge label="AI Citability" value={citability} max={10} />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "4px" }}>
          <div>
            <span style={{ color: "#475569", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>URL</span>
            <p style={{ color: "#94a3b8", fontSize: "13px", wordBreak: "break-all", marginTop: "2px" }}>{job.url}</p>
          </div>
          {job.keyword && (
            <div>
              <span style={{ color: "#475569", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>Fraza</span>
              <p style={{ color: "#6366f1", fontSize: "13px", marginTop: "2px" }}>{job.keyword}</p>
            </div>
          )}
          <div>
            <span style={{ color: "#475569", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>Model</span>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "2px" }}>{job.model}</p>
          </div>
          {job.completed_at && (
            <div>
              <span style={{ color: "#475569", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>Data</span>
              <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "2px" }}>
                {format(new Date(job.completed_at), "dd.MM.yyyy HH:mm")}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap" }}>
          <button onClick={copyReport} style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: copied ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: "12px", padding: "10px 18px",
            color: copied ? "#4ade80" : "#94a3b8", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s",
          }}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Skopiowano!" : "Kopiuj raport"}
          </button>
          <button onClick={rerun} style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: "12px", padding: "10px 18px",
            color: "#c7d2fe", fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}>
            <RotateCcw className="w-4 h-4" />
            Uruchom ponownie
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "rgba(255,255,255,0.03)", borderRadius: "14px", padding: "4px", width: "fit-content" }}>
        {visibleTabs.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            padding: "8px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
            border: "none", cursor: "pointer", transition: "all 0.15s",
            background: activeTab === i ? "rgba(99,102,241,0.2)" : "transparent",
            color: activeTab === i ? "#c7d2fe" : "#475569",
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "20px",
        padding: "32px",
        minHeight: "400px",
      }}>
        {activeTab === 0 && (
          <ReactMarkdown components={mdComponents}>{job.result_audit_md || "_Brak raportu._"}</ReactMarkdown>
        )}
        {activeTab === 1 && (
          <ReactMarkdown components={mdComponents}>{job.result_scores_md || "_Brak scores._"}</ReactMarkdown>
        )}
        {activeTab === 2 && hasBenchmark && (
          <ReactMarkdown components={mdComponents}>{job.result_benchmark_md}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}