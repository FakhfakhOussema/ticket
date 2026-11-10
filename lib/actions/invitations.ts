"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-error";
import { createClient } from "@/lib/supabase/server";
import { completeInvitationSchema, type CompleteInvitationInput } from "@/lib/validations/member";
import type { ActionResult } from "@/lib/actions/types";

/** Accepte l'invitation correspondant au token (l'email du compte doit être celui de l'invitation). */
export async function acceptInvitation(token: string): Promise<ActionResult<{ projectId: string }>> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invitation", { p_token: token });
  if (error || !data) return { ok: false, error: dbErrorMessage(error, "Impossible d'accepter l'invitation.") };

  revalidatePath("/", "layout");
  return { ok: true, data: { projectId: data } };
}

export async function declineInvitation(token: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_invitation", { p_token: token });
  if (error) return { ok: false, error: dbErrorMessage(error, "Impossible de refuser l'invitation.") };

  revalidatePath("/projets");
  return { ok: true };
}

/**
 * Invité sans mot de passe (compte créé par inviteUserByEmail) : définit nom + mot de passe,
 * accepte l'invitation, puis redirige vers le projet.
 */
export async function completeInvitation(token: string, input: CompleteInvitationInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = completeInvitationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const supabase = await createClient();
  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: { needs_password: false, full_name: parsed.data.full_name },
  });
  if (updateError) {
    return {
      ok: false,
      error:
        updateError.code === "same_password"
          ? "Choisissez un mot de passe différent du précédent."
          : updateError.code === "weak_password"
            ? "Mot de passe trop faible. Choisissez-en un plus long ou plus complexe."
            : "Impossible d'enregistrer le mot de passe. Réessayez.",
    };
  }

  await supabase.from("profiles").update({ full_name: parsed.data.full_name }).eq("id", user.id);

  const { data: projectId, error } = await supabase.rpc("accept_invitation", { p_token: token });
  if (error || !projectId) return { ok: false, error: dbErrorMessage(error, "Impossible d'accepter l'invitation.") };

  revalidatePath("/", "layout");
  redirect(`/projets/${projectId}`);
}
