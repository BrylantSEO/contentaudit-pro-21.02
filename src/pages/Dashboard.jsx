import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Coins, Crown, BarChart3, TrendingUp } from "lucide-react";
import StatsCard from "../components/dashboard/StatsCard";
import TransactionList from "../components/dashboard/TransactionList";
import { Skeleton } from "@/components/ui/skeleton";

const planLabels = {
  free: "Darmowy",
  starter: "Starter",
  pro: "Pro",
  agency: "Agency",
};

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profiles, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["transactions", profiles?.[0]?.id],
    queryFn: () => base44.entities.CreditTransaction.filter(
      { user_id: profiles[0].id },
      "-created_date",
      20
    ),
    enabled: !!profiles?.[0]?.id,
  });

  const profile = profiles?.[0];
  const txList = transactions || [];
  const totalSpent = txList.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalPurchased = txList.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);

  const isLoading = profileLoading || !user;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Witaj{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Oto przegląd Twojego konta ContentAudit Pro
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            icon={Coins}
            label="Saldo kredytów"
            value={profile?.credits_balance ?? 0}
            sublabel="Dostępnych do wykorzystania"
            gradient="bg-gradient-to-br from-indigo-600 to-violet-600"
          />
          <StatsCard
            icon={Crown}
            label="Aktualny plan"
            value={planLabels[profile?.plan] || "Darmowy"}
            sublabel="Twój aktywny plan"
            gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          />
          <StatsCard
            icon={TrendingUp}
            label="Zakupione"
            value={totalPurchased}
            sublabel="Łączna liczba kredytów"
            gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          />
          <StatsCard
            icon={BarChart3}
            label="Wykorzystane"
            value={totalSpent}
            sublabel="Kredyty zużyte"
            gradient="bg-gradient-to-br from-rose-500 to-pink-500"
          />
        </div>
      )}

      {/* Transactions */}
      {txLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <TransactionList transactions={txList} limit={10} />
      )}
    </div>
  );
}