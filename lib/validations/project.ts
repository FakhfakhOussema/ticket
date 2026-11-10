import { z } from "zod";
import { PROJECT_COLORS } from "@/lib/ticket-ui";

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom du projet est requis.")
    .max(100, "Le nom ne doit pas dépasser 100 caractères."),
  description: z.string().trim().max(2000, "La description ne doit pas dépasser 2000 caractères."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide."),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export const DEFAULT_PROJECT_COLOR: string = PROJECT_COLORS[0];
