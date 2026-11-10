"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage, UUID_RE } from "@/lib/db-error";
import { PROJECT_LOGO_BUCKET, PROJECT_LOGO_MARKER } from "@/lib/project-logo";
import { ensureBucket, removePrefix } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { projectSchema, type ProjectInput } from "@/lib/validations/project";
import type { ActionResult } from "@/lib/actions/types";

export async function createProject(input: ProjectInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: dbErrorMessage(error, "Impossible de créer le projet.") };

  revalidatePath("/", "layout");
  return { ok: true, message: "Projet créé", data: { id: data.id } };
}

export async function updateProject(projectId: string, input: ProjectInput): Promise<ActionResult> {
  await requireUser();
  if (!UUID_RE.test(projectId)) return { ok: false, error: "Projet introuvable." };
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color,
    })
    .eq("id", projectId)
    .select("id");

  if (error) return { ok: false, error: dbErrorMessage(error, "Impossible de modifier le projet.") };
  if (!data?.length) return { ok: false, error: "Seul le propriétaire peut modifier le projet." };

  revalidatePath("/", "layout");
  return { ok: true, message: "Projet mis à jour" };
}

export async function deleteProject(projectId: string, confirmName: string): Promise<ActionResult> {
  await requireUser();
  if (!UUID_RE.test(projectId)) return { ok: false, error: "Projet introuvable." };

  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("name").eq("id", projectId).maybeSingle();
  if (!project) return { ok: false, error: "Projet introuvable." };
  if (project.name !== confirmName.trim()) return { ok: false, error: "Le nom saisi ne correspond pas au nom du projet." };

  const { data, error } = await supabase.from("projects").delete().eq("id", projectId).select("id");
  if (error) return { ok: false, error: dbErrorMessage(error, "Impossible de supprimer le projet.") };
  if (!data?.length) return { ok: false, error: "Seul le propriétaire peut supprimer le projet." };

  // Nettoyage du stockage (logo + images des tickets) : au mieux, sans bloquer la suppression
  await Promise.allSettled([removePrefix(PROJECT_LOGO_BUCKET, projectId), removePrefix("ticket-images", projectId)]);

  revalidatePath("/", "layout");
  return { ok: true, message: "Projet supprimé" };
}

const LOGO_MAX_BYTES = 2 * 1024 * 1024;

async function assertOwner(projectId: string): Promise<boolean> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.role === "owner";
}

/** Logo du projet (PNG carré produit par le recadrage). Réservé au propriétaire. */
export async function uploadProjectLogo(projectId: string, formData: FormData): Promise<ActionResult> {
  if (!UUID_RE.test(projectId)) return { ok: false, error: "Projet introuvable." };
  if (!(await assertOwner(projectId))) return { ok: false, error: "Seul le propriétaire peut modifier le logo." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Aucun fichier sélectionné." };
  if (file.type !== "image/png") return { ok: false, error: "Le logo doit être une image PNG recadrée." };
  if (file.size > LOGO_MAX_BYTES) return { ok: false, error: "Le logo ne doit pas dépasser 2 Mo." };

  const admin = createAdminClient();
  const ready = await ensureBucket(admin, PROJECT_LOGO_BUCKET, {
    public: true,
    fileSizeLimit: LOGO_MAX_BYTES,
    allowedMimeTypes: ["image/png"],
  });
  if (!ready) return { ok: false, error: "Le stockage des logos n'est pas disponible." };

  const { error: uploadError } = await admin.storage
    .from(PROJECT_LOGO_BUCKET)
    .upload(`${projectId}/logo.png`, file, { contentType: "image/png", upsert: true });
  if (uploadError) return { ok: false, error: "Échec de l'envoi du logo." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ icon: PROJECT_LOGO_MARKER })
    .eq("id", projectId)
    .select("id, icon, updated_at")
    .single();
  if (error || !data) return { ok: false, error: "Impossible d'enregistrer le logo." };

  revalidatePath("/", "layout");
  return { ok: true, message: "Logo du projet mis à jour" };
}

export async function removeProjectLogo(projectId: string): Promise<ActionResult> {
  if (!UUID_RE.test(projectId)) return { ok: false, error: "Projet introuvable." };
  if (!(await assertOwner(projectId))) return { ok: false, error: "Seul le propriétaire peut modifier le logo." };

  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ icon: "folder" }).eq("id", projectId);
  if (error) return { ok: false, error: "Impossible de retirer le logo." };

  await removePrefix(PROJECT_LOGO_BUCKET, projectId);
  revalidatePath("/", "layout");
  return { ok: true, message: "Logo retiré" };
}
