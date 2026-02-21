import React from "react";
import { Card } from "@/components/ui/card";

export default function StatsCard({ icon: Icon, label, value, sublabel, gradient }) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className={`absolute inset-0 opacity-[0.04] ${gradient}`} />
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">{label}</p>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
            {sublabel && (
              <p className="text-xs text-slate-500 mt-1.5">{sublabel}</p>
            )}
          </div>
          <div className={`w-11 h-11 rounded-2xl ${gradient} flex items-center justify-center shadow-sm`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </Card>
  );
}