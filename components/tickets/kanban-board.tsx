"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronsLeft, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { TicketCard } from "@/components/tickets/ticket-card";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, TICKET_STATUSES } from "@/lib/constants";
import { STATUS_STYLES } from "@/lib/ticket-ui";
import { cn } from "@/lib/utils";
import type { TicketStatus, TicketWithPeople } from "@/types";

type Columns = Record<TicketStatus, string[]>;

/** Colonne discrète, repliée par défaut. */
const COLLAPSIBLE_STATUS: TicketStatus = "closed";

function group(tickets: TicketWithPeople[]): Columns {
  const cols: Columns = { todo: [], in_progress: [], in_review: [], done: [], closed: [] };
  [...tickets]
    .sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at))
    .forEach((t) => cols[t.status].push(t.id));
  return cols;
}

function SortableCard({ ticket, projectId, onAssignSelf }: { ticket: TicketWithPeople; projectId: string; onAssignSelf?: (ticket: TicketWithPeople) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ticket.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("touch-manipulation rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <TicketCard ticket={ticket} projectId={projectId} onAssignSelf={onAssignSelf ? () => onAssignSelf(ticket) : undefined} />
    </div>
  );
}

/** Colonne « Fermé » repliée : bande étroite et discrète, qui accepte quand même le dépôt d'un ticket. */
function CollapsedColumn({ status, count, onExpand }: { status: TicketStatus; count: number; onExpand: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onExpand}
      aria-expanded={false}
      aria-label={`Afficher la colonne « ${STATUS_LABELS[status]} » (${count})`}
      title={`Afficher « ${STATUS_LABELS[status]} »`}
      className={cn(
        "text-muted-foreground hover:bg-muted/60 hover:text-foreground flex w-11 shrink-0 flex-col items-center gap-3 rounded-2xl border border-dashed py-3 transition-colors",
        "focus-visible:ring-ring outline-none focus-visible:ring-2",
        isOver && "bg-primary/5 ring-primary/30 text-foreground ring-2 ring-inset",
      )}
    >
      <ChevronsLeft className="size-4 rotate-180" aria-hidden />
      <span className={cn("size-2 rounded-md opacity-70", STATUS_STYLES[status].dot)} aria-hidden />
      <span className="text-xs font-medium tabular-nums">{count}</span>
      <span className="text-xs font-medium tracking-wide [writing-mode:vertical-rl]">{STATUS_LABELS[status]}</span>
    </button>
  );
}

function Column({
  status,
  ids,
  byId,
  projectId,
  onCreate,
  onAssignSelf,
  onCollapse,
}: {
  status: TicketStatus;
  ids: string[];
  byId: Map<string, TicketWithPeople>;
  projectId: string;
  onCreate: (status: TicketStatus) => void;
  onAssignSelf?: (ticket: TicketWithPeople) => void;
  /** Présent pour une colonne repliable (« Fermé ») : affichage atténué + bouton pour replier. */
  onCollapse?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const style = STATUS_STYLES[status];
  const muted = !!onCollapse;

  return (
    <section
      aria-label={`${STATUS_LABELS[status]} (${ids.length})`}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-2xl p-2 xl:w-auto xl:min-w-0 xl:flex-1",
        muted ? "border border-dashed bg-transparent" : "bg-muted/60",
      )}
    >
      <header className={cn("flex items-center gap-2 px-2 py-1.5", muted && "text-muted-foreground")}>
        <span className={cn("size-2.5 rounded-md", style.dot)} aria-hidden />
        <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
        <span className="bg-background text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium tabular-nums">{ids.length}</span>
        {onCollapse ? (
          <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={onCollapse} aria-expanded aria-label={`Masquer la colonne « ${STATUS_LABELS[status]} »`}>
            <ChevronsLeft className="size-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={() => onCreate(status)} aria-label={`Ajouter un ticket « ${STATUS_LABELS[status]} »`}>
            <Plus className="size-4" />
          </Button>
        )}
      </header>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 rounded-xl p-1 transition-colors",
          muted && "opacity-60 transition-opacity hover:opacity-100",
          isOver && "bg-primary/5 ring-primary/30 ring-2 ring-inset",
        )}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {ids.map((id) => {
            const t = byId.get(id);
            return t ? <SortableCard key={id} ticket={t} projectId={projectId} onAssignSelf={onAssignSelf} /> : null;
          })}
        </SortableContext>
        {ids.length === 0 ? (
          <p className="text-muted-foreground m-auto px-2 py-6 text-center text-xs">Aucun ticket. Glissez-en un ici.</p>
        ) : null}
      </div>
    </section>
  );
}

type Props = {
  tickets: TicketWithPeople[];
  projectId: string;
  onMove: (ticketId: string, status: TicketStatus, position: number) => void;
  onCreate: (status: TicketStatus) => void;
  onAssignSelf?: (ticket: TicketWithPeople) => void;
};

export function KanbanBoard({ tickets, projectId, onMove, onCreate, onAssignSelf }: Props) {
  const byId = useMemo(() => new Map(tickets.map((t) => [t.id, t])), [tickets]);
  const [items, setItems] = useState<Columns>(() => group(tickets));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [closedOpen, setClosedOpen] = useState(false);
  const isCollapsed = (status: TicketStatus) => status === COLLAPSIBLE_STATUS && !closedOpen;

  // Resynchronise les colonnes quand les tickets changent (hors glisser-déposer en cours).
  const [prevTickets, setPrevTickets] = useState(tickets);
  if (tickets !== prevTickets && activeId === null) {
    setPrevTickets(tickets);
    setItems(group(tickets));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findContainer = (id: string, cols: Columns = items): TicketStatus | undefined => {
    if ((TICKET_STATUSES as readonly string[]).includes(id)) return id as TicketStatus;
    return TICKET_STATUSES.find((s) => cols[s].includes(id));
  };

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeKey = String(active.id);
    const overKey = String(over.id);
    const from = findContainer(activeKey);
    const to = findContainer(overKey);
    // Colonne repliée : on ne déplace pas la carte pendant le survol, le dépôt est traité dans onDragEnd.
    if (!from || !to || from === to || isCollapsed(to)) return;

    setItems((prev) => {
      const toList = prev[to];
      const overIndex = toList.indexOf(overKey);
      const isBelow =
        over.rect && active.rect.current.translated ? active.rect.current.translated.top > over.rect.top + over.rect.height / 2 : false;
      const index = overIndex >= 0 ? overIndex + (isBelow ? 1 : 0) : toList.length;
      return {
        ...prev,
        [from]: prev[from].filter((id) => id !== activeKey),
        [to]: [...toList.slice(0, index), activeKey, ...toList.slice(index)],
      };
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    const activeKey = String(active.id);
    const ticket = byId.get(activeKey);
    if (!over || !ticket) {
      setItems(group(tickets));
      return;
    }

    const overKey = String(over.id);

    // Dépôt sur la colonne repliée : le ticket va à la fin de cette colonne.
    if (findContainer(overKey) === COLLAPSIBLE_STATUS && isCollapsed(COLLAPSIBLE_STATUS)) {
      const target = COLLAPSIBLE_STATUS;
      const from = findContainer(activeKey);
      const last = items[target].filter((id) => id !== activeKey).at(-1);
      const lastPos = last ? byId.get(last)?.position : undefined;
      setItems((prev) => ({
        ...prev,
        ...(from && from !== target ? { [from]: prev[from].filter((id) => id !== activeKey) } : {}),
        [target]: [...prev[target].filter((id) => id !== activeKey), activeKey],
      }));
      if (ticket.status !== target) onMove(activeKey, target, lastPos !== undefined ? lastPos + 1024 : 1024);
      return;
    }

    const container = findContainer(activeKey);
    if (!container) return;

    let list = items[container];
    const oldIndex = list.indexOf(activeKey);
    const newIndex = list.indexOf(overKey);
    if (newIndex >= 0 && oldIndex !== newIndex) {
      list = arrayMove(list, oldIndex, newIndex);
      setItems((prev) => ({ ...prev, [container]: list }));
    }

    const index = list.indexOf(activeKey);
    const prev = index > 0 ? byId.get(list[index - 1])?.position : undefined;
    const next = index < list.length - 1 ? byId.get(list[index + 1])?.position : undefined;
    const position =
      prev !== undefined && next !== undefined ? (prev + next) / 2 : prev !== undefined ? prev + 1024 : next !== undefined ? next / 2 : 1024;

    if (container === ticket.status && position === ticket.position) return;
    onMove(activeKey, container, position);
  };

  const active = activeId ? byId.get(activeId) : undefined;

  return (
    <DndContext
      id="kanban"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setItems(group(tickets));
      }}
    >
      <div className="relative -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 xl:mx-0 xl:px-0">
        {TICKET_STATUSES.map((status) =>
          isCollapsed(status) ? (
            <CollapsedColumn key={status} status={status} count={items[status].length} onExpand={() => setClosedOpen(true)} />
          ) : (
            <Column
              key={status}
              status={status}
              ids={items[status]}
              byId={byId}
              projectId={projectId}
              onCreate={onCreate}
              onAssignSelf={onAssignSelf}
              onCollapse={status === COLLAPSIBLE_STATUS ? () => setClosedOpen(false) : undefined}
            />
          ),
        )}
      </div>
      <DragOverlay>{active ? <TicketCard ticket={active} projectId={projectId} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
