"use client";

import { Database, Pin, Plus, Search, StickyNote } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { NoteSheet } from "@/components/notes/note-sheet";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateNote } from "@/lib/actions/notes";
import { NOTE_COLOR_STYLES, type NoteColor } from "@/lib/constants";
import { displayName, timeAgo } from "@/lib/format";
import type { NoteWithAuthor } from "@/lib/queries/notes";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  initialNotes: NoteWithAuthor[];
  currentUserId: string;
  isAdmin: boolean;
  /** false si la migration des notes n'a pas encore été appliquée. */
  available: boolean;
};

const byPinnedThenRecent = (a: NoteWithAuthor, b: NoteWithAuthor) =>
  Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at);

export function NotesBoard({ projectId, initialNotes, currentUserId, isAdmin, available }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<NoteWithAuthor | null>(null);
  const [, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...notes]
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
      .sort(byPinnedThenRecent);
  }, [notes, query]);

  const upsert = (note: NoteWithAuthor) =>
    setNotes((prev) => (prev.some((n) => n.id === note.id) ? prev.map((n) => (n.id === note.id ? note : n)) : [note, ...prev]));

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };
  const openEdit = (note: NoteWithAuthor) => {
    setEditing(note);
    setSheetOpen(true);
  };

  const togglePin = (note: NoteWithAuthor) => {
    const previous = notes;
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n)));
    startTransition(async () => {
      const result = await updateNote(note.id, { pinned: !note.pinned });
      if (!result.ok) {
        setNotes(previous);
        return void toast.error(result.error);
      }
      if (result.data) upsert(result.data);
    });
  };

  return (
    <>
      <PageHeader
        title="Notes"
        description="Informations, décisions et mémos partagés avec l'équipe du projet."
        actions={
          available ? (
            <Button onClick={openCreate}>
              <Plus className="size-4" aria-hidden /> Nouvelle note
            </Button>
          ) : null
        }
      />

      {!available ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <Database className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Les notes nécessitent une mise à jour de la base de données. Exécutez le fichier{" "}
            <code className="rounded bg-black/5 px-1 dark:bg-white/10">supabase/migrations/20260101000006_notes_and_todos.sql</code> dans le SQL Editor de Supabase, puis rechargez cette page.
          </p>
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="Aucune note pour l'instant"
          description="Gardez ici les décisions, liens utiles et informations importantes du projet. Tous les membres peuvent les lire et les modifier."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" aria-hidden /> Créer la première note
            </Button>
          }
        />
      ) : (
        <>
          <div className="relative mb-4 max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher dans les notes…"
              aria-label="Rechercher dans les notes"
              className="h-9 bg-background pl-8"
            />
          </div>
          {visible.length === 0 ? (
            <p className="text-muted-foreground rounded-2xl border border-dashed py-10 text-center text-sm">Aucune note ne correspond à votre recherche.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((note) => {
                const style = NOTE_COLOR_STYLES[(note.color as NoteColor) in NOTE_COLOR_STYLES ? (note.color as NoteColor) : "yellow"];
                return (
                  <li key={note.id} className="relative">
                    <button
                      type="button"
                      onClick={() => openEdit(note)}
                      className={cn(
                        "focus-visible:ring-ring flex h-full min-h-40 w-full flex-col gap-2 rounded-2xl border p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none",
                        style.card,
                      )}
                    >
                      <h2 className="pr-8 font-semibold break-words">{note.title}</h2>
                      <p className="text-foreground/80 line-clamp-6 flex-1 text-sm break-words whitespace-pre-wrap">
                        {note.body || <span className="text-muted-foreground italic">Note vide</span>}
                      </p>
                      <div className="text-muted-foreground flex items-center gap-2 pt-1 text-xs">
                        <UserAvatar user={note.author} size="sm" />
                        <span className="truncate">{displayName(note.author)}</span>
                        <span aria-hidden>·</span>
                        <time dateTime={note.updated_at} className="whitespace-nowrap">
                          {timeAgo(note.updated_at)}
                        </time>
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => togglePin(note)}
                      aria-label={note.pinned ? `Désépingler « ${note.title} »` : `Épingler « ${note.title} »`}
                      aria-pressed={note.pinned}
                      className={cn("absolute top-2 right-2", note.pinned ? "text-primary" : "text-muted-foreground")}
                    >
                      <Pin className={cn("size-4", note.pinned && "fill-current")} />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <NoteSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        projectId={projectId}
        note={editing}
        canDelete={!!editing && (isAdmin || editing.created_by === currentUserId)}
        onSaved={upsert}
        onDeleted={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
      />
    </>
  );
}
