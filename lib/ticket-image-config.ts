export const TICKET_IMAGE_BUCKET = "ticket-images";
export const TICKET_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export const TICKET_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const TICKET_IMAGE_MAX_COUNT = 20;
/** Durée de validité des URLs signées de lecture (2 h). */
export const TICKET_IMAGE_URL_TTL = 2 * 60 * 60;

export const TICKET_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type TicketImage = {
  name: string;
  url: string;
  size: number;
  created_at: string | null;
};
