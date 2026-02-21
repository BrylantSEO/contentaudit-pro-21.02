import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Copy, Check, RotateCcw, FileDown } from "lucide-react";
import AuditResultsView from "./AuditResultsView";
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

// Tabs are now handled inside AuditResultsView

function isUrl(str) {
  return typeof str === "string" && (str.startsWith("http://") || str.startsWith("https://"));
}

function useFetchMarkdown(value) {
  const [content, setContent] = useState(isUrl(value) ? null : value);
  const [loading, setLoading] = useState(isUrl(value));

  React.useEffect(() => {
    if (!isUrl(value)) {
      setContent(value);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(value)
      .then(r => r.text())
      .then(text => { setContent(text); setLoading(false); })
      .catch(() => { setContent("_Nie udało się pobrać raportu._"); setLoading(false); });
  }, [value]);

  return { content, loading };
}

export default function AuditDone({ job }) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const auditMd = useFetchMarkdown(job.result_audit_md);
  const scoresMd = useFetchMarkdown(job.result_scores_md);
  const benchmarkMd = useFetchMarkdown(job.result_benchmark_md);

  const hasPdf = Array.isArray(job.modules) && job.modules.includes("pdf");
  const isLoading = auditMd.loading;

  const cqs = job.result_cqs ?? 0;
  const citability = job.result_citability ?? 0;
  const cqsColor = cqs > 70 ? "#4ade80" : cqs >= 40 ? "#fbbf24" : "#f87171";

  const copyReport = async () => {
    await navigator.clipboard.writeText(auditMd.content || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportMd = () => {
    const blob = new Blob([auditMd.content || ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = (job.url || "raport").replace(/https?:\/\//, "").replace(/[^a-z0-9]/gi, "_").slice(0, 40);
    a.download = `audit_${slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rerun = () => {
    navigate(createPageUrl("AuditNew") + `?prefill=${encodeURIComponent(JSON.stringify({
      url: job.url,
      keyword: job.keyword,
      model: job.model,
      modules: job.modules,
    }))}`);
  };

  return (
    <div style={{ background: "#0a0a0f", color: "#e2e8f0", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>

      {/* ─── Sticky header ────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(10,10,15,0.88)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
      }}>
        {/* CQS pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: `${cqsColor}15`,
          border: `1px solid ${cqsColor}40`,
          borderRadius: "999px",
          padding: "5px 14px",
          flexShrink: 0,
        }}>
          <span style={{ color: cqsColor, fontWeight: 800, fontSize: "18px" }}>{cqs}</span>
          <span style={{ color: "#64748b", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>CQS</span>
        </div>

        {/* URL */}
        <span style={{ color: "#64748b", fontSize: "13px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {job.url}
        </span>

        {/* Keyword */}
        {job.keyword && (
          <span style={{
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: "999px",
            padding: "3px 12px",
            fontSize: "12px",
            color: "#c7d2fe",
            fontWeight: 600,
            flexShrink: 0,
          }}>
            🔑 {job.keyword}
          </span>
        )}
      </div>

      {/* ─── Main content ─────────────────────────────────────────────────── */}
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

            {hasPdf && (
              <button onClick={exportMd} style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "rgba(234,179,8,0.1)",
                border: "1px solid rgba(234,179,8,0.3)",
                borderRadius: "12px", padding: "10px 18px",
                color: "#fbbf24", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}>
                <FileDown className="w-4 h-4" />
                Eksportuj PDF
              </button>
            )}

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

        {/* Results — reorganized by user value */}
        {isLoading ? (
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "20px",
            padding: "60px 32px",
            textAlign: "center",
            color: "#475569",
          }}>
            Ładowanie raportu...
          </div>
        ) : (
          <AuditResultsView
            auditMd={auditMd.content}
            scoresMd={scoresMd.content}
            benchmarkMd={benchmarkMd.content}
          />
        )}
      </div>
    </div>
  );
}