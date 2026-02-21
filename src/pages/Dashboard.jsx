import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PageMeta from "../components/layout/PageMeta";
import { Plus, Coins, CreditCard, ExternalLink, AlertCircle, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const statusConfig = {
  draft:   { label: "Szkic",       style: { background: "rgba(100,116,139,0.2)", color: "#94a3b8" } },
  queued:  { label: "W kolejce",   style: { background: "rgba(100,116,139,0.2)", color: "#94a3b8" } },
  running: { label: "W trakcie",   style: { background: "rgba(99,102,241,0.2)",  color: "#a5b4fc" }, pulse: true },
  done:    { label: "Gotowy",      style: { background: "rgba(34,197,94,0.15)",  color: "#4ade80" } },
  error:   { label: "Błąd",        style: { background: "rgba(239,68,68,0.15)",  color: "#f87171" } },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.queued;
  return (
    <span
      style={{ ...cfg.style, borderRadius: "999px", fontSize: "11px", fontWeight: 600, padding: "3px 10px" }}
      className={cfg.pulse ? "animate-pulse" : ""}
    >
      {cfg.label}
    </span>
  );
}

function AuditRow({ job, onDelete }) {
  const shortUrl = job.url?.length > 50 ? job.url.slice(0, 50) + "…" : job.url;

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Na pewno usunąć ten audyt?")) return;
    await base44.entities.AuditJob.delete(job.id);
    onDelete();
  };

  return (
    <Link
      to={createPageUrl(`AuditDetail?id=${job.id}`)}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "16px 20px",
        borderRadius: "16px",
        textDecoration: "none",
        transition: "border-color 0.2s",
      }}
      className="hover:border-indigo-500/40 group"
    >
      {/* URL + keyword */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: "#e2e8f0" }}
          title={job.url}
        >
          {shortUrl}
        </p>
        {job.keyword && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "#64748b" }}>
            🔑 {job.keyword}
          </p>
        )}
      </div>

      {/* Status */}
      <div className="shrink-0">
        <StatusBadge status={job.status} />
      </div>

      {/* CQS score */}
      <div className="shrink-0 w-14 text-right">
        {job.status === "done" && job.result_cqs != null ? (
          <span
            className="text-2xl font-extrabold tabular-nums"
            style={{ color: job.result_cqs >= 70 ? "#4ade80" : job.result_cqs >= 40 ? "#facc15" : "#f87171" }}
          >
            {job.result_cqs}
          </span>
        ) : (
          <span style={{ color: "#1e293b" }}>—</span>
        )}
      </div>

      {/* Date */}
      <div className="shrink-0 text-xs text-right hidden sm:block" style={{ color: "#475569", minWidth: "80px" }}>
        {job.created_date
          ? format(new Date(job.created_date), "d MMM yyyy", { locale: pl })
          : ""}
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10"
        title="Usuń audyt"
      >
        <Trash2 className="w-4 h-4" style={{ color: "#f87171" }} />
      </button>

      <ExternalLink className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: "#6366f1" }} />
    </Link>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then((me) => {
      if (!me) {
        base44.auth.redirectToLogin();
        return;
      }
      setUser(me);
    });
  }, []);

  const { data: profiles } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const queryClient = useQueryClient();

  const { data: auditJobs, isLoading } = useQuery({
    queryKey: ["auditJobs", user?.email],
    queryFn: () => base44.entities.AuditJob.list("-created_date", 50),
    enabled: !!user?.email,
  });

  const profile = profiles?.[0];
  const jobs = auditJobs || [];

  const handleDeleteRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["auditJobs"] });
  };

  return (
    <div
      style={{ background: "#0a0a0f", color: "#e2e8f0", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}
      className="p-6 md:p-10"
    >
      <PageMeta title="Dashboard — ContentAudit Pro" />
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#f8fafc" }}>
              Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: "#475569" }}>
              Twoje audyty i saldo kredytów
            </p>
          </div>

          <Link
            to={createPageUrl("AuditNew")}
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Nowy audyt
          </Link>
        </div>

        {/* Credits card */}
        <div
          style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: "20px",
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              style={{ background: "rgba(99,102,241,0.2)", borderRadius: "14px" }}
              className="w-12 h-12 flex items-center justify-center"
            >
              <Coins className="w-6 h-6" style={{ color: "#a5b4fc" }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6366f1" }}>
                Saldo kredytów
              </p>
              <p className="text-4xl font-extrabold tabular-nums mt-0.5" style={{ color: "#f8fafc" }}>
                {profile?.credits_balance ?? "—"}
              </p>
            </div>
          </div>

          <Link
            to={createPageUrl("Credits")}
            style={{ border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc", borderRadius: "12px" }}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold hover:bg-white/5 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Doładuj kredyty
          </Link>
        </div>

        {/* Audit list */}
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: "#94a3b8" }}>
            Twoje audyty
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  style={{ background: "rgba(255,255,255,0.03)", borderRadius: "16px", height: "68px" }}
                  className="animate-pulse"
                />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px dashed rgba(255,255,255,0.08)",
                borderRadius: "20px",
              }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <AlertCircle className="w-10 h-10 mb-4" style={{ color: "#334155" }} />
              <p className="font-semibold mb-2" style={{ color: "#64748b" }}>
                Nie masz jeszcze audytów.
              </p>
              <p className="text-sm mb-6" style={{ color: "#334155" }}>
                Rozpocznij pierwszy i sprawdź jakość swojego contentu!
              </p>
              <Link
                to={createPageUrl("AuditNew")}
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Rozpocznij audyt
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <AuditRow key={job.id} job={job} onDelete={handleDeleteRefresh} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}