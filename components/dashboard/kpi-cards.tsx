import { AlertTriangle, CheckCircle2, ListChecks, Loader, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectDashboard } from "@/types";

type Kpi = {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  tone: string;
};

export function KpiCards({ kpi }: { kpi: ProjectDashboard["kpi"] }) {
  const items: Kpi[] = [
    {
      label: "Total des tickets",
      value: kpi.total,
      hint: `${kpi.todo} à faire · ${kpi.in_review} en revue`,
      icon: ListChecks,
      tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
    },
    {
      label: "En cours",
      value: kpi.in_progress,
      hint: kpi.total ? `${Math.round((kpi.in_progress / kpi.total) * 100)} % du total` : "Aucun ticket",
      icon: Loader,
      tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
    },
    {
      label: "Terminés",
      value: kpi.done,
      hint: kpi.total ? `${Math.round((kpi.done / kpi.total) * 100)} % du total` : "Aucun ticket",
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
      label: "En retard",
      value: kpi.overdue,
      hint: kpi.overdue ? "Échéance dépassée" : "Rien en retard",
      icon: AlertTriangle,
      tone: kpi.overdue
        ? "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300"
        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-card flex items-start justify-between gap-3 rounded-2xl border p-4 shadow-xs sm:p-5">
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">{item.label}</p>
            <p className={cn("mt-1 text-3xl font-semibold tracking-tight tabular-nums", item.label === "En retard" && item.value > 0 && "text-red-600 dark:text-red-400")}>
              {item.value}
            </p>
            <p className="text-muted-foreground mt-1 truncate text-xs">{item.hint}</p>
          </div>
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", item.tone)}>
            <item.icon className="size-5" aria-hidden />
          </span>
        </div>
      ))}
    </div>
  );
}
