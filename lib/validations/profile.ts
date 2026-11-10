import { z } from "zod";

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(100, "Le nom ne doit pas dépasser 100 caractères."),
});

export const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
      .max(72, "Le mot de passe ne doit pas dépasser 72 caractères."),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    path: ["confirm_password"],
    message: "Les mots de passe ne correspondent pas.",
  });

/** Taille max de l'image exportée (côté serveur) : le recadrage produit un JPEG 512 × 512 bien plus léger. */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
/** Taille max de la photo d'origine choisie avant recadrage. */
export const AVATAR_SOURCE_MAX_BYTES = 15 * 1024 * 1024;
export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;

export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
