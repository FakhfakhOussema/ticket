import { createTicketImageUpload } from "@/lib/actions/ticket-images";
import { createClient } from "@/lib/supabase/client";
import { TICKET_IMAGE_BUCKET, TICKET_IMAGE_MAX_BYTES, TICKET_IMAGE_TYPES } from "@/lib/ticket-image-config";

/** Vérifie une image avant envoi ; retourne un message d'erreur ou `null` si elle est valide. */
export function validateTicketImage(file: File): string | null {
  if (!(TICKET_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return `« ${file.name} » : format non pris en charge (PNG, JPG, WebP ou GIF).`;
  }
  if (file.size > TICKET_IMAGE_MAX_BYTES) return `« ${file.name} » dépasse 8 Mo.`;
  return null;
}

/** Envoie une image dans le stockage du ticket (URL d'envoi signée → Storage directement). */
export async function uploadTicketImage(ticketId: string, file: File): Promise<{ ok: true } | { ok: false; error: string }> {
  const prepared = await createTicketImageUpload(ticketId, { type: file.type, size: file.size });
  if (!prepared.ok || !prepared.data) return { ok: false, error: prepared.ok ? "Envoi impossible." : prepared.error };

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(TICKET_IMAGE_BUCKET)
    .uploadToSignedUrl(prepared.data.path, prepared.data.token, file, { contentType: file.type });
  if (error) return { ok: false, error: `Échec de l'envoi de « ${file.name} ».` };
  return { ok: true };
}

/** Envoie plusieurs images à la suite ; retourne les messages d'erreur éventuels. */
export async function uploadTicketImages(ticketId: string, files: File[]): Promise<string[]> {
  const errors: string[] = [];
  for (const file of files) {
    const result = await uploadTicketImage(ticketId, file);
    if (!result.ok) errors.push(result.error);
  }
  return errors;
}
