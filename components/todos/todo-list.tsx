"use client";

import { CalendarClock, Check, ChevronDown, Database, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { DueDatePicker } from "@/components/tickets/ticket-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTodo, deleteTodo, setTodoDone } from "@/lib/actions/todos";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/format";
import type { SidebarProject } from "@/lib/queries/projects";
import type { AssignedTicketItem, TodoData, TodoRow } from "@/lib/queries/todos";
import { STATUS_STYLES } from "@/lib/ticket-ui";
import { cn } from "@/lib/utils";

const PERSONAL = "__personal__";
/** Couleur des tâches personnelles (non rattachées à un projet). */
const PERSONAL_COLOR = "#64748B";

type Item =
  | { kind: "ticket"; key: string; ticket: AssignedTicketItem; due: string | null }
  | { kind: "todo"; key: string; todo: TodoRow; due: string | null };

type Props = {
  data: TodoData;
  projects: SidebarProject[];
  /** compact : menu de l'avatar. full : page de profil (avec échéance et tâches terminées). */
  variant: "compact" | "full";
  /** Appelé quand on suit un lien (permet de fermer le menu). */
  onNavigate?: () => void;
};

function byDue(a: Item, b: Item) {
  if (a.due && b.due) return a.due.localeCompare(b.due);
  if (a.due) return -1;
  if (b.due) return 1;
  return 0;
}

export function TodoList({ data, projects, variant, onNavigate }: Props) {
  const [todos, setTodos] = useState(data.todos);
  const [doneTodos, setDoneTodos] = useState(data.doneTodos);
  const [prev, setPrev] = useState(data);
  if (data !== prev) {
    // Nouvelles données serveur : on repart d'elles
    setPrev(data);
    setTodos(data.todos);
    setDoneTodos(data.doneTodos);
  }

  const [showDone, setShowDone] = useState(false);
  const [, startTransition] = useTransition();

  const items = useMemo<Item[]>(
    () =>
      [
        ...data.tickets.map((t): Item => ({ kind: "ticket", key: `t-${t.id}`, ticket: t, due: t.due_date })),
        ...todos.map((t): Item => ({ kind: "todo", key: `d-${t.id}`, todo: t, due: t.due_date })),
      ].sort(byDue),
    [data.tickets, todos],
  );

  const toggle = (todo: TodoRow, done: boolean) => {
    const snapshot = { todos, doneTodos };
    const moved = { ...todo, done };
    if (done) {
      setTodos((p) => p.filter((t) => t.id !== todo.id));
      setDoneTodos((p) => [moved, ...p]);
    } else {
      setDoneTodos((p) => p.filter((t) => t.id !== todo.id));
      setTodos((p) => [moved, ...p]);
    }
    startTransition(async () => {
      const result = await setTodoDone(todo.id, done);
      if (!result.ok) {
        setTodos(snapshot.todos);
        setDoneTodos(snapshot.doneTodos);
        toast.error(result.error);
      }
    });
  };

  const remove = (todo: TodoRow) => {
    const snapshot = { todos, doneTodos };
    setTodos((p) => p.filter((t) => t.id !== todo.id));
    setDoneTodos((p) => p.filter((t) => t.id !== todo.id));
    startTransition(async () => {
      const result = await deleteTodo(todo.id);
      if (!result.ok) {
        setTodos(snapshot.todos);
        setDoneTodos(snapshot.doneTodos);
        toast.error(result.error);
      } else toast.success(result.message ?? "Tâche supprimée");
    });
  };

  const compact = variant === "compact";

  return (
    <div className="grid gap-3">
      {data.available ? (
        <AddTodoForm projects={projects} compact={compact} onCreated={(t) => setTodos((p) => [t, ...p])} />
      ) : (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <Database className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            Pour ajouter vos propres tâches, exécutez la migration <code>20260101000006_notes_and_todos.sql</code> dans Supabase.
          </span>
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-sm">
          Rien à faire pour le moment.{compact ? "" : " Ajoutez une tâche ou assignez-vous un ticket."}
        </p>
      ) : (
        <ul className={cn("grid gap-1.5", compact && "max-h-72 overflow-y-auto pr-1")}>
          {items.map((item) =>
            item.kind === "ticket" ? (
              <TicketRow key={item.key} ticket={item.ticket} onNavigate={onNavigate} />
            ) : (
              <TodoRowView key={item.key} todo={item.todo} onToggle={toggle} onRemove={remove} />
            ),
          )}
        </ul>
      )}

      {!compact && doneTodos.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setShowDone((s) => !s)}
            aria-expanded={showDone}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm font-medium"
          >
            <ChevronDown className={cn("size-4 transition-transform", !showDone && "-rotate-90")} aria-hidden />
            Terminées ({doneTodos.length})
          </button>
          {showDone ? (
            <ul className="mt-2 grid gap-1.5">
              {doneTodos.map((t) => (
                <TodoRowView key={t.id} todo={t} onToggle={toggle} onRemove={remove} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DueLabel({ due, late }: { due: string | null; late: boolean }) {
  if (!due) return null;
  return (
    <span className={cn("flex items-center gap-1 whitespace-nowrap tabular-nums", late ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground")}>
      <CalendarClock className="size-3" aria-hidden />
      {formatDate(due, "d MMM")}
      {late ? <span className="sr-only"> (en retard)</span> : null}
    </span>
  );
}

function TicketRow({ ticket, onNavigate }: { ticket: AssignedTicketItem; onNavigate?: () => void }) {
  const color = ticket.project?.color ?? PERSONAL_COLOR;
  const late = !!ticket.due_date && ticket.due_date < todayISO();
  return (
    <li>
      <Link
        href={`/projets/${ticket.project_id}/tickets/${ticket.id}`}
        onClick={onNavigate}
        className="hover:bg-muted/70 focus-visible:ring-ring flex items-center gap-2.5 rounded-lg border-l-4 py-1.5 pr-2 pl-2.5 transition-colors outline-none focus-visible:ring-2"
        style={{ borderLeftColor: color, backgroundColor: `${color}12` }}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{ticket.title}</span>
          <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
            <span className="truncate">{ticket.project?.name ?? "Projet"}</span>
            <span className="flex items-center gap-1">
              <span className={cn("size-1.5 rounded-full", STATUS_STYLES[ticket.status].dot)} aria-hidden />
              {STATUS_LABELS[ticket.status]}
            </span>
            <DueLabel due={ticket.due_date} late={late} />
          </span>
        </span>
        <span className="bg-background text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium uppercase">Ticket</span>
      </Link>
    </li>
  );
}

function TodoRowView({ todo, onToggle, onRemove }: { todo: TodoRow; onToggle: (t: TodoRow, done: boolean) => void; onRemove: (t: TodoRow) => void }) {
  const color = todo.project?.color ?? PERSONAL_COLOR;
  const late = !todo.done && !!todo.due_date && todo.due_date < todayISO();
  return (
    <li
      className="group flex items-center gap-2.5 rounded-lg border-l-4 py-1.5 pr-1.5 pl-2.5"
      style={{ borderLeftColor: color, backgroundColor: `${color}12` }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.done}
        aria-label={todo.done ? `Rouvrir « ${todo.title} »` : `Terminer « ${todo.title} »`}
        onClick={() => onToggle(todo, !todo.done)}
        className="focus-visible:ring-ring flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition outline-none focus-visible:ring-2"
        style={{ borderColor: color, backgroundColor: todo.done ? color : "transparent" }}
      >
        {todo.done ? <Check className="size-3 text-white" aria-hidden /> : null}
      </button>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-sm font-medium", todo.done && "text-muted-foreground line-through")}>{todo.title}</span>
        <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
          <span className="truncate">{todo.project?.name ?? "Personnel"}</span>
          <DueLabel due={todo.due_date} late={late} />
        </span>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onRemove(todo)}
        aria-label={`Supprimer « ${todo.title} »`}
        className="text-muted-foreground opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Trash2 />
      </Button>
    </li>
  );
}

function AddTodoForm({ projects, compact, onCreated }: { projects: SidebarProject[]; compact: boolean; onCreated: (t: TodoRow) => void }) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(PERSONAL);
  const [due, setDue] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const byId = new Map(projects.map((p) => [p.id, p]));
  const options = [{ value: PERSONAL, label: "Personnel" }, ...projects.map((p) => ({ value: p.id, label: p.name }))];

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return void inputRef.current?.focus();
    startTransition(async () => {
      const result = await createTodo({ title: trimmed, project_id: projectId === PERSONAL ? null : projectId, due_date: due });
      if (!result.ok) return void toast.error(result.error);
      if (result.data) onCreated(result.data);
      setTitle("");
      setDue(null);
      inputRef.current?.focus();
    });
  };

  const swatch = (color: string) => <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid gap-2"
    >
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ajouter une tâche…"
          aria-label="Nouvelle tâche"
          maxLength={200}
          autoComplete="off"
          className="h-9 flex-1 bg-background"
        />
        <Button type="submit" size="icon" className="size-9" disabled={pending || !title.trim()} aria-label="Ajouter la tâche">
          <Plus className="size-4" />
        </Button>
      </div>
      <div className={cn("flex gap-2", !compact && "flex-wrap sm:flex-nowrap")}>
        <Select value={projectId} onValueChange={(v) => setProjectId(v ?? PERSONAL)} items={options}>
          <SelectTrigger aria-label="Projet lié à la tâche" className="h-8 min-w-0 flex-1 bg-background">
            <SelectValue>
              {(v: string) => (
                <span className="flex items-center gap-2 truncate">
                  {swatch(v === PERSONAL ? PERSONAL_COLOR : (byId.get(v)?.color ?? PERSONAL_COLOR))}
                  <span className="truncate">{v === PERSONAL ? "Personnel (sans projet)" : (byId.get(v)?.name ?? "Projet")}</span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PERSONAL}>
              <span className="flex items-center gap-2">
                {swatch(PERSONAL_COLOR)} Personnel (sans projet)
              </span>
            </SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <span className="flex items-center gap-2">
                  {swatch(p.color)}
                  <span className="truncate">{p.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!compact ? <DueDatePicker value={due} onChange={setDue} className="min-w-0 flex-1" /> : null}
      </div>
    </form>
  );
}
