"use client";

import { Check, Pin, PinOff, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Field } from "@/components/forms/field";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createNote, deleteNote, updateNote } from "@/lib/actions/notes";
import { NOTE_COLORS, NOTE_COLOR_LABELS, NOTE_COLOR_STYLES, type NoteColor } from "@/lib/constants";
import type { NoteWithAuthor } from "@/lib/queries/notes";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  /** Note à modifier ; absente = création. */
  note: NoteWithAuthor | null;
  canDelete: boolean;
  onSaved: (note: NoteWithAuthor) => void;
  onDeleted: (id: string) => void;
};

export function NoteSheet({ open, onOpenChange, projectId, note, canDelete, onSaved, onDeleted }: Props) {
  // Le contenu du formulaire est monté à chaque ouverture (key) : état initial = la note éditée ou une note vide.
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{note ? "Modifier la note" : "Nouvelle note"}</SheetTitle>
          <SheetDescription>Les notes sont visibles et modifiables par tous les membres du projet.</SheetDescription>
        </SheetHeader>
        {open ? (
          <NoteForm
            key={note?.id ?? "new"}
            projectId={projectId}
            note={note}
            canDelete={canDelete}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
            onDeleted={onDeleted}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function NoteForm({
  projectId,
  note,
  canDelete,
  onClose,
  onSaved,
  onDeleted,
}: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [color, setColor] = useState<NoteColor>((note?.color as NoteColor) ?? "yellow");
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = () => {
    if (!title.trim()) return setTitleError("Le titre est requis.");
    startTransition(async () => {
      const values = { title, body, color, pinned };
      const result = note ? await updateNote(note.id, values) : await createNote(projectId, values);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? "Note enregistrée");
      if (result.data) onSaved(result.data);
      onClose();
    });
  };

  const remove = () => {
    if (!note) return;
    startTransition(async () => {
      const result = await deleteNote(note.id);
      if (!result.ok) return void toast.error(result.error);
      toast.success(result.message ?? "Note supprimée");
      onDeleted(note.id);
      setConfirmDelete(false);
      onClose();
    });
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        noValidate
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="grid flex-1 content-start gap-4 overflow-y-auto p-4">
          <Field label="Titre" htmlFor="note-title" error={titleError}>
            <Input id="note-title" autoFocus value={title} onChange={(e) => {
              setTitle(e.target.value);
              setTitleError(undefined);
            }} placeholder="Ex. Décisions de la réunion" autoComplete="off" />
          </Field>
          <Field label="Contenu" htmlFor="note-body" hint="Texte libre : retours à la ligne conservés.">
            <Textarea id="note-body" rows={12} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Écrivez votre note ici…" />
          </Field>
          <div className="grid gap-1.5">
            <span className="text-sm leading-none font-medium">Couleur</span>
            <div role="radiogroup" aria-label="Couleur de la note" className="flex gap-2">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  aria-label={NOTE_COLOR_LABELS[c]}
                  title={NOTE_COLOR_LABELS[c]}
                  onClick={() => setColor(c)}
                  className={cn(
                    "ring-offset-background focus-visible:ring-ring flex size-8 items-center justify-center rounded-full ring-offset-2 transition outline-none focus-visible:ring-2",
                    NOTE_COLOR_STYLES[c].swatch,
                    color === c ? "ring-foreground/70 ring-2" : "hover:scale-110",
                  )}
                >
                  {color === c ? <Check className="size-4 text-white" aria-hidden /> : null}
                </button>
              ))}
            </div>
          </div>
          <Button type="button" variant="outline" className="w-fit" onClick={() => setPinned((p) => !p)} aria-pressed={pinned}>
            {pinned ? <PinOff className="size-4" aria-hidden /> : <Pin className="size-4" aria-hidden />}
            {pinned ? "Désépingler" : "Épingler en haut"}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2 border-t p-4">
          {note && canDelete ? (
            <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)} disabled={pending}>
              <Trash2 className="size-4" aria-hidden /> Supprimer
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </form>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
            <AlertDialogDescription>« {note?.title} » sera définitivement supprimée pour tous les membres du projet.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <Button variant="destructive" onClick={remove} disabled={pending}>
              {pending ? "Suppression…" : "Supprimer"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
