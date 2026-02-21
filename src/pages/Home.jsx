import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ArrowRight, Zap, ChevronDown, Link2, Sliders, FileText,
  Target, AlignLeft, Database, MapPin, Cpu, BarChart2, BookOpen, Tag, Shield, Check
} from "lucide-react";

const HOW_STEPS = [
  {
    num: "①",
    title: "Wklej URL artykułu i frazę kluczową",
    desc: "Podaj adres strony, którą chcesz zaudytować, oraz opcjonalne słowo kluczowe dla analizy SERP.",
    icon: Link2,
  },
  {
    num: "②",
    title: "Wybierz model AI i zakres analizy",
    desc: "Skonfiguruj model (GPT-4.1 Mini, Claude Sonnet, Opus) i włącz moduły: SERP benchmark, Exa, Senuto.",
    icon: Sliders,
  },
  {
    num: "③",
    title: "Otrzymaj raport z CQS score i rekomendacjami",
    desc: "W kilka minut dostaniesz Content Quality Score 0–100 oraz konkretne poprawki BEFORE/AFTER.",
    icon: FileText,
  },
];

const DIMENSIONS = [
  { icon: Target,    label: "CSI Alignment",        desc: "Spójność z intencją wyszukiwania" },
  { icon: AlignLeft, label: "BLUF Format",           desc: "Odpowiedź na górze sekcji" },
  { icon: Database,  label: "Chunk Quality",         desc: "Optymalizacja pod RAG" },
  { icon: MapPin,    label: "URR Placement",         desc: "Rozmieszczenie atrybutów Unique/Root/Rare" },
  { icon: Cpu,       label: "Cost of Retrieval",     desc: "Koszt przetworzenia przez AI" },
  { icon: BarChart2, label: "Information Density",   desc: "Stosunek faktów do puchu" },
  { icon: BookOpen,  label: "SRL Salience",          desc: "Role semantyczne w zdaniach" },
  { icon: Tag,       label: "TF-IDF Quality",        desc: "Terminologia specjalistyczna" },
  { icon: Shield,    label: "E-E-A-T",               desc: "Experience, Expertise, Authority, Trust" },
];

const PKG_STYLE = {
  Starter: { gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", badge: null },
  Pro:     { gradient: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)", badge: "Popularny" },
  Agency:  { gradient: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)", badge: "Najlepszy wybór" },
};

export default function Home() {
  const stepsRef = useRef(null);
  const pricingRef = useRef(null);

  const { data: packages = [] } = useQuery({
    queryKey: ["creditPackages-public"],
    queryFn: () => base44.entities.CreditPackage.filter({ is_active: true }),
  });

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ background: "#0a0a0f", color: "#e2e8f0", fontFamily: "Inter, sans-serif" }} className="min-h-screen">

      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between px-6 md:px-16 py-4 max-w-7xl mx-auto">
          <Link to={createPageUrl("Home")} style={{ textDecoration: "none" }}>
            <span style={{ fontWeight: 700, fontSize: "17px", background: "linear-gradient(135deg, #a5b4fc, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>
              ContentAudit<span style={{ opacity: 0.7 }}>Pro</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo(stepsRef)} style={{ background: "none", border: "none", color: "#64748b", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Jak to działa</button>
            <button onClick={() => scrollTo(pricingRef)} style={{ background: "none", border: "none", color: "#64748b", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Cennik</button>
          </div>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Dashboard")} style={{ color: "#64748b", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>Zaloguj</Link>
            <Link to={createPageUrl("Dashboard")} style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
              Rozpocznij za darmo
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-28 max-w-5xl mx-auto">
        <div style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#a5b4fc" }}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-10">
          <Zap className="w-3 h-3" /> AI Search Optimization
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-7" style={{ color: "#f8fafc" }}>
          Audyt semantyczny treści<br />
          <span style={{ background: "linear-gradient(90deg, #6366f1, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            pod AI Search
          </span>
        </h1>

        <p className="text-base md:text-xl max-w-2xl leading-relaxed mb-12" style={{ color: "#94a3b8" }}>
          Content Quality Score 0–100 &nbsp;•&nbsp; 9 wymiarów analizy &nbsp;•&nbsp; SERP benchmark &nbsp;•&nbsp; Rekomendacje BEFORE/AFTER
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link to={createPageUrl("Dashboard")} style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity">
            Rozpocznij za darmo <ArrowRight className="w-4 h-4" />
          </Link>
          <button onClick={() => scrollTo(stepsRef)} style={{ border: "1px solid rgba(99,102,241,0.35)", color: "#a5b4fc", background: "none" }}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-sm hover:bg-white/5 transition-colors cursor-pointer">
            Zobacz jak to działa <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-20 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-12" style={{ background: "linear-gradient(to bottom, transparent, #6366f1)" }} />
        </div>
      </section>

      {/* ─── Jak to działa ───────────────────────────────────────────────────── */}
      <section ref={stepsRef} className="px-6 py-24 max-w-6xl mx-auto">
        <SectionHeader title="Jak to działa" sub="Od URL do raportu w mniej niż 5 minut" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
          {HOW_STEPS.map((step, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "24px", padding: "32px" }}
              className="hover:border-indigo-500/30 transition-colors group relative">
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-14 -right-3 z-10"
                  style={{ width: "24px", height: "2px", background: "linear-gradient(90deg, rgba(99,102,241,0.4), transparent)" }} />
              )}
              <div className="flex items-start justify-between mb-6">
                <div style={{ background: "rgba(99,102,241,0.15)", borderRadius: "16px", width: "52px", height: "52px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <step.icon className="w-5 h-5" style={{ color: "#6366f1" }} />
                </div>
                <span style={{ fontSize: "56px", fontWeight: 900, color: "rgba(99,102,241,0.12)", lineHeight: 1 }}>{step.num}</span>
              </div>
              <h3 className="text-base font-bold mb-3" style={{ color: "#f1f5f9" }}>{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 9 wymiarów ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-24" style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeader title="9 wymiarów analizy" sub="Każdy artykuł oceniany w 9 kluczowych kategoriach AI-readiness" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-14">
            {DIMENSIONS.map((dim, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "18px",
                padding: "22px 24px",
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
              }} className="hover:border-indigo-500/30 hover:bg-white/[0.03] transition-all">
                <div style={{ background: "rgba(99,102,241,0.12)", borderRadius: "10px", padding: "10px", flexShrink: 0 }}>
                  <dim.icon className="w-4 h-4" style={{ color: "#a5b4fc" }} />
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0", marginBottom: "4px" }}>{dim.label}</p>
                  <p style={{ fontSize: "12px", color: "#475569", lineHeight: 1.5 }}>{dim.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Cennik ──────────────────────────────────────────────────────────── */}
      <section ref={pricingRef} className="px-6 py-24 max-w-6xl mx-auto">
        <SectionHeader title="Cennik" sub="Płać tylko za to, czego używasz — bez abonamentów" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
          {packages.length > 0 ? packages.map((pkg) => {
            const style = PKG_STYLE[pkg.name] || PKG_STYLE.Starter;
            const pricePerCredit = pkg.credits > 0 ? (pkg.price_pln / pkg.credits).toFixed(2) : "—";
            return (
              <div key={pkg.id} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "24px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}>
                {style.badge && (
                  <div style={{
                    position: "absolute", top: "16px", right: "16px",
                    background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
                    borderRadius: "999px", fontSize: "10px", fontWeight: 700, color: "#a5b4fc",
                    padding: "3px 10px", textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>{style.badge}</div>
                )}
                <div style={{ height: "4px", background: style.gradient }} />
                <div style={{ padding: "28px 28px 24px" }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", marginBottom: "16px" }}>{pkg.name}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "42px", fontWeight: 900, color: "#f8fafc", lineHeight: 1 }}>{pkg.price_pln}</span>
                    <span style={{ fontSize: "14px", color: "#64748b" }}>PLN</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#475569", marginBottom: "20px" }}>{pricePerCredit} PLN / kredyt</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                    <div style={{ background: "rgba(99,102,241,0.15)", borderRadius: "8px", padding: "6px 14px" }}>
                      <span style={{ fontSize: "20px", fontWeight: 800, color: "#a5b4fc" }}>{pkg.credits}</span>
                      <span style={{ fontSize: "12px", color: "#475569", marginLeft: "4px" }}>kredytów</span>
                    </div>
                  </div>
                  <Link to={createPageUrl("Dashboard")} style={{
                    display: "block", textAlign: "center",
                    background: style.gradient,
                    color: "white", borderRadius: "12px", padding: "11px",
                    fontSize: "13px", fontWeight: 700, textDecoration: "none",
                  }}>
                    Kup pakiet
                  </Link>
                </div>
              </div>
            );
          }) : (
            // Placeholder when no packages loaded
            ["Starter", "Pro", "Agency"].map((name, i) => {
              const style = PKG_STYLE[name];
              const credits = [50, 150, 500][i];
              const price = [29, 79, 199][i];
              return (
                <div key={name} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", overflow: "hidden", position: "relative" }}>
                  {style.badge && (
                    <div style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "999px", fontSize: "10px", fontWeight: 700, color: "#a5b4fc", padding: "3px 10px", textTransform: "uppercase" }}>{style.badge}</div>
                  )}
                  <div style={{ height: "4px", background: style.gradient }} />
                  <div style={{ padding: "28px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", marginBottom: "16px" }}>{name}</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "42px", fontWeight: 900, color: "#f8fafc", lineHeight: 1 }}>{price}</span>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>PLN</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#475569", marginBottom: "20px" }}>{(price / credits).toFixed(2)} PLN / kredyt</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                      <div style={{ background: "rgba(99,102,241,0.15)", borderRadius: "8px", padding: "6px 14px" }}>
                        <span style={{ fontSize: "20px", fontWeight: 800, color: "#a5b4fc" }}>{credits}</span>
                        <span style={{ fontSize: "12px", color: "#475569", marginLeft: "4px" }}>kredytów</span>
                      </div>
                    </div>
                    <Link to={createPageUrl("Dashboard")} style={{ display: "block", textAlign: "center", background: style.gradient, color: "white", borderRadius: "12px", padding: "11px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                      Kup pakiet
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Free tier note */}
        <div className="text-center mt-10 flex flex-col items-center gap-2">
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#475569", fontSize: "13px" }}>
            <Check className="w-4 h-4" style={{ color: "#4ade80" }} />
            Zarejestruj się i otrzymaj <strong style={{ color: "#94a3b8" }}>10 kredytów za darmo</strong> — bez karty kredytowej
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 text-center">
        <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
          className="max-w-2xl mx-auto rounded-3xl px-8 py-14">
          <h2 className="text-3xl font-bold mb-4" style={{ color: "#f8fafc" }}>Gotowy na lepszy content?</h2>
          <p className="mb-8 text-sm" style={{ color: "#64748b" }}>Zacznij bezpłatnie — 10 kredytów na start, bez karty kredytowej.</p>
          <Link to={createPageUrl("Dashboard")} style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity">
            Rozpocznij za darmo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span style={{ color: "#334155", fontSize: "13px" }}>© 2026 ContentAudit Pro. Wszelkie prawa zastrzeżone.</span>
          <div className="flex items-center gap-6">
            {["Regulamin", "Polityka prywatności", "Kontakt"].map((label) => (
              <a key={label} href="#" style={{ color: "#334155", fontSize: "13px", textDecoration: "none" }}
                className="hover:text-slate-400 transition-colors">{label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#f8fafc" }}>{title}</h2>
      <p style={{ color: "#64748b", fontSize: "15px" }}>{sub}</p>
    </div>
  );
}