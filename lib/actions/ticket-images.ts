"use server";

import { requireUser } from "@/lib/auth";
import { UUID_RE } from "@/lib/db-error";
import { ensureBucket } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fetchTicketImages } from "@/lib/ticket-images";
import {
  TICKET_IMAGE_BUCKET,
  TICKET_IMAGE_EXTENSIONS,
  TICKET_IMAGE_MAX_BYTES,
  TICKET_IMAGE_MAX_COUNT,
  TICKET_IMAGE_TYPES,
  type TicketImage,
} from "@/lib/ticket-image-config";
import type { ActionResult } from "@/lib/actions/types";

const NAME_RE = /^[0-9a-f-]{36}\.(png|jpg|webp|gif)$/;

/** Vérifie, via la RLS, que l'utilisateur peut lire (donc modifier) ce ticket. */
async function ticketProject(ticketId: string): Promise<string | null> {
  await requireUser();
  if (!UUID_RE.test(ticketId)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("tickets").select("project_id").eq("id", ticketId).maybeSingle();
  return data?.project_id ?? null;
}

/**
 * Étape 1 de l'envoi : le serveur choisit le chemin du fichier et renvoie une URL d'envoi signée.
 * Le navigateur envoie ensuite le fichier DIRECTEMENT vers Storage (pas de limite de taille des Server Actions).
 * Le type et la taille sont aussi imposés par le bucket.
 */
export async function createTicketImageUpload(
  ticketId: string,
  file: { type: string; size: number },
): Promise<ActionResult<{ path: string; token: string }>> {
  const projectId = await ticketProject(ticketId);
  if (!projectId) return { ok: false, error: "Ticket introuvable." };
  if (!(TICKET_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Format non pris en charge (PNG, JPG, WebP ou GIF)." };
  }
  if (file.size > TICKET_IMAGE_MAX_BYTES) return { ok: false, error: "Chaque image doit faire 8 Mo maximum." };

  const admin = createAdminClient();
  const ready = await ensureBucket(admin, TICKET_IMAGE_BUCKET, {
    public: false,
    fileSizeLimit: TICKET_IMAGE_MAX_BYTES,
    allowedMimeTypes: [...TICKET_IMAGE_TYPES],
  });
  if (!ready) return { ok: false, error: "Le stockage des images n'est pas disponible." };

  const existing = await fetchTicketImageCount(projectId, ticketId);
  if (existing >= TICKET_IMAGE_MAX_COUNT) {
    return { ok: false, error: `Un ticket peut contenir ${TICKET_IMAGE_MAX_COUNT} images au maximum.` };
  }

  const path = `${projectId}/${ticketId}/${crypto.randomUUID()}.${TICKET_IMAGE_EXTENSIONS[file.type]}`;
  const { data, error } = await admin.storage.from(TICKET_IMAGE_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Impossible de préparer l'envoi de l'image." };
  return { ok: true, data: { path: data.path, token: data.token } };
}

async function fetchTicketImageCount(projectId: string, ticketId: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin.storage.from(TICKET_IMAGE_BUCKET).list(`${projectId}/${ticketId}`, { limit: 100 });
  return (data ?? []).filter((o) => o.id).length;
}

export async function listTicketImages(ticketId: string): Promise<ActionResult<TicketImage[]>> {
  const projectId = await ticketProject(ticketId);
  if (!projectId) return { ok: false, error: "Ticket introuvable." };
  return { ok: true, data: await fetchTicketImages(projectId, ticketId) };
}

export async function deleteTicketImage(ticketId: string, name: string): Promise<ActionResult> {
  const projectId = await ticketProject(ticketId);
  if (!projectId) return { ok: false, error: "Ticket introuvable." };
  if (!NAME_RE.test(name)) return { ok: false, error: "Image introuvable." };

  const admin = createAdminClient();
  const { error } = await admin.storage.from(TICKET_IMAGE_BUCKET).remove([`${projectId}/${ticketId}/${name}`]);
  if (error) return { ok: false, error: "Impossible de supprimer l'image." };
  return { ok: true, message: "Image supprimée" };
}
