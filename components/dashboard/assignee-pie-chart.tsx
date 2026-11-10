"use client";

import { PieChart as PieIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { ChartRow } from "@/lib/dashboard";

const pct = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartRow }> }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-xs shadow-md">
      <div className="flex items-center gap-2 font-medium">
        <span className="size-2.5 rounded-md" style={{ backgroundColor: row.color }} aria-hidden />
        {row.name}
      </div>
      <p className="text-muted-foreground mt-1 tabular-nums">
        {row.total} ticket{row.total > 1 ? "s" : ""} · {pct(row.percentage)} %
      </p>
    </div>
  );
}

export function AssigneePieChart({ rows, total }: { rows: ChartRow[]; total: number }) {
  const empty =
    total === 0 ? (
      <div className="text-muted-foreground flex min-h-52 flex-col items-center justify-center gap-2 text-center text-sm">
        <PieIcon className="size-8 opacity-40" aria-hidden />
        Aucun ticket pour l&apos;instant : la répartition apparaîtra ici.
      </div>
    ) : undefined;

  const summary = rows.map((r) => `${r.name} : ${pct(r.percentage)} %`).join(", ");

  return (
    <ChartCard
      title="Répartition par assigné"
      description="Part des tickets assignés à chaque membre."
      empty={empty}
      chart={
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative size-48 shrink-0" role="img" aria-label={`Répartition des tickets : ${summary}`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="total"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={88}
                  paddingAngle={rows.length > 1 ? 2 : 0}
                  stroke="var(--card)"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {rows.map((r) => (
                    <Cell key={r.key} fill={r.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tabular-nums">{total}</span>
              <span className="text-muted-foreground text-xs">tickets</span>
            </div>
          </div>
          <ul className="grid w-full min-w-0 flex-1 gap-2">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center gap-2.5 text-sm">
                <span className="size-2.5 shrink-0 rounded-md" style={{ backgroundColor: r.color }} aria-hidden />
                {r.avatar ? <UserAvatar user={r.avatar} size="sm" /> : null}
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                <span className="text-muted-foreground tabular-nums">{r.total}</span>
                <span className="w-16 text-right font-medium whitespace-nowrap tabular-nums">{pct(r.percentage)} %</span>
              </li>
            ))}
          </ul>
        </div>
      }
      table={
        <table className="w-full text-sm">
          <caption className="sr-only">Répartition des tickets par assigné</caption>
          <thead>
            <tr className="text-muted-foreground border-b text-left text-xs">
              <th className="pb-2 font-medium">Assigné</th>
              <th className="pb-2 text-right font-medium">Tickets</th>
              <th className="pb-2 text-right font-medium">Part</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b last:border-0">
                <td className="py-2">{r.name}</td>
                <td className="py-2 text-right tabular-nums">{r.total}</td>
                <td className="py-2 text-right tabular-nums">{pct(r.percentage)} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    />
  );
}
