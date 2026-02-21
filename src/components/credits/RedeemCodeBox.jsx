import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Ticket, ArrowRight } from "lucide-react";

export default function RedeemCodeBox({ onSuccess }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setLoading(true);
    const res = await base44.functions.invoke("redeemPromoCode", { code: code.trim() });
    setLoading(false);

    if (res.data?.success) {
      toast.success(`Przyznano ${res.data.credits_granted} kredytów! Nowe saldo: ${res.data.new_balance}`);
      setCode("");
      if (onSuccess) onSuccess();
    } else {
      toast.error(res.data?.error || "Błąd realizacji kodu");
    }
  };

  return (
    <div
      style={{
        background: "rgba(249,115,22,0.06)",
        border: "1px solid rgba(249,115,22,0.2)",
        borderRadius: "16px",
        padding: "20px",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Ticket style={{ width: "15px", height: "15px", color: "#f97316" }} />
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#f97316" }}>Masz kod promocyjny?</span>
      </div>
      <div className="flex gap-2">
        <input
          placeholder="Wpisz kod…"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            color: "#e2e8f0",
            padding: "10px 14px",
            fontSize: "13px",
            fontFamily: "monospace",
            fontWeight: 600,
            letterSpacing: "0.05em",
            outline: "none",
          }}
        />
        <button
          onClick={handleRedeem}
          disabled={loading || !code.trim()}
          style={{
            background: loading || !code.trim() ? "rgba(249,115,22,0.2)" : "rgba(249,115,22,0.9)",
            border: "none",
            borderRadius: "10px",
            padding: "10px 16px",
            color: "white",
            fontWeight: 700,
            fontSize: "13px",
            cursor: loading || !code.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: loading || !code.trim() ? 0.5 : 1,
          }}
        >
          {loading ? "…" : <><ArrowRight style={{ width: "14px", height: "14px" }} /> Realizuj</>}
        </button>
      </div>
    </div>
  );
}