"use client";

import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { STATUS_LABELS } from "@/lib/constants";
import type { ChartRow } from "@/lib/dashboard";
import { STATUS_STYLES } from "@/lib/ticket-ui";
import { TICKET_STATUSES } from "@/lib/constants";

function BarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartRow }> }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-popover text-popover-foreground min-w-40 rounded-lg border px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{row.name}</p>
      <ul className="mt-1.5 grid gap-1">
        {TICKET_STATUSES.map((s) => (
          <li key={s} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: STATUS_STYLES[s].chart }} aria-hidden />
            <span className="text-muted-foreground flex-1">{STATUS_LABELS[s]}</span>
            <span className="font-medium tabular-nums">{row[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StatusBarChart({ rows }: { rows: ChartRow[] }) {
  const height = Math.max(180, rows.length * 48 + 40);
  const empty =
    rows.length === 0 ? (
      <div className="text-muted-foreground flex min-h-52 flex-col items-center justify-center gap-2 text-center text-sm">
        <BarChart3 className="size-8 opacity-40" aria-hidden />
        Aucun ticket pour l&apos;instant : les statuts par membre apparaîtront ici.
      </div>
    ) : undefined;

  return (
    <ChartCard
      title="Statuts par membre"
      description="Nombre de tickets de chaque membre, par statut."
      empty={empty}
      chart={
        <div>
          <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
            {TICKET_STATUSES.map((s) => (
              <li key={s} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: STATUS_STYLES[s].chart }} aria-hidden />
                {STATUS_LABELS[s]}
              </li>
            ))}
          </ul>
          <div
            style={{ height }}
            role="img"
            aria-label={`Tickets par statut et par membre : ${rows
              .map((r) => `${r.name} ${r.todo} à faire, ${r.in_progress} en cours, ${r.in_review} en revue, ${r.done} terminés`)
              .join(" ; ")}`}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }} barCategoryGap={14}>
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={116}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--foreground)", fontSize: 12 }}
                  tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                {TICKET_STATUSES.map((s, i) => (
                  <Bar
                    key={s}
                    dataKey={s}
                    name={STATUS_LABELS[s]}
                    stackId="status"
                    fill={STATUS_STYLES[s].chart}
                    stroke="var(--card)"
                    strokeWidth={2}
                    radius={i === TICKET_STATUSES.length - 1 ? [0, 4, 4, 0] : 0}
                    isAnimationActive={false}
                    maxBarSize={22}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      }
      table={
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Tickets par statut et par membre</caption>
            <thead>
              <tr className="text-muted-foreground border-b text-left text-xs">
                <th className="pb-2 font-medium">Membre</th>
                {TICKET_STATUSES.map((s) => (
                  <th key={s} className="pb-2 text-right font-medium whitespace-nowrap">
                    {STATUS_LABELS[s]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b last:border-0">
                  <td className="py-2">{r.name}</td>
                  {TICKET_STATUSES.map((s) => (
                    <td key={s} className="py-2 text-right tabular-nums">
                      {r[s]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    />
  );
}
