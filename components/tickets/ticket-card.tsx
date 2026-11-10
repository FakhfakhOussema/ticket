import { CalendarClock, UserPlus } from "lucide-react";
import Link from "next/link";
import { PriorityBadge } from "@/components/shared/badges";
import { UserAvatar } from "@/components/shared/user-avatar";
import { displayName, formatDate, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TicketWithPeople } from "@/types";

type Props = {
  ticket: TicketWithPeople;
  projectId: string;
  overlay?: boolean;
  /** Si fourni et que le ticket n'est pas assigné : affiche le bouton « M'assigner ». */
  onAssignSelf?: () => void;
};

/** Carte Kanban : titre, priorité, assigné, échéance (rouge si dépassée). */
export function TicketCard({ ticket, projectId, overlay, onAssignSelf }: Props) {
  const late = isOverdue(ticket.due_date, ticket.status);
  return (
    <div
      className={cn(
        "bg-card grid gap-2.5 rounded-xl border p-3 text-sm shadow-xs transition-shadow",
        overlay ? "rotate-2 shadow-lg" : "hover:shadow-md",
      )}
    >
      <Link
        href={`/projets/${projectId}/tickets/${ticket.id}`}
        draggable={false}
        className="hover:text-primary focus-visible:ring-ring line-clamp-2 rounded-md font-medium outline-none focus-visible:ring-2"
      >
        {ticket.title}
      </Link>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <PriorityBadge priority={ticket.priority} />
          {ticket.due_date ? (
            <span
              className={cn(
                "flex items-center gap-1 text-xs tabular-nums",
                late ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground",
              )}
            >
              <CalendarClock className="size-3.5" aria-hidden />
              {formatDate(ticket.due_date, "d MMM")}
              {late ? <span className="sr-only"> (en retard)</span> : null}
            </span>
          ) : null}
        </div>
        {ticket.assignee || !onAssignSelf ? (
          <span title={displayName(ticket.assignee)}>
            <UserAvatar user={ticket.assignee} size="sm" />
          </span>
        ) : (
          // Ticket non assigné : un clic suffit pour se l'assigner (sans déclencher le glisser-déposer)
          <button
            type="button"
            onClick={onAssignSelf}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:border-primary hover:text-primary focus-visible:ring-ring inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2"
          >
            <UserPlus className="size-3" aria-hidden /> M&apos;assigner
          </button>
        )}
      </div>
    </div>
  );
}
