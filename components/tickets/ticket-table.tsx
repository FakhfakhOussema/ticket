"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { displayName, formatDate, isOverdue, timeAgo } from "@/lib/format";
import { PRIORITY_RANK, STATUS_RANK } from "@/lib/ticket-ui";
import { cn } from "@/lib/utils";
import type { TicketWithPeople } from "@/types";

type SortKey = "title" | "status" | "priority" | "assignee" | "due_date" | "updated_at";
type Sort = { key: SortKey; dir: "asc" | "desc" };

function compare(a: TicketWithPeople, b: TicketWithPeople, key: SortKey): number {
  switch (key) {
    case "title":
      return a.title.localeCompare(b.title, "fr");
    case "status":
      return STATUS_RANK[a.status] - STATUS_RANK[b.status];
    case "priority":
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    case "assignee":
      return displayName(a.assignee).localeCompare(displayName(b.assignee), "fr");
    case "due_date":
      return (a.due_date ?? "").localeCompare(b.due_date ?? "");
    case "updated_at":
      return a.updated_at.localeCompare(b.updated_at);
  }
}

function SortHead({ label, k, sort, onToggle, className }: { label: string; k: SortKey; sort: Sort; onToggle: (k: SortKey) => void; className?: string }) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onToggle(k)}
        className={cn("hover:text-foreground focus-visible:ring-ring -mx-1 flex items-center gap-1 rounded px-1 outline-none focus-visible:ring-2", active && "text-foreground")}
      >
        {label}
        <Icon className={cn("size-3.5", !active && "opacity-50")} aria-hidden />
      </button>
    </TableHead>
  );
}

type Props = {
  tickets: TicketWithPeople[];
  projectId: string;
  onEdit: (ticket: TicketWithPeople) => void;
  onDelete: (ticket: TicketWithPeople) => void;
  onAssignSelf?: (ticket: TicketWithPeople) => void;
};

export function TicketTable({ tickets, projectId, onEdit, onDelete, onAssignSelf }: Props) {
  const [sort, setSort] = useState<Sort>({ key: "updated_at", dir: "desc" });

  const sorted = useMemo(() => {
    const out = [...tickets].sort((a, b) => {
      // Les dates d'échéance vides vont toujours en dernier
      if (sort.key === "due_date") {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
      }
      return compare(a, b, sort.key) * (sort.dir === "asc" ? 1 : -1);
    });
    return out;
  }, [tickets, sort]);

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "updated_at" ? "desc" : "asc" }));

  return (
    <div className="bg-card overflow-hidden rounded-2xl border shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <SortHead label="Titre" k="title" sort={sort} onToggle={toggle} className="min-w-56" />
            <SortHead label="Statut" k="status" sort={sort} onToggle={toggle} />
            <SortHead label="Priorité" k="priority" sort={sort} onToggle={toggle} />
            <SortHead label="Assigné" k="assignee" sort={sort} onToggle={toggle} className="hidden md:table-cell" />
            <SortHead label="Échéance" k="due_date" sort={sort} onToggle={toggle} className="hidden sm:table-cell" />
            <SortHead label="Mis à jour" k="updated_at" sort={sort} onToggle={toggle} className="hidden lg:table-cell" />
            <TableHead className="w-10">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((t) => {
            const late = isOverdue(t.due_date, t.status);
            return (
              <TableRow key={t.id}>
                <TableCell className="max-w-80 font-medium">
                  <Link href={`/projets/${projectId}/tickets/${t.id}`} className="hover:text-primary block truncate rounded outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {t.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={t.priority} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="flex items-center gap-2">
                    <UserAvatar user={t.assignee} size="sm" />
                    <span className={cn("truncate", !t.assignee && "text-muted-foreground")}>{displayName(t.assignee)}</span>
                    {!t.assignee && onAssignSelf ? (
                      <button
                        type="button"
                        onClick={() => onAssignSelf(t)}
                        className="text-primary hover:bg-primary/10 focus-visible:ring-ring rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap outline-none focus-visible:ring-2"
                      >
                        M&apos;assigner
                      </button>
                    ) : null}
                  </span>
                </TableCell>
                <TableCell className={cn("hidden whitespace-nowrap tabular-nums sm:table-cell", late ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground")}>
                  {t.due_date ? formatDate(t.due_date) : "—"}
                  {late ? <span className="sr-only"> (en retard)</span> : null}
                </TableCell>
                <TableCell className="text-muted-foreground hidden whitespace-nowrap lg:table-cell">{timeAgo(t.updated_at)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions pour « ${t.title} »`} />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!t.assignee && onAssignSelf ? (
                        <DropdownMenuItem onClick={() => onAssignSelf(t)}>
                          <UserPlus /> M&apos;assigner ce ticket
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem onClick={() => onEdit(t)}>
                        <Pencil /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete(t)}>
                        <Trash2 /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
