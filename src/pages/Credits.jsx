import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PackageCard from "../components/credits/PackageCard";
import TransactionList from "../components/dashboard/TransactionList";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Credits() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: packages, isLoading: pkgLoading } = useQuery({
    queryKey: ["creditPackages"],
    queryFn: () => base44.entities.CreditPackage.filter({ is_active: true }),
  });

  const { data: profiles } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["transactions", profiles?.[0]?.id],
    queryFn: () => base44.entities.CreditTransaction.filter(
      { user_id: profiles[0].id },
      "-created_date",
      50
    ),
    enabled: !!profiles?.[0]?.id,
  });

  const handleBuy = (pkg) => {
    toast.info(`Zakup pakietu "${pkg.name}" — integracja płatności Stripe będzie dostępna wkrótce.`);
  };

  const sortOrder = { Starter: 1, Pro: 2, Agency: 3 };
  const sortedPackages = (packages || []).sort((a, b) => (sortOrder[a.name] || 99) - (sortOrder[b.name] || 99));

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Kredyty
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Doładuj swoje konto i korzystaj z ContentAudit Pro
        </p>
      </div>

      {/* Packages */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-5">Dostępne pakiety</h2>
        {pkgLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sortedPackages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} onBuy={handleBuy} />
            ))}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-5">Wszystkie transakcje</h2>
        {txLoading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : (
          <TransactionList transactions={transactions || []} />
        )}
      </div>
    </div>
  );
}