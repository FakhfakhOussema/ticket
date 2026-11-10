"use client";

import { BarChart3, Table2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  chart: ReactNode;
  table: ReactNode;
  empty?: ReactNode;
};

/** Carte de graphique avec bascule Graphique / Tableau (équivalent accessible des mêmes données). */
export function ChartCard({ title, description, chart, table, empty }: Props) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <section className="bg-card flex flex-col rounded-2xl border p-5 shadow-xs">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {empty ? null : (
          <div role="group" aria-label="Mode d'affichage" className="bg-muted flex shrink-0 rounded-lg p-0.5">
            {(
              [
                ["chart", "Graphique", BarChart3],
                ["table", "Tableau", Table2],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={cn(
                  "focus-visible:ring-ring flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition outline-none focus-visible:ring-2",
                  view === value ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
                <span className="sr-only sm:hidden">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {empty ?? (view === "chart" ? chart : table)}
    </section>
  );
}
