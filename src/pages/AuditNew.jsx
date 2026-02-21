import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CreditCard, X } from "lucide-react";

// ─── Model definitions ────────────────────────────────────────────────────────
const MODELS = [
  {
    id: "gpt-4.1-mini",
    label: "GPT-4.1 Mini",
    badge: "Szybki",
    badgeColor: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
    scoringCost: 2,
    desc: "Szybka analiza, niski koszt kredytów.",
  },
  {
    id: "sonnet-4.6",
    label: "Claude Sonnet 4.6",
    badge: "Rekomendowany",
    badgeColor: { bg: "rgba(139,92,246,0.2)", text: "#c4b5fd" },
    scoringCost: 5,
    desc: "Najlepszy stosunek jakości do ceny.",
    default: true,
  },
  {
    id: "opus-4.5",
    label: "Claude Opus 4.5",
    badge: "Premium",
    badgeColor: { bg: "rgba(234,179,8,0.15)", text: "#fbbf24" },
    scoringCost: 12,
    desc: "Maksymalna głębokość analizy.",
  },
];

// ─── Module definitions ───────────────────────────────────────────────────────
const FIXED_MODULES = [
  { id: "crawl",     label: "🌐 Crawl artykułu",         cost: 1 },
  { id: "structure", label: "📐 Analiza struktury",       cost: 1 },
  { id: "scoring",   label: "📊 Scoring 9 wymiarów",      costKey: "scoring" },
  { id: "report",    label: "📋 Raport końcowy",           costKey: "scoring" },
];

const OPTIONAL_MODULES = [
  { id: "serp5",  label: "🔍 SERP Benchmark (5 URLs)",   cost: 8 },
  { id: "serp10", label: "🔎 SERP Benchmark (10 URLs)",  cost: 14 },
  { id: "exa",    label: "🧠 Exa AI Information Gain",   cost: 6 },
  { id: "senuto", label: "📈 Senuto Volume & CPC",        cost: 3 },
  { id: "pdf",    label: "📄 Export PDF",                 cost: 2 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const S = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "24px",
  },
  label: { color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" },
  input: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "#e2e8f0",
    padding: "12px 16px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
  },
};

export default function AuditNew() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedModel, setSelectedModel] = useState("sonnet-4.6");
  const [optionalModules, setOptionalModules] = useState({
    serp5: false, serp10: false, exa: false, senuto: false, pdf: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [insufficientModal, setInsufficientModal] = useState(null); // { needed, have }

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profiles } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });
  const profile = profiles?.[0];

  // ─── Cost calculation ────────────────────────────────────────────────────
  const model = MODELS.find((m) => m.id === selectedModel);
  const totalCost = useMemo(() => {
    let cost = 0;
    // Fixed modules
    FIXED_MODULES.forEach((m) => {
      if (m.costKey === "scoring") cost += model?.scoringCost ?? 0;
      else cost += m.cost;
    });
    // Optional modules
    OPTIONAL_MODULES.forEach((m) => {
      if (optionalModules[m.id]) cost += m.cost;
    });
    return cost;
  }, [selectedModel, optionalModules, model]);

  const balance = profile?.credits_balance ?? 0;
  const canAfford = balance >= totalCost;

  // Disable SERP checkboxes when keyword is empty
  const serpDisabled = !keyword.trim();

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // 1. URL validation
    setUrlError("");
    if (!url.trim()) {
      setUrlError("URL jest wymagany.");
      return;
    }
    try {
      new URL(url.trim());
    } catch {
      setUrlError("Podaj poprawny adres URL (np. https://example.com/artykul).");
      return;
    }

    // 2. Re-fetch fresh balance
    const freshProfiles = await base44.entities.UserProfile.filter({ created_by: user.email });
    const freshProfile = freshProfiles?.[0];
    const freshBalance = freshProfile?.credits_balance ?? 0;

    // 3. Check balance
    if (freshBalance < totalCost) {
      setInsufficientModal({ needed: totalCost, have: freshBalance });
      return;
    }

    setSubmitting(true);

    const selectedOptional = OPTIONAL_MODULES.filter((m) => optionalModules[m.id]).map((m) => m.id);
    const modules = ["crawl", "structure", "scoring", "report", ...selectedOptional];

    const hasSerp = optionalModules.serp5 || optionalModules.serp10;
    const mode = keyword.trim()
      ? hasSerp ? "full" : "content-only"
      : "content-only";

    const shortUrl = url.length > 40 ? url.slice(0, 40) + "…" : url;

    // 4a. Create transaction
    await base44.entities.CreditTransaction.create({
      user_id: freshProfile.id,
      amount: -totalCost,
      type: "spend",
      description: `Audyt: ${shortUrl}`,
    });

    // 4b. Deduct credits
    await base44.entities.UserProfile.update(freshProfile.id, {
      credits_balance: freshBalance - totalCost,
    });

    // 4c. Create AuditJob
    const job = await base44.entities.AuditJob.create({
      user_id: freshProfile.id,
      url: url.trim(),
      keyword: keyword.trim() || undefined,
      mode,
      model: selectedModel,
      modules,
      credits_cost: totalCost,
      status: "queued",
      progress_percent: 0,
      created_at: new Date().toISOString(),
    });

    setSubmitting(false);
    navigate(createPageUrl(`AuditDetail?id=${job.id}`));
  };

  // When keyword cleared → uncheck SERP modules
  useEffect(() => {
    if (!keyword.trim()) {
      setOptionalModules((prev) => ({ ...prev, serp5: false, serp10: false }));
    }
  }, [keyword]);

  const toggleOptional = (id) => {
    if ((id === "serp5" || id === "serp10") && serpDisabled) return;
    if (id === "serp5" || id === "serp10") {
      setOptionalModules((prev) => ({
        ...prev,
        serp5: id === "serp5" ? !prev.serp5 : false,
        serp10: id === "serp10" ? !prev.serp10 : false,
      }));
    } else {
      setOptionalModules((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  };

  return (
    <div
      style={{ background: "#0a0a0f", color: "#e2e8f0", minHeight: "100vh", fontFamily: "Inter, sans-serif", paddingBottom: "100px" }}
    >
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#f8fafc" }}>
            Konfiguruj audyt
          </h1>
          <p className="text-sm mt-1" style={{ color: "#475569" }}>
            Ustaw parametry i uruchom analizę semantyczną
          </p>
        </div>

        {/* URL + Keyword */}
        <div style={S.card} className="space-y-5">
          <div className="space-y-2">
            <label style={S.label}>URL artykułu *</label>
            <input
              type="url"
              placeholder="https://example.com/artykul"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ ...S.input, borderColor: urlError ? "rgba(248,113,113,0.6)" : S.input.border }}
              onFocus={(e) => (e.target.style.borderColor = urlError ? "rgba(248,113,113,0.8)" : "rgba(99,102,241,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = urlError ? "rgba(248,113,113,0.6)" : "rgba(255,255,255,0.1)")}
            />
            {urlError && (
              <p style={{ color: "#f87171", fontSize: "12px", marginTop: "4px" }}>{urlError}</p>
            )}
          </div>
          <div className="space-y-2">
            <label style={S.label}>Fraza kluczowa <span style={{ color: "#334155" }}>(opcjonalna)</span></label>
            <input
              type="text"
              placeholder="np. audyt SEO treści — puste = tryb content-only"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={S.input}
              onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>
        </div>

        {/* Model selection */}
        <div className="space-y-3">
          <p style={S.label}>Model AI</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MODELS.map((m) => {
              const active = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  style={{
                    background: active ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
                    border: active ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "16px",
                    padding: "16px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    color: "#e2e8f0",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      style={{
                        background: m.badgeColor.bg,
                        color: m.badgeColor.text,
                        borderRadius: "999px",
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {m.badge}
                    </span>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        border: active ? "5px solid #6366f1" : "2px solid rgba(255,255,255,0.2)",
                        background: "transparent",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: active ? "#c7d2fe" : "#cbd5e1" }}>
                    {m.label}
                  </p>
                  <p className="text-xs" style={{ color: "#475569" }}>
                    {m.desc}
                  </p>
                  <p className="text-xs mt-2" style={{ color: "#6366f1" }}>
                    {m.scoringCost} kr / scoring call
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-3">
          <p style={S.label}>Moduły analizy</p>
          <div style={S.card} className="space-y-0 divide-y" style2={{ ...S.card }}>
            {/* Fixed */}
            {FIXED_MODULES.map((m) => {
              const cost = m.costKey === "scoring" ? model?.scoringCost : m.cost;
              return (
                <ModuleRow
                  key={m.id}
                  label={m.label}
                  cost={cost}
                  checked={true}
                  disabled={true}
                />
              );
            })}
            {/* Optional */}
            {OPTIONAL_MODULES.map((m) => {
              const isSerp = m.id === "serp5" || m.id === "serp10";
              const isDisabled = isSerp && serpDisabled;
              return (
                <ModuleRow
                  key={m.id}
                  label={m.label}
                  cost={m.cost}
                  checked={!!optionalModules[m.id]}
                  disabled={isDisabled}
                  dimmed={isDisabled}
                  onChange={() => toggleOptional(m.id)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Insufficient credits modal */}
      {insufficientModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
          }}
          onClick={() => setInsufficientModal(null)}
        >
          <div
            style={{
              background: "#13131a", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "24px", padding: "32px", maxWidth: "400px", width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                style={{ background: "rgba(239,68,68,0.15)", borderRadius: "12px", padding: "10px" }}
              >
                <CreditCard className="w-6 h-6" style={{ color: "#f87171" }} />
              </div>
              <button onClick={() => setInsufficientModal(null)} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#f8fafc" }}>Za mało kredytów</h3>
            <p className="text-sm mb-1" style={{ color: "#94a3b8" }}>
              Potrzebujesz <span style={{ color: "#f87171", fontWeight: 700 }}>{insufficientModal.needed} kr</span>, a masz{" "}
              <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{insufficientModal.have} kr</span>.
            </p>
            <p className="text-sm mb-6" style={{ color: "#475569" }}>
              Brakuje {insufficientModal.needed - insufficientModal.have} kredytów.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setInsufficientModal(null)}
                style={{
                  flex: 1, padding: "12px", borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
                  color: "#94a3b8", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                }}
              >
                Anuluj
              </button>
              <Link
                to={createPageUrl("Credits")}
                style={{
                  flex: 1, padding: "12px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "white", fontSize: "14px", fontWeight: 700,
                  textDecoration: "none", textAlign: "center",
                }}
              >
                Doładuj
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Sticky bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(10,10,15,0.92)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          zIndex: 50,
          padding: "16px 24px",
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Cost */}
          <div>
            <p style={{ color: "#475569", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Koszt
            </p>
            <p style={{ color: "#f8fafc", fontSize: "22px", fontWeight: 800, lineHeight: 1.2 }}>
              {totalCost}{" "}
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>kredytów</span>
            </p>
          </div>

          {/* Balance */}
          <div className="hidden sm:block text-center">
            <p style={{ color: "#475569", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Twoje saldo
            </p>
            <p
              style={{
                color: canAfford ? "#4ade80" : "#f87171",
                fontSize: "22px",
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {balance}{" "}
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>kr</span>
            </p>
          </div>

          {/* CTA */}
          {canAfford ? (
            <button
              onClick={handleSubmit}
              disabled={!url || submitting}
              style={{
                background: (!url || submitting) ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
                borderRadius: "14px",
                padding: "12px 24px",
                fontWeight: 700,
                fontSize: "14px",
                border: "none",
                cursor: (!url || submitting) ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "opacity 0.2s",
                opacity: (!url || submitting) ? 0.6 : 1,
              }}
            >
              {submitting ? "Uruchamianie…" : "Uruchom audyt"}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          ) : (
            <Link
              to={createPageUrl("Credits")}
              style={{
                background: "rgba(234,179,8,0.15)",
                border: "1px solid rgba(234,179,8,0.3)",
                color: "#fbbf24",
                borderRadius: "14px",
                padding: "12px 24px",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CreditCard className="w-4 h-4" />
              Doładuj kredyty
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Module row component ─────────────────────────────────────────────────────
function ModuleRow({ label, cost, checked, disabled, dimmed, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "13px 20px",
        background: disabled && !dimmed ? "rgba(255,255,255,0.02)" : "transparent",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        cursor: (disabled || dimmed) ? "default" : "pointer",
        opacity: dimmed ? 0.4 : 1,
        transition: "opacity 0.2s",
      }}
      onClick={(disabled || dimmed) ? undefined : onChange}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <div
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "6px",
            background: checked
              ? disabled
                ? "rgba(100,116,139,0.4)"
                : "rgba(99,102,241,0.9)"
              : "rgba(255,255,255,0.05)",
            border: checked
              ? "none"
              : "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {checked && (
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: disabled ? "#475569" : "#cbd5e1",
          }}
        >
          {label}
        </span>
        {disabled && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#334155",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "6px",
              padding: "1px 6px",
            }}
          >
            zawsze
          </span>
        )}
      </div>

      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: disabled ? "#334155" : "#6366f1",
          tabularNums: "tabular-nums",
        }}
      >
        {cost} kr
      </span>
    </div>
  );
}