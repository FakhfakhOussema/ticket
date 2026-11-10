import { z } from "zod";
import { NOTE_COLORS } from "@/lib/constants";

export const noteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le titre est requis.")
    .max(120, "Le titre ne doit pas dépasser 120 caractères."),
  body: z.string().max(20000, "La note est trop longue (20 000 caractères maximum)."),
  color: z.enum(NOTE_COLORS),
  pinned: z.boolean(),
});

export const notePatchSchema = noteSchema.partial();

export type NoteInput = z.infer<typeof noteSchema>;
export type NotePatch = z.infer<typeof notePatchSchema>;
