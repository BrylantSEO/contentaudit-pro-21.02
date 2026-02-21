import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PageMeta from "../components/layout/PageMeta";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Coins, BarChart2, Check } from "lucide-react";

const planLabels = { free: "Darmowy", starter: "Starter", pro: "Pro", agency: "Agency" };
const planColors = {
  free: "bg-slate-100 text-slate-700",
  starter: "bg-blue-100 text-blue-700",
  pro: "bg-indigo-100 text-indigo-700",
  agency: "bg-violet-100 text-violet-700",
};

const GA_KEY = "contentaudit_ga_measurement_id";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [gaId, setGaId] = useState(() => localStorage.getItem(GA_KEY) || "");
  const [gaSaved, setGaSaved] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profiles } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const profile = profiles?.[0];

  const saveGaId = () => {
    if (gaId.trim()) {
      localStorage.setItem(GA_KEY, gaId.trim());
    } else {
      localStorage.removeItem(GA_KEY);
    }
    setGaSaved(true);
    setTimeout(() => setGaSaved(false), 2500);
  };

  return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", padding: "40px 24px", fontFamily: "Inter, sans-serif" }}>
      <PageMeta title="Ustawienia — ContentAudit Pro" />
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#f8fafc" }}>Ustawienia</h1>
          <p className="text-sm mt-1" style={{ color: "#475569" }}>Zarządzaj swoim kontem i integracjami</p>
        </div>

        {/* Profile */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "24px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px" }}>Profil</p>
          <div className="flex items-center gap-4 mb-6">
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700, color: "white" }}>
              {user?.full_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p style={{ fontWeight: 600, color: "#f8fafc", fontSize: "15px" }}>{user?.full_name || "—"}</p>
              <p style={{ fontSize: "13px", color: "#475569" }}>{user?.email || "—"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "16px" }}>
              <div className="flex items-center gap-2 mb-1">
                <Shield style={{ width: "14px", height: "14px", color: "#475569" }} />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>Plan</span>
              </div>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#a5b4fc" }}>{planLabels[profile?.plan] || "Darmowy"}</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "16px" }}>
              <div className="flex items-center gap-2 mb-1">
                <Coins style={{ width: "14px", height: "14px", color: "#475569" }} />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>Kredyty</span>
              </div>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>{profile?.credits_balance ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Google Analytics */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "24px" }}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ background: "rgba(251,191,36,0.12)", borderRadius: "10px", padding: "8px" }}>
              <BarChart2 style={{ width: "16px", height: "16px", color: "#fbbf24" }} />
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>Google Analytics 4</p>
              <p style={{ fontSize: "12px", color: "#475569" }}>Podaj Measurement ID (np. G-XXXXXXXXXX)</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="G-XXXXXXXXXX"
              value={gaId}
              onChange={(e) => setGaId(e.target.value)}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                color: "#e2e8f0",
                padding: "10px 14px",
                fontSize: "14px",
                outline: "none",
                fontFamily: "monospace",
              }}
            />
            <button
              onClick={saveGaId}
              style={{
                background: gaSaved ? "rgba(74,222,128,0.15)" : "rgba(99,102,241,0.15)",
                border: gaSaved ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(99,102,241,0.4)",
                borderRadius: "10px",
                padding: "10px 18px",
                color: gaSaved ? "#4ade80" : "#a5b4fc",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
            >
              {gaSaved ? <><Check style={{ width: "14px", height: "14px" }} /> Zapisano</> : "Zapisz"}
            </button>
          </div>
          {gaId && (
            <p style={{ fontSize: "11px", color: "#334155", marginTop: "8px" }}>
              Tracking aktywny: <span style={{ color: "#475569", fontFamily: "monospace" }}>{gaId}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}