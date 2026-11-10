import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type Admin = SupabaseClient<Database>;

/** Crée le bucket au premier usage (clé service role, serveur uniquement). */
export async function ensureBucket(
  admin: Admin,
  name: string,
  options: { public: boolean; fileSizeLimit: number; allowedMimeTypes: string[] },
): Promise<boolean> {
  const { data } = await admin.storage.getBucket(name);
  if (data) return true;
  const { error } = await admin.storage.createBucket(name, options);
  return !error || /already exists/i.test(error.message);
}

/** Supprime récursivement tous les fichiers sous un préfixe (dossier). Les erreurs sont ignorées : nettoyage « au mieux ». */
export async function removePrefix(bucket: string, prefix: string, depth = 0): Promise<void> {
  if (depth > 3) return;
  const admin = createAdminClient();
  const { data } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (!data?.length) return;

  const files = data.filter((o) => o.id).map((o) => `${prefix}/${o.name}`);
  if (files.length) await admin.storage.from(bucket).remove(files);
  for (const folder of data.filter((o) => !o.id)) {
    await removePrefix(bucket, `${prefix}/${folder.name}`, depth + 1);
  }
}
