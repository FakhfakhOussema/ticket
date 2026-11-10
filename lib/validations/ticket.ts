import { z } from "zod";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/constants";

export const ticketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le titre est requis.")
    .max(200, "Le titre ne doit pas dépasser 200 caractères."),
  description: z.string().trim().max(10000, "La description est trop longue (10 000 caractères maximum)."),
  status: z.enum(TICKET_STATUSES),
  priority: z.enum(TICKET_PRIORITIES),
  assignee_id: z.uuid("Assigné invalide.").nullable(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.")
    .nullable(),
});

export const ticketPatchSchema = ticketSchema.partial();

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Le commentaire ne peut pas être vide.")
    .max(5000, "Le commentaire ne doit pas dépasser 5000 caractères."),
});

export type TicketInput = z.infer<typeof ticketSchema>;
export type TicketPatch = z.infer<typeof ticketPatchSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
