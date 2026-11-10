import { CalendarClock, PartyPopper } from "lucide-react";
import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { formatDate, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TicketWithPeople } from "@/types";

export function MyTasks({ projectId, tickets }: { projectId: string; tickets: TicketWithPeople[] }) {
  return (
    <section className="bg-card rounded-2xl border p-5 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Mes tâches</h2>
          <p className="text-muted-foreground text-sm">Tickets qui vous sont assignés, par échéance.</p>
        </div>
        {tickets.length > 0 ? (
          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums">{tickets.length}</span>
        ) : null}
      </div>

      {tickets.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center text-sm">
          <PartyPopper className="size-8 opacity-40" aria-hidden />
          Aucune tâche en cours. Profitez-en !
        </div>
      ) : (
        <ul className="divide-y">
          {tickets.map((t) => {
            const late = isOverdue(t.due_date, t.status);
            return (
              <li key={t.id}>
                <Link
                  href={`/projets/${projectId}/tickets/${t.id}`}
                  className="hover:bg-muted/60 focus-visible:ring-ring -mx-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-2.5 transition-colors outline-none focus-visible:ring-2"
                >
                  <span className="min-w-0 flex-1 basis-48 truncate text-sm font-medium">{t.title}</span>
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} iconOnly />
                  <span
                    className={cn(
                      "flex w-24 items-center justify-end gap-1 text-xs tabular-nums",
                      late ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground",
                    )}
                  >
                    <CalendarClock className="size-3.5" aria-hidden />
                    {t.due_date ? formatDate(t.due_date, "d MMM") : "Sans échéance"}
                    {late ? <span className="sr-only"> (en retard)</span> : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
