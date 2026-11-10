import { z } from "zod";

export const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "L'email est requis.")
    .pipe(z.email("Adresse email invalide.")),
  role: z.enum(["admin", "member"], { error: "Choisissez un rôle." }),
});

export const memberRoleSchema = z.enum(["admin", "member"]);

export const completeInvitationSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Le nom doit contenir au moins 2 caractères.")
      .max(100, "Le nom ne doit pas dépasser 100 caractères."),
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

export type InviteInput = z.infer<typeof inviteSchema>;
export type CompleteInvitationInput = z.infer<typeof completeInvitationSchema>;
