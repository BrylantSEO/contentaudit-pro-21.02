import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { AlertTriangle } from "lucide-react";

export default function AuditError({ job }) {
  return (
    <div className="max-w-xl mx-auto px-6 py-20 text-center">
      <div style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "rgba(239,68,68,0.12)", borderRadius: "16px", padding: "18px", marginBottom: "24px",
      }}>
        <AlertTriangle className="w-8 h-8" style={{ color: "#f87171" }} />
      </div>

      <h1 className="text-2xl font-bold mb-3" style={{ color: "#f8fafc" }}>Audyt zakończył się błędem</h1>

      {job.error_message && (
        <div style={{
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "14px", padding: "16px", marginBottom: "20px", textAlign: "left",
        }}>
          <p style={{ color: "#fca5a5", fontSize: "13px", fontFamily: "monospace", wordBreak: "break-word" }}>
            {job.error_message}
          </p>
        </div>
      )}

      <p style={{ color: "#4ade80", fontSize: "14px", marginBottom: "32px" }}>
        ✓ Kredyty zostały zwrócone na Twoje konto.
      </p>

      <Link
        to={createPageUrl("AuditNew")}
        style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "white", borderRadius: "14px", padding: "12px 28px",
          fontWeight: 700, fontSize: "14px", textDecoration: "none",
        }}
      >
        Spróbuj ponownie
      </Link>
    </div>
  );
}