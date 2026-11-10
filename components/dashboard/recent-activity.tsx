import { History } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/badges";
import { UserAvatar } from "@/components/shared/user-avatar";
import { displayName, timeAgo } from "@/lib/format";
import type { TicketWithPeople } from "@/types";

export function RecentActivity({ projectId, tickets }: { projectId: string; tickets: TicketWithPeople[] }) {
  return (
    <section className="bg-card rounded-2xl border p-5 shadow-xs">
      <div className="mb-3">
        <h2 className="font-semibold">Activité récente</h2>
        <p className="text-muted-foreground text-sm">Derniers tickets créés ou modifiés.</p>
      </div>

      {tickets.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center text-sm">
          <History className="size-8 opacity-40" aria-hidden />
          Aucune activité pour l&apos;instant.
        </div>
      ) : (
        <ul className="grid gap-1">
          {tickets.map((t) => {
            const created = Math.abs(new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) < 2000;
            const actor = created ? t.creator : (t.assignee ?? t.creator);
            return (
              <li key={t.id}>
                <Link
                  href={`/projets/${projectId}/tickets/${t.id}`}
                  className="hover:bg-muted/60 focus-visible:ring-ring -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors outline-none focus-visible:ring-2"
                >
                  <UserAvatar user={actor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {created ? `Créé par ${displayName(t.creator)}` : "Modifié"} · {timeAgo(t.updated_at)}
                    </p>
                  </div>
                  <StatusBadge status={t.status} className="hidden sm:inline-flex" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
