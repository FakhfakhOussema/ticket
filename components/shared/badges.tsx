import { PRIORITY_LABELS, STATUS_LABELS, ROLE_LABELS } from "@/lib/constants";
import { PRIORITY_STYLES, STATUS_STYLES } from "@/lib/ticket-ui";
import { cn } from "@/lib/utils";
import type { ProjectRole, TicketPriority, TicketStatus } from "@/types";

const base = "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={cn(base, s.badge, className)}>
      <span className={cn("size-1.5 rounded-md", s.dot)} aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
  iconOnly = false,
}: {
  priority: TicketPriority;
  className?: string;
  iconOnly?: boolean;
}) {
  const p = PRIORITY_STYLES[priority];
  const Icon = p.icon;
  return (
    <span className={cn(base, p.badge, iconOnly && "px-1.5", className)} title={PRIORITY_LABELS[priority]}>
      <Icon className="size-3" aria-hidden />
      {iconOnly ? <span className="sr-only">{PRIORITY_LABELS[priority]}</span> : PRIORITY_LABELS[priority]}
    </span>
  );
}

const ROLE_STYLES: Record<ProjectRole, string> = {
  owner: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  admin: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  member: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function RoleBadge({ role, className }: { role: ProjectRole; className?: string }) {
  return <span className={cn(base, ROLE_STYLES[role], className)}>{ROLE_LABELS[role]}</span>;
}
