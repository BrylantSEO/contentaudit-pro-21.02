import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PageMeta from "../components/layout/PageMeta";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Coins, BarChart2, Check } from "lucide-react";

const planLabels = {
  free: "Darmowy",
  starter: "Starter",
  pro: "Pro",
  agency: "Agency",
};

const planColors = {
  free: "bg-slate-100 text-slate-700",
  starter: "bg-blue-100 text-blue-700",
  pro: "bg-indigo-100 text-indigo-700",
  agency: "bg-violet-100 text-violet-700",
};

export default function Settings() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profiles } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const profile = profiles?.[0];

  return (
    <div className="space-y-8 max-w-2xl">
      <PageMeta title="Ustawienia — ContentAudit Pro" />
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Ustawienia
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Zarządzaj swoim kontem
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
              <User className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user?.full_name || "—"}</p>
              <p className="text-sm text-slate-500">{user?.email || "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
              <Shield className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Plan</p>
                <Badge className={`mt-1 ${planColors[profile?.plan] || planColors.free}`}>
                  {planLabels[profile?.plan] || "Darmowy"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
              <Coins className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Kredyty</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{profile?.credits_balance ?? 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}