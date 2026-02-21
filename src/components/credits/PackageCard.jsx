import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Rocket } from "lucide-react";

const packageStyles = {
  Starter: { icon: Sparkles, gradient: "from-blue-500 to-cyan-500", ring: "ring-blue-100" },
  Pro: { icon: Zap, gradient: "from-indigo-600 to-violet-600", ring: "ring-indigo-100", featured: true },
  Agency: { icon: Rocket, gradient: "from-violet-600 to-fuchsia-600", ring: "ring-violet-100" },
};

export default function PackageCard({ pkg, onBuy }) {
  const style = packageStyles[pkg.name] || packageStyles.Starter;
  const Icon = style.icon;
  const pricePerCredit = (pkg.price_pln / pkg.credits).toFixed(2);

  return (
    <Card
      className={`
        relative overflow-hidden border-0 shadow-sm hover:shadow-lg
        transition-all duration-300 group
        ${style.featured ? "ring-2 ring-indigo-200 scale-[1.02]" : "hover:scale-[1.01]"}
      `}
    >
      {style.featured && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-violet-600" />
      )}

      <div className="p-7">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center mb-5 shadow-sm`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1">{pkg.name}</h3>
        <p className="text-sm text-slate-500 mb-5">
          {pkg.credits} kredytów • {pricePerCredit} zł/kredyt
        </p>

        <div className="mb-6">
          <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{pkg.price_pln}</span>
          <span className="text-lg text-slate-400 ml-1">zł</span>
        </div>

        <Button
          onClick={() => onBuy(pkg)}
          className={`
            w-full h-12 rounded-xl font-semibold text-sm
            bg-gradient-to-r ${style.gradient} text-white
            hover:opacity-90 transition-opacity shadow-sm
          `}
        >
          Kup pakiet
        </Button>
      </div>
    </Card>
  );
}