import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { CreditCard, Zap, Sparkles, Rocket } from "lucide-react";
import { toast } from "sonner";

const PLAN_LABELS = { free: "Free", starter: "Starter", pro: "Pro", agency: "Agency" };

const PKG_META = {
  Starter: { icon: Sparkles, color: "#6366f1", featured: false, badge: null },
  Pro:     { icon: Zap,      color: "#8b5cf6", featured: true,  badge: "Popularne" },
  Agency:  { icon: Rocket,   color: "#a855f7", featured: false, badge: "Najlepsza wartość" },
};

const TX_TYPES = {
  purchase: { label: "Zakup",  emoji: "🟢", color: "#4ade80" },
  spend:    { label: "Wydatek", emoji: "🔴", color: "#f87171" },
  refund:   { label: "Zwrot",  emoji: "🟡", color: "#fbbf24" },
};

export default function Billing() {
  const [user, setUser] = useState(null);
  const [buying, setBuying] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => {
      if (!u) { base44.auth.redirectToLogin(); return; }
      setUser(u);
    });
  }, []);

  // Handle success redirect from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      // Refetch profile & transactions after a short delay (webhook may not have fired yet)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["userProfile"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      }, 2000);
    }
  }, []);

  const { data: profiles } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });
  const profile = profiles?.[0];

  const { data: packages = [] } = useQuery({
    queryKey: ["creditPackages"],
    queryFn: () => base44.entities.CreditPackage.filter({ is_active: true }),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", user?.email],
    queryFn: () => base44.entities.CreditTransaction.filter({ created_by: user.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  // Sort packages: Starter, Pro, Agency
  const ORDER = ["Starter", "Pro", "Agency"];
  const sortedPackages = [...packages].sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));

  const handleBuy = async (pkg) => {
    // Block from iframe (editor preview)
    if (window.self !== window.top) {
      alert("Płatności działają tylko w opublikowanej aplikacji. Otwórz app w nowej karcie.");
      return;
    }
    if (!pkg.stripe_price_id) {
      alert("Ten pakiet nie jest jeszcze dostępny.");
      return;
    }
    setBuying(pkg.id);
    try {
      const res = await base44.functions.invoke("createCheckoutSession", {
        price_id: pkg.stripe_price_id,
        package_id: pkg.id,
        credits: pkg.credits,
        success_url: `${window.location.origin}${window.location.pathname}?success=1`,
        cancel_url: `${window.location.origin}${window.location.pathname}?cancelled=1`,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBuying(null);
    }
  };

  // Success / cancel banners
  const params = new URLSearchParams(window.location.search);
  const isSuccess = params.get("success") === "1";
  const isCancelled = params.get("cancelled") === "1";

  const balance = profile?.credits_balance ?? "—";
  const plan = PLAN_LABELS[profile?.plan] ?? "—";

  return (
    <div style={{ background: "#0a0a0f", color: "#e2e8f0", minHeight: "100vh", fontFamily: "Inter, sans-serif", paddingBottom: "80px" }}>
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">

        {/* Banners */}
        {isSuccess && (
          <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "14px", padding: "16px 20px", color: "#4ade80", fontWeight: 600, fontSize: "14px" }}>
            ✅ Płatność zakończona sukcesem! Kredyty zostały dodane do Twojego konta.
          </div>
        )}
        {isCancelled && (
          <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "14px", padding: "16px 20px", color: "#f87171", fontWeight: 600, fontSize: "14px" }}>
            ❌ Płatność została anulowana.
          </div>
        )}

        {/* Header */}
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#f8fafc", marginBottom: "6px" }}>Doładuj kredyty</h1>
          <p style={{ color: "#475569", fontSize: "14px" }}>Kup pakiet kredytów i uruchamiaj audyty SEO bez ograniczeń.</p>
        </div>

        {/* Section 1 — Balance */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "8px" }}>
            <div style={{ background: "rgba(99,102,241,0.15)", borderRadius: "12px", padding: "10px" }}>
              <CreditCard className="w-5 h-5" style={{ color: "#6366f1" }} />
            </div>
            <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Twoje saldo</span>
          </div>
          <div style={{ fontSize: "56px", fontWeight: 800, color: "#f8fafc", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {balance}
            <span style={{ fontSize: "22px", fontWeight: 500, color: "#475569", marginLeft: "8px" }}>kredytów</span>
          </div>
          <p style={{ color: "#475569", fontSize: "13px", marginTop: "8px" }}>Plan: <span style={{ color: "#c7d2fe", fontWeight: 600 }}>{plan}</span></p>
        </div>

        {/* Section 2 — Packages */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", marginBottom: "20px" }}>Kup kredyty</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {sortedPackages.map((pkg) => {
              const meta = PKG_META[pkg.name] || PKG_META.Starter;
              const Icon = meta.icon;
              const pricePerCredit = (pkg.price_pln / pkg.credits).toFixed(2);
              const isLoading = buying === pkg.id;

              return (
                <div key={pkg.id} style={{
                  background: meta.featured ? "rgba(99,102,241,0.07)" : "rgba(255,255,255,0.03)",
                  border: meta.featured ? "1px solid rgba(99,102,241,0.45)" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "20px",
                  padding: "28px 24px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0",
                  transform: meta.featured ? "scale(1.03)" : "none",
                  boxShadow: meta.featured ? "0 0 40px rgba(99,102,241,0.12)" : "none",
                }}>
                  {/* Badge */}
                  {meta.badge && (
                    <div style={{
                      position: "absolute",
                      top: "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: meta.featured ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(168,85,247,0.2)",
                      border: meta.featured ? "none" : "1px solid rgba(168,85,247,0.4)",
                      borderRadius: "999px",
                      padding: "4px 14px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: meta.featured ? "white" : "#c4b5fd",
                      whiteSpace: "nowrap",
                    }}>{meta.badge}</div>
                  )}

                  {/* Icon */}
                  <div style={{ background: `${meta.color}20`, borderRadius: "12px", padding: "10px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                    <Icon style={{ color: meta.color, width: "22px", height: "22px" }} />
                  </div>

                  {/* Name */}
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", marginBottom: "4px" }}>{pkg.name}</div>

                  {/* Credits */}
                  <div style={{ fontSize: "42px", fontWeight: 800, color: meta.featured ? "#c7d2fe" : "#e2e8f0", lineHeight: 1.1, marginBottom: "4px" }}>
                    {pkg.credits}
                    <span style={{ fontSize: "16px", fontWeight: 500, color: "#475569", marginLeft: "6px" }}>kr</span>
                  </div>

                  {/* Price per credit */}
                  <div style={{ fontSize: "12px", color: "#475569", marginBottom: "20px" }}>{pricePerCredit} zł / kredyt</div>

                  {/* Price */}
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#f8fafc", marginBottom: "20px" }}>
                    {pkg.price_pln} <span style={{ fontSize: "14px", fontWeight: 500, color: "#64748b" }}>PLN</span>
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => handleBuy(pkg)}
                    disabled={isLoading}
                    style={{
                      background: meta.featured
                        ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                        : "rgba(255,255,255,0.08)",
                      border: meta.featured ? "none" : "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "12px",
                      padding: "12px",
                      color: meta.featured ? "white" : "#94a3b8",
                      fontWeight: 700,
                      fontSize: "14px",
                      cursor: isLoading ? "wait" : "pointer",
                      opacity: isLoading ? 0.7 : 1,
                      transition: "opacity 0.2s",
                      marginTop: "auto",
                    }}
                  >
                    {isLoading ? "Przekierowuję…" : "Kup teraz"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3 — Transactions */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", marginBottom: "16px" }}>Historia transakcji</h2>

          {transactions.length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "40px", textAlign: "center", color: "#334155", fontSize: "14px" }}>
              Brak transakcji.
            </div>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "160px 120px 100px 1fr", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                {["Data", "Typ", "Kwota", "Opis"].map((h) => (
                  <span key={h} style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
                ))}
              </div>

              {transactions.map((tx, i) => {
                const txType = TX_TYPES[tx.type] || { label: tx.type, emoji: "⚪", color: "#94a3b8" };
                const isPos = tx.amount > 0;
                return (
                  <div key={tx.id} style={{
                    display: "grid",
                    gridTemplateColumns: "160px 120px 100px 1fr",
                    padding: "14px 20px",
                    borderBottom: i < transactions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    alignItems: "center",
                  }}>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      {tx.created_date ? format(new Date(tx.created_date), "dd.MM.yyyy HH:mm") : "—"}
                    </span>
                    <span style={{ fontSize: "13px", color: txType.color, fontWeight: 600 }}>
                      {txType.emoji} {txType.label}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: isPos ? "#4ade80" : "#f87171" }}>
                      {isPos ? "+" : ""}{tx.amount} kr
                    </span>
                    <span style={{ fontSize: "13px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tx.description || "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}