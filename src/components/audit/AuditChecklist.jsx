import React, { useState, useEffect, useCallback } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

const PRIORITY_SECTIONS = [
  { key: "critical", label: "Krytyczne", icon: AlertCircle, color: "text-red-600", badgeCls: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 border-0" },
  { key: "important", label: "Ważne", icon: AlertTriangle, color: "text-amber-600", badgeCls: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 border-0" },
  { key: "optional", label: "Opcjonalne", icon: CheckCircle2, color: "text-green-600", badgeCls: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 border-0" },
];

function useChecklistState(jobId, items) {
  const storageKey = `audit_checklist_${jobId}`;

  const [checked, setChecked] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {}
  }, [checked, storageKey]);

  const toggle = useCallback((id) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const totalItems = items.length;
  const completedItems = items.filter(item => checked[item.id]).length;
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return { checked, toggle, progressPct, completedItems, totalItems };
}

function ChecklistItemRow({ item, isChecked, onToggle }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`py-3 px-4 rounded-lg transition-all ${isChecked ? "opacity-60" : ""} hover:bg-muted/50`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isChecked}
          onCheckedChange={() => onToggle(item.id)}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {item.title}
          </p>
          {(item.why || item.howToFix) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 mt-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showDetails ? "Zwiń" : "Szczegóły"}
            </button>
          )}
          {showDetails && (
            <div className="mt-2 space-y-2 text-xs text-muted-foreground">
              {item.why && (
                <div className="p-2 rounded bg-muted/60">
                  <span className="font-semibold text-foreground">Dlaczego?</span> {item.why}
                </div>
              )}
              {item.howToFix && (
                <div className="p-2 rounded bg-muted/60 whitespace-pre-line">
                  <span className="font-semibold text-foreground">Jak naprawić:</span>{"\n"}{item.howToFix}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuditChecklist({ checklistItems = [], jobId = "" }) {
  const { checked, toggle, progressPct, completedItems, totalItems } = useChecklistState(jobId, checklistItems);

  const grouped = {
    critical: checklistItems.filter(i => i.priority === "critical"),
    important: checklistItems.filter(i => i.priority === "important"),
    optional: checklistItems.filter(i => i.priority === "optional"),
  };

  const defaultOpen = grouped.critical.length > 0 ? ["critical"] : ["important"];

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card className="border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">Postęp</span>
            <span className="text-sm font-bold text-foreground tabular-nums">{completedItems}/{totalItems} <span className="text-muted-foreground font-normal">({progressPct}%)</span></span>
          </div>
          <Progress value={progressPct} className="h-2.5" />
        </CardContent>
      </Card>

      {/* Grouped items */}
      {totalItems === 0 ? (
        <Card className="border bg-card">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Brak elementów checklisty w raporcie.</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={defaultOpen}>
          {PRIORITY_SECTIONS.map(section => {
            const items = grouped[section.key];
            if (items.length === 0) return null;
            const Icon = section.icon;
            const sectionCompleted = items.filter(i => checked[i.id]).length;

            return (
              <AccordionItem key={section.key} value={section.key} className="border rounded-lg mb-3 overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${section.color}`} />
                    <span className="text-sm font-semibold text-foreground">{section.label}</span>
                    <Badge className={section.badgeCls + " text-[11px] px-2 py-0"}>
                      {sectionCompleted}/{items.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-2">
                  <div className="space-y-1">
                    {items.map(item => (
                      <ChecklistItemRow
                        key={item.id}
                        item={item}
                        isChecked={!!checked[item.id]}
                        onToggle={toggle}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
