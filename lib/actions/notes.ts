"use server";

import { requireUser } from "@/lib/auth";
import { dbErrorMessage, isMissingTable, UUID_RE } from "@/lib/db-error";
import { NOTE_SELECT, type NoteWithAuthor } from "@/lib/queries/notes";
import { createClient } from "@/lib/supabase/server";
import { noteSchema, notePatchSchema, type NoteInput, type NotePatch } from "@/lib/validations/note";
import type { ActionResult } from "@/lib/actions/types";

const firstIssue = (e: { issues: { message: string }[] }) => e.issues[0]?.message ?? "Données invalides.";
const MIGRATION_MSG = "La table des notes n'existe pas encore : appliquez la migration 0006 dans Supabase.";

export async function createNote(projectId: string, input: NoteInput): Promise<ActionResult<NoteWithAuthor>> {
  const user = await requireUser();
  if (!UUID_RE.test(projectId)) return { ok: false, error: "Projet introuvable." };
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_notes")
    .insert({ project_id: projectId, created_by: user.id, ...parsed.data })
    .select(NOTE_SELECT)
    .single();
  if (isMissingTable(error)) return { ok: false, error: MIGRATION_MSG };
  if (error || !data) return { ok: false, error: dbErrorMessage(error, "Impossible de créer la note.") };
  return { ok: true, message: "Note créée", data };
}

export async function updateNote(noteId: string, patch: NotePatch): Promise<ActionResult<NoteWithAuthor>> {
  await requireUser();
  if (!UUID_RE.test(noteId)) return { ok: false, error: "Note introuvable." };
  const parsed = notePatchSchema.safeParse(patch);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  if (Object.keys(parsed.data).length === 0) return { ok: false, error: "Rien à modifier." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_notes")
    .update(parsed.data)
    .eq("id", noteId)
    .select(NOTE_SELECT)
    .maybeSingle();
  if (error) return { ok: false, error: dbErrorMessage(error, "Impossible de modifier la note.") };
  if (!data) return { ok: false, error: "Note introuvable ou droits insuffisants." };
  return { ok: true, message: "Note enregistrée", data };
}

export async function deleteNote(noteId: string): Promise<ActionResult> {
  await requireUser();
  if (!UUID_RE.test(noteId)) return { ok: false, error: "Note introuvable." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("project_notes").delete().eq("id", noteId).select("id");
  if (error) return { ok: false, error: dbErrorMessage(error, "Impossible de supprimer la note.") };
  if (!data?.length) return { ok: false, error: "Seuls l'auteur de la note et les administrateurs peuvent la supprimer." };
  return { ok: true, message: "Note supprimée" };
}
