"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage, UUID_RE } from "@/lib/db-error";
import { getRequestOrigin } from "@/lib/request-origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { inviteSchema, memberRoleSchema, type InviteInput } from "@/lib/validations/member";
import type { ActionResult } from "@/lib/actions/types";
import type { ProjectRole } from "@/types";

type InviteData = { link: string; emailSent: boolean };

// Origine de la requête en cours (et non NEXT_PUBLIC_SITE_URL, parfois restée sur localhost en production).
const invitationLink = (origin: string, token: string) => `${origin}/invitations/${token}`;

/**
 * Envoie l'email d'invitation via Supabase Auth (clé service role, serveur uniquement).
 * - Nouvel utilisateur : email d'invitation (SMTP configuré dans Supabase).
 * - Compte déjà existant : aucun email Auth possible ; l'invitation apparaît dans son espace « Mes projets ».
 */
type SendResult = { status: "sent" } | { status: "existing" } | { status: "error"; error: string };

async function sendInviteEmail(email: string, link: string, projectName: string): Promise<SendResult> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: link,
    data: { needs_password: true, invited_to: projectName },
  });

  if (!error) return { status: "sent" };
  if (error.code === "email_exists" || /already (been )?registered/i.test(error.message)) {
    return { status: "existing" };
  }
  if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
    return { status: "error", error: "Limite d'envoi d'emails atteinte. Réessayez dans quelques minutes." };
  }
  return { status: "error", error: "L'email d'invitation n'a pas pu être envoyé. Vérifiez la configuration SMTP." };
}

export async function inviteMember(projectId: string, input: InviteInput): Promise<ActionResult<InviteData>> {
  const user = await requireUser();
  if (!UUID_RE.test(projectId)) return { ok: false, error: "Projet introuvable." };
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const { email, role } = parsed.data;

  const supabase = await createClient();

  // Déjà membre ?
  const { data: members } = await supabase
    .from("project_members")
    .select("profile:profiles!project_members_user_id_fkey(email)")
    .eq("project_id", projectId);
  if (members?.some((m) => m.profile?.email?.toLowerCase() === email)) {
    return { ok: false, error: "Cette personne est déjà membre du projet." };
  }

  const { data: project } = await supabase.from("projects").select("name").eq("id", projectId).maybeSingle();
  if (!project) return { ok: false, error: "Projet introuvable." };

  // L'insertion passe par la RLS : seuls owner/admin peuvent inviter.
  const { data: invitation, error } = await supabase
    .from("project_invitations")
    .insert({ project_id: projectId, email, role, invited_by: user.id })
    .select("id, token")
    .single();

  if (error || !invitation) {
    if (error?.code === "23505") return { ok: false, error: "Une invitation est déjà en attente pour cette adresse." };
    if (error?.code === "42501") return { ok: false, error: "Seuls le propriétaire et les administrateurs peuvent inviter." };
    return { ok: false, error: dbErrorMessage(error, "Impossible de créer l'invitation.") };
  }

  const link = invitationLink(await getRequestOrigin(), invitation.token);
  const mail = await sendInviteEmail(email, link, project.name);
  if (mail.status === "error") {
    await supabase.from("project_invitations").delete().eq("id", invitation.id);
    return { ok: false, error: mail.error };
  }

  revalidatePath(`/projets/${projectId}/membres`);
  return mail.status === "sent"
    ? { ok: true, message: "Invitation envoyée", data: { link, emailSent: true } }
    : {
        ok: true,
        message: "Invitation créée : cette personne a déjà un compte et la verra dans « Mes projets ».",
        data: { link, emailSent: false },
      };
}

/** Renvoie l'email d'une invitation en attente et prolonge sa validité de 7 jours. */
export async function resendInvitation(invitationId: string): Promise<ActionResult<InviteData>> {
  await requireUser();
  if (!UUID_RE.test(invitationId)) return { ok: false, error: "Invitation introuvable." };

  const supabase = await createClient();
  // La lecture passe par la RLS : réservée aux owner/admin du projet.
  const { data: invitation } = await supabase
    .from("project_invitations")
    .select("id, email, token, status, project_id, project:projects(name)")
    .eq("id", invitationId)
    .maybeSingle();
  if (!invitation || invitation.status !== "pending") return { ok: false, error: "Invitation introuvable." };

  const admin = createAdminClient();
  await admin
    .from("project_invitations")
    .update({ expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() })
    .eq("id", invitation.id);

  const link = invitationLink(await getRequestOrigin(), invitation.token);
  const mail = await sendInviteEmail(invitation.email, link, invitation.project?.name ?? "");
  if (mail.status === "error") return { ok: false, error: mail.error };

  revalidatePath(`/projets/${invitation.project_id}/membres`);
  return mail.status === "sent"
    ? { ok: true, message: "Invitation renvoyée", data: { link, emailSent: true } }
    : {
        ok: true,
        message: "Cette personne a déjà un compte : elle verra l'invitation dans « Mes projets ».",
        data: { link, emailSent: false },
      };
}

export async function revokeInvitation(invitationId: string): Promise<ActionResult> {
  await requireUser();
  if (!UUID_RE.test(invitationId)) return { ok: false, error: "Invitation introuvable." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("status", "pending")
    .select("project_id");
  if (error) return { ok: false, error: dbErrorMessage(error, "Impossible d'annuler l'invitation.") };
  if (!data?.length) return { ok: false, error: "Invitation introuvable ou droits insuffisants." };

  revalidatePath(`/projets/${data[0].project_id}/membres`);
  return { ok: true, message: "Invitation annulée" };
}

export async function changeMemberRole(projectId: string, userId: string, role: ProjectRole): Promise<ActionResult> {
  await requireUser();
  if (!UUID_RE.test(projectId) || !UUID_RE.test(userId)) return { ok: false, error: "Membre introuvable." };
  const parsed = memberRoleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, error: "Rôle invalide." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_members")
    .update({ role: parsed.data })
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .select("user_id");
  if (error) return { ok: false, error: dbErrorMessage(error, "Impossible de modifier le rôle.") };
  if (!data?.length) return { ok: false, error: "Modification impossible (le propriétaire ne peut pas changer de rôle)." };

  revalidatePath(`/projets/${projectId}/membres`);
  return { ok: true, message: "Rôle mis à jour" };
}

export async function removeMember(projectId: string, userId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!UUID_RE.test(projectId) || !UUID_RE.test(userId)) return { ok: false, error: "Membre introuvable." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .select("user_id");
  if (error) return { ok: false, error: dbErrorMessage(error, "Impossible de retirer ce membre.") };
  if (!data?.length) return { ok: false, error: "Retrait impossible (le propriétaire ne peut pas être retiré)." };

  revalidatePath("/", "layout");
  return { ok: true, message: userId === user.id ? "Vous avez quitté le projet" : "Membre retiré" };
}
