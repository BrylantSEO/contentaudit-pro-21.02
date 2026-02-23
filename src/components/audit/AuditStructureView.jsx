import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LayoutList } from "lucide-react";

function parseStructureItems(structureMd) {
  if (!structureMd) return [];

  const items = [];
  const lines = structureMd.split("\n");

  for (const line of lines) {
    // Match heading lines: H1, H2, H3, H4 etc.
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const needsFix = /zmień|dodaj|popraw|brakuje|usuń|ZMIENIĆ|❌|✗/i.test(text);
      const isOk = /✅|OK|✓/i.test(text);
      items.push({ level, text, needsFix, isOk, type: "heading" });
      continue;
    }

    // Match table rows with heading suggestions
    const pipeMatch = line.match(/^\|.*\|/);
    if (pipeMatch) {
      const cells = line.split("|").map(c => c.trim()).filter(Boolean);
      if (cells.length >= 2) {
        const tag = cells[0];
        const content = cells.slice(1).join(" — ");
        const levelMatch = tag.match(/H(\d)/i);
        const level = levelMatch ? parseInt(levelMatch[1]) : 2;
        const needsFix = /zmień|dodaj|popraw|brakuje|usuń|ZMIENIĆ|❌|✗/i.test(line);
        const isOk = /✅|OK|✓/i.test(line);
        // Skip separator rows
        if (/^[\-\s:|]+$/.test(cells.join(""))) continue;
        // Skip header rows
        if (/tag|nagłówek|heading/i.test(cells[0]) && /treść|content|sugest/i.test(cells[1])) continue;
        items.push({ level, text: `${tag}: ${content}`, needsFix, isOk, type: "table-row" });
      }
      continue;
    }

    // Match list items with headings
    const listMatch = line.match(/^[\s]*[-*]\s+(H\d.+)/i);
    if (listMatch) {
      const text = listMatch[1].trim();
      const levelMatch = text.match(/H(\d)/i);
      const level = levelMatch ? parseInt(levelMatch[1]) : 2;
      const needsFix = /zmień|dodaj|popraw|brakuje|usuń|ZMIENIĆ|❌|✗/i.test(text);
      const isOk = /✅|OK|✓/i.test(text);
      items.push({ level, text, needsFix, isOk, type: "list" });
    }
  }

  return items;
}

function StructureItem({ item }) {
  const indent = Math.max(0, item.level - 1) * 24;
  const fontSizes = { 1: "text-base font-bold", 2: "text-sm font-semibold", 3: "text-sm font-medium", 4: "text-xs font-medium", 5: "text-xs", 6: "text-xs" };
  const sizeCls = fontSizes[item.level] || fontSizes[3];

  return (
    <div
      className={`flex items-center gap-2 py-2 px-3 rounded-md transition-colors hover:bg-muted/50 ${item.needsFix ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}
      style={{ paddingLeft: `${12 + indent}px` }}
    >
      {item.needsFix ? (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 border-0 text-[10px] px-1.5 py-0 shrink-0">
          POPRAW
        </Badge>
      ) : item.isOk ? (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 border-0 text-[10px] px-1.5 py-0 shrink-0">
          OK
        </Badge>
      ) : (
        <div className="w-12 shrink-0" />
      )}
      <span className={`${sizeCls} text-foreground leading-snug`}>
        {item.text.replace(/✅|❌|✓|✗|OK\s*/gi, "").trim()}
      </span>
    </div>
  );
}

export default function AuditStructureView({ structureMd }) {
  const [filterOnlyFix, setFilterOnlyFix] = useState(false);

  const items = useMemo(() => parseStructureItems(structureMd), [structureMd]);

  const displayed = filterOnlyFix ? items.filter(i => i.needsFix) : items;

  if (!structureMd || items.length === 0) {
    return (
      <Card className="border bg-card">
        <CardContent className="p-8 text-center">
          <LayoutList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Brak proponowanej struktury w raporcie.</p>
        </CardContent>
      </Card>
    );
  }

  const fixCount = items.filter(i => i.needsFix).length;

  return (
    <div className="space-y-4">
      {/* Filter toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            id="filter-fix"
            checked={filterOnlyFix}
            onCheckedChange={setFilterOnlyFix}
          />
          <Label htmlFor="filter-fix" className="text-sm text-muted-foreground cursor-pointer">
            Pokaż tylko do poprawy
          </Label>
          {fixCount > 0 && (
            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 border-0 text-[11px] px-2 py-0">
              {fixCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Structure list */}
      <Card className="border bg-card">
        <CardContent className="p-4">
          <div className="space-y-0.5">
            {displayed.map((item, i) => (
              <StructureItem key={i} item={item} />
            ))}
            {displayed.length === 0 && filterOnlyFix && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Wszystkie nagłówki wyglądają dobrze!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
