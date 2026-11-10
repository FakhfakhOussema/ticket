"use server";

import { requireUser } from "@/lib/auth";
import { dbErrorMessage, UUID_RE } from "@/lib/db-error";
import { PROFILE_COLUMNS } from "@/lib/queries/tickets";
import type { CommentWithAuthor } from "@/lib/queries/tickets";
import { removePrefix } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { TICKET_IMAGE_BUCKET } from "@/lib/ticket-image-config";
import {
  commentSchema,
  ticketPatchSchema,
  ticketSchema,
  type CommentInput,
  type TicketInput,
  type TicketPatch,
} from "@/lib/validations/ticket";
import type { ActionResult } from "@/lib/actions/types";
import type { TicketStatus, TicketWithPeople } from "@/types";

const TICKET_SELECT = `*,
  assignee:profiles!tickets_assignee_id_fkey(${PROFILE_COLUMNS}),
  creator:profiles!tickets_created_by_fkey(${PROFILE_COLUMNS})`;

const firstIssue = (e: { issues: { message: string }[] }) => e.issues[0]?.message ?? "Données invalides.";

export async function createTicket(projectId: string, input: TicketInput): Promise<ActionResult<TicketWithPeople>> {
  const user = await requireUser();
  if (!UUID_RE.test(projectId)) return { ok: false, error: "Projet introuvable." };
  const parsed = ticketSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .insert({
      project_id: projectId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      assignee_id: parsed.data.assignee_id,
      due_date: parsed.data.due_date,
      created_by: user.id,
    })
    .select(TICKET_SELECT)
    .single();

  if (error || !data) return { ok: false, error: dbErrorMessage(error, "Impossible de créer le ticket.") };
  return { ok: true, message: "Ticket créé", data };
}

export async function updateTicket(ticketId: string, patch: TicketPatch): Promise<ActionResult<TicketWithPeople>> {
  await requireUser();
  if (!UUID_RE.test(ticketId)) return { ok: false, error: "Ticket introuvable." };
  const parsed = ticketPatchSchema.safeParse(patch);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const { description, ...rest } = parsed.data;
  const update = { ...rest, ...(description !== undefined ? { description: description || null } : {}) };
  if (Object.keys(update).length === 0) return { ok: false, error: "Rien à modifier." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("tickets").update(update).eq("id", ticketId).select(TICKET_SELECT).maybeSingle();

  if (error) return { ok: false, error: dbErrorMessage(error, "Impossible de modifier le ticket.") };
  if (!data) return { ok: false, error: "Ticket introuvable ou droits insuffisants." };
  return { ok: true, message: "Ticket mis à jour", data };
}

/** Déplacement Kanban : nouveau statut + nouvelle position dans la colonne. */
export async function moveTicket(ticketId: string, status: TicketStatus, position: number): Promise<ActionResult> {
  await requireUser();
  if (!UUID_RE.test(ticketId)) return { ok: false, error: "Ticket introuvable." };
  const parsed = ticketPatchSchema.pick({ status: true }).safeParse({ status });
  if (!parsed.success || !Number.isFinite(position)) return { ok: false, error: "Déplacement invalide." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .update({ status, position })
    .eq("id", ticketId)
    .select("id");
  if (error) return { ok: false, error: dbErrorMessage(error, "Impossible de déplacer le ticket.") };
  if (!data?.length) return { ok: false, error: "Ticket introuvable ou droits insuffisants." };
  return { ok: true };
}

export async function deleteTicket(ticketId: string): Promise<ActionResult> {
  await requireUser();
  if (!UUID_RE.test(ticketId)) return { ok: false, error: "Ticket introuvable." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("tickets").delete().eq("id", ticketId).select("id, project_id");
  if (error) return { ok: false, error: dbErrorMessage(error, "Impossible de supprimer le ticket.") };
  if (!data?.length) return { ok: false, error: "Seuls le créateur du ticket et les administrateurs peuvent le supprimer." };

  // Supprime aussi les images jointes (au mieux : n'empêche pas la suppression)
  await removePrefix(TICKET_IMAGE_BUCKET, `${data[0].project_id}/${ticketId}`).catch(() => undefined);
  return { ok: true, message: "Ticket supprimé" };
}

export async function addComment(ticketId: string, input: CommentInput): Promise<ActionResult<CommentWithAuthor>> {
  const user = await requireUser();
  if (!UUID_RE.test(ticketId)) return { ok: false, error: "Ticket introuvable." };
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ticket_comments")
    .insert({ ticket_id: ticketId, body: parsed.data.body, author_id: user.id })
    .select(`*, author:profiles!ticket_comments_author_id_fkey(${PROFILE_COLUMNS})`)
    .single();
  if (error || !data) return { ok: false, error: dbErrorMessage(error, "Impossible d'ajouter le commentaire.") };
  return { ok: true, message: "Commentaire ajouté", data };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  await requireUser();
  if (!UUID_RE.test(commentId)) return { ok: false, error: "Commentaire introuvable." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("ticket_comments").delete().eq("id", commentId).select("id");
  if (error) return { ok: false, error: dbErrorMessage(error, "Impossible de supprimer le commentaire.") };
  if (!data?.length) return { ok: false, error: "Vous ne pouvez pas supprimer ce commentaire." };
  return { ok: true, message: "Commentaire supprimé" };
}
