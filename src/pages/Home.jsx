import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowRight, Zap, ChevronDown, Link2, Sliders, FileText } from "lucide-react";

const steps = [
  {
    icon: Link2,
    number: "01",
    title: "Wklej URL",
    desc: "Podaj adres strony, którą chcesz zaudytować — artykuł, landing page lub całą domenę.",
  },
  {
    icon: Sliders,
    number: "02",
    title: "Wybierz zakres",
    desc: "Skonfiguruj tryb analizy, model AI oraz moduły: SERP, Exa, Senuto i więcej.",
  },
  {
    icon: FileText,
    number: "03",
    title: "Otrzymaj raport",
    desc: "W kilka minut dostaniesz Content Quality Score 0–100, benchmarki i rekomendacje BEFORE/AFTER.",
  },
];

export default function Home() {
  const stepsRef = useRef(null);

  const scrollToSteps = () => {
    stepsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      style={{ background: "#0a0a0f", color: "#e2e8f0", fontFamily: "Inter, sans-serif" }}
      className="min-h-screen"
    >
      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between px-6 md:px-16 py-4 max-w-7xl mx-auto">
          <Link to={createPageUrl("Home")} style={{ textDecoration: "none" }}>
            <span style={{
              fontWeight: 700,
              fontSize: "17px",
              background: "linear-gradient(135deg, #a5b4fc, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}>
              ContentAudit<span style={{ opacity: 0.7 }}>Pro</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to={createPageUrl("Dashboard")}
              style={{ color: "#64748b", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
            >
              Zaloguj
            </Link>
            <Link
              to={createPageUrl("Dashboard")}
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Rozpocznij za darmo
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-32 max-w-5xl mx-auto">
        <div
          style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#a5b4fc" }}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-10"
        >
          <Zap className="w-3 h-3" />
          AI Search Optimization
        </div>

        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-7"
          style={{ color: "#f8fafc" }}
        >
          Audyt semantyczny treści
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #6366f1, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            pod AI Search
          </span>
        </h1>

        <p
          className="text-base md:text-xl max-w-2xl leading-relaxed mb-12"
          style={{ color: "#94a3b8" }}
        >
          Content Quality Score 0–100 &nbsp;•&nbsp; 9 wymiarów analizy &nbsp;•&nbsp; SERP benchmark
          &nbsp;•&nbsp; Rekomendacje BEFORE/AFTER
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            to={createPageUrl("Dashboard")}
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
          >
            Rozpocznij za darmo
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={scrollToSteps}
            style={{ border: "1px solid rgba(99,102,241,0.35)", color: "#a5b4fc" }}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-sm hover:bg-white/5 transition-colors"
          >
            Zobacz jak to działa
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="mt-24 flex flex-col items-center gap-2 opacity-30">
          <div
            className="w-px h-12"
            style={{ background: "linear-gradient(to bottom, transparent, #6366f1)" }}
          />
        </div>
      </section>

      {/* Steps */}
      <section
        ref={stepsRef}
        className="px-6 py-24 max-w-6xl mx-auto"
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#f8fafc" }}>
            3 kroki do lepszego contentu
          </h2>
          <p className="text-base" style={{ color: "#64748b" }}>
            Od URL do raportu w mniej niż 5 minut
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
              className="rounded-3xl p-8 hover:border-indigo-500/30 transition-colors group"
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  style={{ background: "rgba(99,102,241,0.15)" }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/25 transition-colors"
                >
                  <step.icon className="w-5 h-5" style={{ color: "#6366f1" }} />
                </div>
                <span
                  className="text-5xl font-black tabular-nums"
                  style={{ color: "rgba(99,102,241,0.15)" }}
                >
                  {step.number}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-3" style={{ color: "#f1f5f9" }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="px-6 py-24 text-center">
        <div
          style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
          className="max-w-2xl mx-auto rounded-3xl px-8 py-14"
        >
          <h2 className="text-3xl font-bold mb-4" style={{ color: "#f8fafc" }}>
            Gotowy na lepszy content?
          </h2>
          <p className="mb-8 text-sm" style={{ color: "#64748b" }}>
            Zacznij bezpłatnie — 10 kredytów na start, bez karty kredytowej.
          </p>
          <Link
            to={createPageUrl("Dashboard")}
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
          >
            Rozpocznij za darmo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="text-center py-8 text-xs"
        style={{ color: "#334155", borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        © 2026 ContentAudit Pro. Wszelkie prawa zastrzeżone.
      </footer>
    </div>
  );
}