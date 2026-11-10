"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  changePasswordSchema,
  profileSchema,
  type ChangePasswordInput,
  type ProfileInput,
} from "@/lib/validations/profile";
import type { ActionResult } from "@/lib/actions/types";

const BUCKET = "avatars";
const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name }).eq("id", user.id);
  if (error) return { ok: false, error: "Impossible de mettre à jour le profil." };
  await supabase.auth.updateUser({ data: { full_name: parsed.data.full_name } });

  revalidatePath("/", "layout");
  return { ok: true, message: "Profil mis à jour" };
}

export async function changePassword(input: ChangePasswordInput): Promise<ActionResult> {
  await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      ok: false,
      error:
        error.code === "same_password"
          ? "Le nouveau mot de passe doit être différent de l'ancien."
          : error.code === "weak_password"
            ? "Mot de passe trop faible. Choisissez-en un plus long ou plus complexe."
            : "Impossible de modifier le mot de passe.",
    };
  }
  return { ok: true, message: "Mot de passe modifié" };
}

/**
 * Envoie l'avatar dans Supabase Storage. L'upload passe par le serveur (clé service role) après
 * vérification de l'utilisateur : le fichier est toujours écrit dans <user_id>/ et jamais ailleurs.
 */
export async function uploadAvatar(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Aucun fichier sélectionné." };
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Format non pris en charge (PNG, JPG, WebP ou GIF)." };
  }
  if (file.size > AVATAR_MAX_BYTES) return { ok: false, error: "L'image ne doit pas dépasser 2 Mo." };

  const admin = createAdminClient();

  // Crée le bucket public au premier envoi
  const { data: bucket } = await admin.storage.getBucket(BUCKET);
  if (!bucket) {
    const { error: createError } = await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: AVATAR_MAX_BYTES,
      allowedMimeTypes: [...AVATAR_TYPES],
    });
    if (createError && !/already exists/i.test(createError.message)) {
      return { ok: false, error: "Le stockage des avatars n'est pas disponible." };
    }
  }

  const path = `${user.id}/avatar-${Date.now()}.${EXTENSIONS[file.type]}`;
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, error: "Échec de l'envoi de l'image." };

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", user.id);
  if (error) return { ok: false, error: "Impossible d'enregistrer l'avatar." };

  // Supprime les anciens fichiers de l'utilisateur
  const { data: existing } = await admin.storage.from(BUCKET).list(user.id);
  const stale = (existing ?? []).map((f) => `${user.id}/${f.name}`).filter((p) => p !== path);
  if (stale.length) await admin.storage.from(BUCKET).remove(stale);

  revalidatePath("/", "layout");
  return { ok: true, message: "Photo de profil mise à jour", data: { url: pub.publicUrl } };
}

export async function removeAvatar(): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) return { ok: false, error: "Impossible de retirer la photo." };

  const admin = createAdminClient();
  const { data: existing } = await admin.storage.from(BUCKET).list(user.id);
  if (existing?.length) await admin.storage.from(BUCKET).remove(existing.map((f) => `${user.id}/${f.name}`));

  revalidatePath("/", "layout");
  return { ok: true, message: "Photo retirée" };
}
