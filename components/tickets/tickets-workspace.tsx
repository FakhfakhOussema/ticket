"use client";

import { KanbanSquare, List, Plus, Search, SearchX, Ticket as TicketIcon, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { DeleteTicketDialog } from "@/components/tickets/delete-ticket-dialog";
import { KanbanBoard } from "@/components/tickets/kanban-board";
import { TicketFormSheet } from "@/components/tickets/ticket-form-sheet";
import { TicketTable } from "@/components/tickets/ticket-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { moveTicket, updateTicket } from "@/lib/actions/tickets";
import { PRIORITY_LABELS, STATUS_LABELS, TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/constants";
import { displayName } from "@/lib/format";
import { useProjectTickets } from "@/lib/hooks/use-project-tickets";
import type { ProfileSummary, TicketStatus, TicketWithPeople } from "@/types";

type Props = {
  projectId: string;
  initialTickets: TicketWithPeople[];
  members: ProfileSummary[];
  currentUserId: string;
};

const ALL = "all";
const UNASSIGNED = "unassigned";

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? ALL)} items={options}>
      <SelectTrigger aria-label={label} className="h-9 min-w-36 bg-background">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TicketsWorkspace({ projectId, initialTickets, members, currentUserId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tickets, setTickets, upsert, remove } = useProjectTickets(projectId, initialTickets, members);
  const [, startTransition] = useTransition();

  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [assignee, setAssignee] = useState(ALL);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<TicketWithPeople | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TicketStatus>("todo");
  const [deleting, setDeleting] = useState<TicketWithPeople | null>(null);

  // « Nouveau ticket » depuis l'en-tête : /tickets?nouveau=1 ouvre la feuille de création.
  const wantsNew = searchParams.get("nouveau") === "1";
  const sheetVisible = sheetOpen || wantsNew;
  const handleSheetChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      if (wantsNew) router.replace(pathname, { scroll: false });
      setEditing(null);
    }
  };

  const openCreate = (s: TicketStatus = "todo") => {
    setEditing(null);
    setDefaultStatus(s);
    setSheetOpen(true);
  };
  const openEdit = (t: TicketWithPeople) => {
    setEditing(t);
    setSheetOpen(true);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      if (view === "list" && status !== ALL && t.status !== status) return false;
      if (priority !== ALL && t.priority !== priority) return false;
      if (assignee === UNASSIGNED ? t.assignee_id !== null : assignee !== ALL && t.assignee_id !== assignee) return false;
      if (q && !t.title.toLowerCase().includes(q) && !(t.description ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tickets, query, status, priority, assignee, view]);

  const hasFilters = query !== "" || priority !== ALL || assignee !== ALL || (view === "list" && status !== ALL);
  const resetFilters = () => {
    setQuery("");
    setStatus(ALL);
    setPriority(ALL);
    setAssignee(ALL);
  };

  // Déplacement Kanban : mise à jour optimiste, retour arrière en cas d'erreur.
  const handleMove = (ticketId: string, newStatus: TicketStatus, position: number) => {
    const snapshot = tickets;
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus, position } : t)));
    startTransition(async () => {
      const result = await moveTicket(ticketId, newStatus, position);
      if (!result.ok) {
        setTickets(snapshot);
        toast.error(result.error);
      }
    });
  };

  // « M'assigner » : mise à jour optimiste, retour arrière en cas d'erreur.
  const handleAssignSelf = (ticket: TicketWithPeople) => {
    const me = members.find((m) => m.id === currentUserId);
    if (!me) return;
    const snapshot = tickets;
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, assignee_id: me.id, assignee: me } : t)));
    startTransition(async () => {
      const result = await updateTicket(ticket.id, { assignee_id: me.id });
      if (!result.ok) {
        setTickets(snapshot);
        return void toast.error(result.error);
      }
      toast.success("Ticket assigné à vous");
    });
  };

  return (
    <>
      <PageHeader
        title="Tickets"
        description={`${tickets.length} ticket${tickets.length > 1 ? "s" : ""} dans ce projet.`}
        actions={
          <Button onClick={() => openCreate()}>
            <Plus className="size-4" aria-hidden /> Nouveau ticket
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "list")}>
          <TabsList>
            <TabsTrigger value="kanban">
              <KanbanSquare className="size-4" aria-hidden /> Kanban
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="size-4" aria-hidden /> Liste
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un ticket…"
            aria-label="Rechercher dans les tickets"
            className="h-9 bg-background pl-8"
          />
        </div>

        {view === "list" ? (
          <FilterSelect
            label="Filtrer par statut"
            value={status}
            onChange={setStatus}
            options={[{ value: ALL, label: "Tous les statuts" }, ...TICKET_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))]}
          />
        ) : null}
        <FilterSelect
          label="Filtrer par priorité"
          value={priority}
          onChange={setPriority}
          options={[{ value: ALL, label: "Toutes les priorités" }, ...TICKET_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))]}
        />
        <FilterSelect
          label="Filtrer par assigné"
          value={assignee}
          onChange={setAssignee}
          options={[
            { value: ALL, label: "Tous les assignés" },
            { value: UNASSIGNED, label: "Non assignés" },
            ...members.map((m) => ({ value: m.id, label: m.id === currentUserId ? `${displayName(m)} (moi)` : displayName(m) })),
          ]}
        />
        {hasFilters ? (
          <Button variant="ghost" onClick={resetFilters}>
            <X className="size-4" aria-hidden /> Réinitialiser
          </Button>
        ) : null}
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title="Aucun ticket pour l'instant"
          description="Créez le premier ticket de ce projet pour commencer à suivre le travail de l'équipe."
          action={
            <Button onClick={() => openCreate()}>
              <Plus className="size-4" aria-hidden /> Créer un ticket
            </Button>
          }
        />
      ) : view === "kanban" ? (
        <KanbanBoard tickets={filtered} projectId={projectId} onMove={handleMove} onCreate={openCreate} onAssignSelf={handleAssignSelf} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Aucun résultat"
          description="Aucun ticket ne correspond à vos filtres."
          action={
            <Button variant="outline" onClick={resetFilters}>
              Réinitialiser les filtres
            </Button>
          }
        />
      ) : (
        <TicketTable tickets={filtered} projectId={projectId} onEdit={openEdit} onDelete={setDeleting} onAssignSelf={handleAssignSelf} />
      )}

      <TicketFormSheet
        open={sheetVisible}
        onOpenChange={handleSheetChange}
        projectId={projectId}
        members={members}
        ticket={editing}
        defaultStatus={defaultStatus}
        onSaved={upsert}
      />
      <DeleteTicketDialog ticket={deleting} onOpenChange={(o) => !o && setDeleting(null)} onDeleted={remove} />
    </>
  );
}
