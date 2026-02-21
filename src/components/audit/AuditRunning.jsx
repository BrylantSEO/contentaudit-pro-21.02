import React from "react";

const STEPS = [
  { id: "crawl", label: "Crawl artykułu", modes: ["full", "content-only", "quick"] },
  { id: "serp", label: "Analiza SERP", modes: ["full"] },
  { id: "knowledge", label: "Knowledge Graph", modes: ["full"] },
  { id: "benchmark", label: "Benchmark", modes: ["full"] },
  { id: "structure", label: "Analiza struktury", modes: ["full", "content-only", "quick"] },
  { id: "scoring", label: "Scoring AI", modes: ["full", "content-only", "quick"] },
  { id: "report", label: "Generowanie raportu", modes: ["full", "content-only", "quick"] },
];

const STEP_KEYWORDS = {
  crawl: ["crawl", "pobieranie", "fetch"],
  serp: ["serp"],
  knowledge: ["knowledge", "graph"],
  benchmark: ["benchmark"],
  structure: ["struktur"],
  scoring: ["scoring", "analiz"],
  report: ["raport", "report", "genero"],
};

function getStepStatus(step, job) {
  const currentStep = (job.current_step || "").toLowerCase();
  const progress = job.progress_percent || 0;

  const stepIndex = STEPS.filter(s => s.modes.includes(job.mode)).findIndex(s => s.id === step.id);
  const visibleSteps = STEPS.filter(s => s.modes.includes(job.mode));
  const totalSteps = visibleSteps.length;
  const completedUpTo = Math.floor((progress / 100) * totalSteps);

  // Check if current_step matches this step
  const keywords = STEP_KEYWORDS[step.id] || [];
  const isCurrentByKeyword = keywords.some(k => currentStep.includes(k));

  if (isCurrentByKeyword) return "running";
  if (stepIndex < completedUpTo) return "done";
  if (stepIndex === completedUpTo && progress > 0) return "running";
  return "pending";
}

function StepIcon({ status }) {
  if (status === "done") return <span style={{ fontSize: "16px" }}>✅</span>;
  if (status === "running") return (
    <span style={{ fontSize: "16px", display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }}>⏳</span>
  );
  return <span style={{ fontSize: "16px", color: "#334155" }}>○</span>;
}

export default function AuditRunning({ job }) {
  const visibleSteps = STEPS.filter(s => s.modes.includes(job.mode));
  const progress = job.progress_percent || 0;

  const progressColor = progress < 30 ? "#6366f1" : progress < 70 ? "#8b5cf6" : "#4ade80";

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Header */}
      <div className="mb-8">
        <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
          Audyt w toku
        </div>
        <h1 className="text-xl font-bold" style={{ color: "#f8fafc", wordBreak: "break-all" }}>
          {job.url}
        </h1>
        {job.keyword && (
          <p style={{ color: "#6366f1", fontSize: "13px", marginTop: "4px" }}>
            🔑 {job.keyword}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ color: "#94a3b8", fontSize: "12px" }}>Postęp</span>
          <span style={{ color: "#e2e8f0", fontSize: "12px", fontWeight: 700 }}>{progress}%</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "999px", height: "8px", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: `linear-gradient(90deg, #6366f1, ${progressColor})`,
            borderRadius: "999px",
            transition: "width 1s ease",
            boxShadow: `0 0 12px ${progressColor}60`,
          }} />
        </div>
      </div>

      {/* Steps */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        overflow: "hidden",
        marginBottom: "32px",
      }}>
        {visibleSteps.map((step, i) => {
          const status = getStepStatus(step, job);
          return (
            <div key={step.id} style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "14px 20px",
              borderBottom: i < visibleSteps.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              background: status === "running" ? "rgba(99,102,241,0.06)" : "transparent",
            }}>
              <StepIcon status={status} />
              <span style={{
                fontSize: "14px",
                fontWeight: status === "running" ? 600 : 400,
                color: status === "done" ? "#94a3b8" : status === "running" ? "#c7d2fe" : "#475569",
              }}>
                {step.label}
              </span>
              {status === "running" && (
                <span style={{
                  marginLeft: "auto",
                  fontSize: "11px",
                  color: "#6366f1",
                  fontWeight: 600,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}>
                  w toku...
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Info */}
      <p style={{ color: "#475569", fontSize: "13px", textAlign: "center" }}>
        Audyt w toku... Trwa zazwyczaj 60–90 sekund.
      </p>
    </div>
  );
}