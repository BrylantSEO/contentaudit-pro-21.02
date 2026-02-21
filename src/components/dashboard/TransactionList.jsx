import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const typeConfig = {
  purchase: { label: "Zakup", icon: ArrowUpRight, color: "text-emerald-600", bg: "bg-emerald-50" },
  spend: { label: "Wykorzystanie", icon: ArrowDownRight, color: "text-rose-500", bg: "bg-rose-50" },
  refund: { label: "Zwrot", icon: RotateCcw, color: "text-amber-600", bg: "bg-amber-50" },
};

export default function TransactionList({ transactions, limit }) {
  const displayed = limit ? transactions.slice(0, limit) : transactions;

  if (displayed.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">Historia transakcji</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 text-center py-8">Brak transakcji</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800">Historia transakcji</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {displayed.map((tx) => {
            const config = typeConfig[tx.type] || typeConfig.spend;
            const Icon = config.icon;
            return (
              <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors">
                <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{tx.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {tx.created_date ? format(new Date(tx.created_date), "d MMM yyyy, HH:mm", { locale: pl }) : ""}
                  </p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${tx.amount >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                  {tx.amount >= 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}