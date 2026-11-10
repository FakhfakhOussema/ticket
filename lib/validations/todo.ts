import { z } from "zod";

export const todoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le titre de la tâche est requis.")
    .max(200, "Le titre ne doit pas dépasser 200 caractères."),
  // null = tâche personnelle ; sinon identifiant d'un projet dont on est membre
  project_id: z.uuid("Projet invalide.").nullable(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.")
    .nullable(),
});

export type TodoInput = z.infer<typeof todoSchema>;
