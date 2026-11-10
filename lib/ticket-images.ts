import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TICKET_IMAGE_BUCKET, TICKET_IMAGE_URL_TTL, type TicketImage } from "@/lib/ticket-image-config";

/**
 * Images d'un ticket, dans le bucket PRIVÉ « ticket-images » (<project_id>/<ticket_id>/<fichier>).
 * L'accès est contrôlé côté serveur (RLS sur le ticket) puis les images sont servies via des URLs signées.
 * À appeler uniquement après avoir vérifié que l'utilisateur peut lire le ticket.
 */
export async function fetchTicketImages(projectId: string, ticketId: string): Promise<TicketImage[]> {
  const admin = createAdminClient();
  const prefix = `${projectId}/${ticketId}`;
  const { data: objects } = await admin.storage
    .from(TICKET_IMAGE_BUCKET)
    .list(prefix, { limit: 100, sortBy: { column: "created_at", order: "asc" } });

  const files = (objects ?? []).filter((o) => o.id);
  if (files.length === 0) return [];

  const { data: signed } = await admin.storage
    .from(TICKET_IMAGE_BUCKET)
    .createSignedUrls(
      files.map((f) => `${prefix}/${f.name}`),
      TICKET_IMAGE_URL_TTL,
    );

  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  return files.flatMap((f) => {
    const url = urlByPath.get(`${prefix}/${f.name}`);
    return url
      ? [{ name: f.name, url, size: Number(f.metadata?.size ?? 0), created_at: f.created_at ?? null }]
      : [];
  });
}
