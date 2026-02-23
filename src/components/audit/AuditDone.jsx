import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Copy, Check, RotateCcw, FileDown, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import AuditResultsView from "./AuditResultsView";
import { format } from "date-fns";

function ScoreBadge({ label, value, max }) {
  const pct = max === 100 ? value : (value / max) * 100;
  const color = pct > 70 ? "text-green-600" : pct >= 40 ? "text-amber-500" : "text-red-500";
  const desc = max === 100
    ? (pct > 70 ? "Świetna" : pct >= 40 ? "Do poprawy" : "Wymaga pracy")
    : (value >= 7 ? "Wysoka" : value >= 4 ? "Średnia" : "Niska");

  return (
    <div className="text-center">
      <div className={`text-5xl font-extrabold tabular-nums leading-none ${color}`}>
        {value}
        <span className="text-xl text-muted-foreground/40 font-normal">/{max}</span>
      </div>
      <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mt-1.5">
        {label}
      </div>
      <div className={`text-xs font-medium mt-0.5 ${color}`}>{desc}</div>
    </div>
  );
}

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
  const { theme, setTheme } = useTheme();

  const auditMd = useFetchMarkdown(job.result_audit_md);
  const scoresMd = useFetchMarkdown(job.result_scores_md);
  const benchmarkMd = useFetchMarkdown(job.result_benchmark_md);

  const hasPdf = Array.isArray(job.modules) && job.modules.includes("pdf");
  const isLoading = auditMd.loading;

  const cqs = job.result_cqs ?? 0;
  const citability = job.result_citability ?? 0;
  const cqsPct = cqs;
  const cqsColorCls = cqsPct > 70 ? "border-green-300 dark:border-green-700" : cqsPct >= 40 ? "border-amber-300 dark:border-amber-700" : "border-red-300 dark:border-red-700";

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
    <div className="min-h-screen bg-background text-foreground font-['Inter',sans-serif]">

      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 sm:px-6 py-3 flex items-center gap-4 flex-wrap">
        {/* CQS pill */}
        <div className={`flex items-center gap-2 ${cqsColorCls} border rounded-full px-3.5 py-1.5 shrink-0`}>
          <span className={`font-extrabold text-lg tabular-nums ${cqsPct > 70 ? "text-green-600" : cqsPct >= 40 ? "text-amber-500" : "text-red-500"}`}>{cqs}</span>
          <span className="text-muted-foreground text-[11px] font-semibold uppercase">CQS</span>
        </div>

        {/* URL */}
        <span className="text-muted-foreground text-sm flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {job.url}
        </span>

        {/* Keyword */}
        {job.keyword && (
          <Badge variant="secondary" className="shrink-0 text-xs">
            {job.keyword}
          </Badge>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0"
          title={theme === "dark" ? "Jasny motyw" : "Ciemny motyw"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Banner */}
        <div className={`bg-card border ${cqsColorCls} rounded-2xl p-6 sm:p-8 mb-8 shadow-sm`}>
          <div className="flex flex-wrap gap-8 sm:gap-12 items-center mb-6">
            <ScoreBadge label="CQS Score" value={cqs} max={100} />
            <div className="w-px h-14 bg-border hidden sm:block" />
            <ScoreBadge label="AI Citability" value={citability} max={10} />
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 mt-2">
            <div>
              <span className="text-muted-foreground text-[11px] font-semibold uppercase">URL</span>
              <p className="text-sm text-muted-foreground break-all mt-0.5">{job.url}</p>
            </div>
            {job.keyword && (
              <div>
                <span className="text-muted-foreground text-[11px] font-semibold uppercase">Fraza</span>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-0.5">{job.keyword}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground text-[11px] font-semibold uppercase">Model</span>
              <p className="text-sm text-muted-foreground mt-0.5">{job.model}</p>
            </div>
            {job.completed_at && (
              <div>
                <span className="text-muted-foreground text-[11px] font-semibold uppercase">Data</span>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {format(new Date(job.completed_at), "dd.MM.yyyy HH:mm")}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6 flex-wrap">
            <button onClick={copyReport} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all border ${
              copied
                ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-600"
                : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
            }`}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Skopiowano!" : "Kopiuj raport"}
            </button>

            {hasPdf && (
              <button onClick={exportMd} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5 text-amber-600 text-sm font-semibold cursor-pointer">
                <FileDown className="w-4 h-4" />
                Eksportuj PDF
              </button>
            )}

            <button onClick={rerun} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-2.5 text-indigo-600 dark:text-indigo-400 text-sm font-semibold cursor-pointer">
              <RotateCcw className="w-4 h-4" />
              Uruchom ponownie
            </button>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
            Ładowanie raportu...
          </div>
        ) : (
          <AuditResultsView
            auditMd={auditMd.content}
            scoresMd={scoresMd.content}
            benchmarkMd={benchmarkMd.content}
            cqs={cqs}
            citability={citability}
            jobId={job.id}
          />
        )}
      </div>
    </div>
  );
}
