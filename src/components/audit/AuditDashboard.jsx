import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from "recharts";
import BeforeAfterBlock from "./BeforeAfterBlock";

const PRIORITY_CONFIG = {
  critical: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400", label: "Krytyczne" },
  important: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400", label: "Ważne" },
  optional: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800", badge: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400", label: "Opcjonalne" },
};

function ScoreGauge({ score, maxScore = 100 }) {
  const pct = Math.round((score / maxScore) * 100);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  const color = pct > 70 ? "#22c55e" : pct >= 40 ? "#eab308" : "#ef4444";
  const label = pct > 70 ? "Świetna strona!" : pct >= 40 ? "Wymaga poprawek" : "Wymaga dużo pracy";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg className="w-48 h-48 -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} fill="none" className="stroke-muted" strokeWidth="12" />
          <circle
            cx="100" cy="100" r={radius} fill="none"
            stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-extrabold text-foreground tabular-nums">{score}</span>
          <span className="text-sm text-muted-foreground font-medium">/ {maxScore}</span>
        </div>
      </div>
      <p className="mt-2 text-base font-semibold" style={{ color }}>{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">Content Quality Score</p>
    </div>
  );
}

function RadarScoreChart({ radarData }) {
  if (!radarData || radarData.length === 0) return null;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid strokeDasharray="3 3" className="stroke-border" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
          />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PriorityCard({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const config = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.important;
  const Icon = config.icon;

  return (
    <Card className={`${config.bg} ${config.border} border transition-all`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background shadow-sm shrink-0 mt-0.5">
            <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Icon className={`w-4 h-4 ${config.color} shrink-0`} />
              <Badge className={`${config.badge} border-0 text-[11px] px-2 py-0`}>
                {config.label}
              </Badge>
            </div>
            <h4 className="text-sm font-semibold text-foreground leading-snug">{item.title}</h4>
            {item.why && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.why}</p>
            )}
            {item.howToFix && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? "Ukryj instrukcję" : "Jak to naprawić?"}
              </button>
            )}
            {expanded && item.howToFix && (
              <div className="mt-2">
                <BeforeAfterBlock content={item.howToFix} />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AuditDashboard({ cqs, citability, priorities = [], radarData = [] }) {
  const top5 = priorities.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Score + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border bg-card">
          <CardContent className="p-6 flex justify-center">
            <ScoreGauge score={cqs} />
          </CardContent>
        </Card>
        <Card className="border bg-card">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Profil strony</h3>
            <RadarScoreChart radarData={radarData} />
          </CardContent>
        </Card>
      </div>

      {/* Citability */}
      {citability > 0 && (
        <Card className="border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/30">
              <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{citability}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AI Citability Score <span className="text-muted-foreground font-normal">/ 10</span></p>
              <p className="text-xs text-muted-foreground">Prawdopodobieństwo, że AI zacytuje Twoją stronę w odpowiedziach</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 5 priorities */}
      {top5.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">
            Top {top5.length} — co poprawić w pierwszej kolejności
          </h3>
          <div className="space-y-3">
            {top5.map((item, i) => (
              <PriorityCard key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      )}

      {top5.length === 0 && (
        <Card className="border bg-card">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nie znaleziono krytycznych problemów — świetna robota!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}