import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageMeta from "../components/layout/PageMeta";
import { toast } from "sonner";
import { Plus, Ticket, UserPlus, Copy, Trash2 } from "lucide-react";

export default function AdminCredits() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const isAdmin = user?.role === "admin";

  if (user && !isAdmin) {
    return (
      <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#f87171", fontSize: "16px", fontWeight: 600 }}>Brak dostępu — wymagane uprawnienia admina.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", padding: "40px 24px", fontFamily: "Inter, sans-serif" }}>
      <PageMeta title="Zarządzanie kredytami — Admin" />
      <div className="max-w-3xl mx-auto space-y-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#f8fafc" }}>
            Zarządzanie kredytami
          </h1>
          <p className="text-sm mt-1" style={{ color: "#475569" }}>
            Przyznawaj kredyty ręcznie lub twórz kody promocyjne
          </p>
        </div>

        <GrantCreditsSection />
        <PromoCodesSection queryClient={queryClient} />
      </div>
    </div>
  );
}

/* ─── Manual credit grant ──────────────────────────────────────────── */
function GrantCreditsSection() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGrant = async () => {
    if (!email || !amount) return;
    setLoading(true);
    const res = await base44.functions.invoke("adminGrantCredits", {
      user_email: email.trim(),
      amount: Number(amount),
      description: desc || undefined,
    });
    setLoading(false);
    if (res.data?.success) {
      toast.success(`Przyznano ${amount} kredytów dla ${email}`);
      setEmail("");
      setAmount("");
      setDesc("");
    } else {
      toast.error(res.data?.error || "Błąd");
    }
  };

  return (
    <div style={cardStyle}>
      <div className="flex items-center gap-3 mb-5">
        <div style={{ background: "rgba(99,102,241,0.15)", borderRadius: "10px", padding: "8px" }}>
          <UserPlus style={{ width: "16px", height: "16px", color: "#a5b4fc" }} />
        </div>
        <p style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>Przyznaj kredyty ręcznie</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input
          placeholder="Email użytkownika"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Liczba kredytów"
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={inputStyle}
        />
      </div>
      <input
        placeholder="Opis (opcjonalny)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        style={{ ...inputStyle, marginBottom: "12px" }}
      />
      <button onClick={handleGrant} disabled={loading || !email || !amount} style={btnPrimary(loading || !email || !amount)}>
        {loading ? "Przyznawanie…" : "Przyznaj kredyty"}
      </button>
    </div>
  );
}

/* ─── Promo codes management ───────────────────────────────────────── */
function PromoCodesSection({ queryClient }) {
  const [code, setCode] = useState("");
  const [credits, setCredits] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [creating, setCreating] = useState(false);

  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ["promoCodes"],
    queryFn: () => base44.entities.PromoCode.list("-created_date", 50),
    initialData: [],
  });

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "CAP-";
    for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
    setCode(result);
  };

  const handleCreate = async () => {
    if (!code || !credits) return;
    setCreating(true);
    await base44.entities.PromoCode.create({
      code: code.trim().toUpperCase(),
      credits: Number(credits),
      max_uses: Number(maxUses) || 1,
      used_count: 0,
      is_active: true,
      used_by: [],
    });
    setCreating(false);
    toast.success(`Kod ${code.toUpperCase()} utworzony!`);
    setCode("");
    setCredits("");
    setMaxUses("1");
    queryClient.invalidateQueries({ queryKey: ["promoCodes"] });
  };

  const toggleCode = async (promo) => {
    await base44.entities.PromoCode.update(promo.id, { is_active: !promo.is_active });
    queryClient.invalidateQueries({ queryKey: ["promoCodes"] });
  };

  const deleteCode = async (promo) => {
    await base44.entities.PromoCode.delete(promo.id);
    queryClient.invalidateQueries({ queryKey: ["promoCodes"] });
    toast.success("Kod usunięty");
  };

  const copyCode = (c) => {
    navigator.clipboard.writeText(c);
    toast.success("Skopiowano kod");
  };

  return (
    <div style={cardStyle}>
      <div className="flex items-center gap-3 mb-5">
        <div style={{ background: "rgba(249,115,22,0.15)", borderRadius: "10px", padding: "8px" }}>
          <Ticket style={{ width: "16px", height: "16px", color: "#f97316" }} />
        </div>
        <p style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>Kody promocyjne</p>
      </div>

      {/* Create form */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div className="relative">
          <input
            placeholder="Kod (np. CAP-ABC123)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            style={inputStyle}
          />
          <button
            onClick={generateCode}
            style={{
              position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "6px",
              padding: "4px 8px", color: "#94a3b8", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}
          >
            Generuj
          </button>
        </div>
        <input
          placeholder="Kredyty"
          type="number"
          min={1}
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Maks. użyć"
          type="number"
          min={1}
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          style={inputStyle}
        />
      </div>
      <button onClick={handleCreate} disabled={creating || !code || !credits} style={btnPrimary(creating || !code || !credits)}>
        <Plus style={{ width: "14px", height: "14px" }} />
        {creating ? "Tworzenie…" : "Utwórz kod"}
      </button>

      {/* List */}
      <div className="mt-6 space-y-2">
        {isLoading ? (
          <p style={{ color: "#475569", fontSize: "13px" }}>Ładowanie…</p>
        ) : promoCodes.length === 0 ? (
          <p style={{ color: "#334155", fontSize: "13px" }}>Brak kodów promocyjnych.</p>
        ) : (
          promoCodes.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px", flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace", fontWeight: 700, fontSize: "14px",
                  color: p.is_active ? "#f8fafc" : "#475569",
                  textDecoration: p.is_active ? "none" : "line-through",
                }}
              >
                {p.code}
              </span>
              <span style={{ fontSize: "12px", color: "#6366f1", fontWeight: 600 }}>
                {p.credits} kr
              </span>
              <span style={{ fontSize: "11px", color: "#475569" }}>
                {p.used_count || 0}/{p.max_uses || "∞"} użyć
              </span>
              <span
                style={{
                  fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  padding: "2px 8px", borderRadius: "999px",
                  background: p.is_active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                  color: p.is_active ? "#4ade80" : "#f87171",
                }}
              >
                {p.is_active ? "Aktywny" : "Wyłączony"}
              </span>

              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => copyCode(p.code)} style={iconBtn} title="Kopiuj kod">
                  <Copy style={{ width: "13px", height: "13px" }} />
                </button>
                <button onClick={() => toggleCode(p)} style={iconBtn} title={p.is_active ? "Wyłącz" : "Włącz"}>
                  <span style={{ fontSize: "11px", fontWeight: 600 }}>{p.is_active ? "Wyłącz" : "Włącz"}</span>
                </button>
                <button onClick={() => deleteCode(p)} style={{ ...iconBtn, color: "#f87171" }} title="Usuń">
                  <Trash2 style={{ width: "13px", height: "13px" }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────── */
const cardStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
  padding: "24px",
};

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  color: "#e2e8f0",
  padding: "10px 14px",
  fontSize: "13px",
  width: "100%",
  outline: "none",
  fontFamily: "Inter, sans-serif",
};

const btnPrimary = (disabled) => ({
  display: "flex", alignItems: "center", gap: "6px",
  background: disabled ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
  color: "white", borderRadius: "12px", padding: "10px 20px",
  fontWeight: 700, fontSize: "13px", border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1, transition: "opacity 0.2s",
});

const iconBtn = {
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px", padding: "6px 8px", color: "#94a3b8",
  cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
};