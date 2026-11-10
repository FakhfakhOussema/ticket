import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Client service role : contourne la RLS. SERVEUR UNIQUEMENT (import "server-only").
 * À n'utiliser que dans des Server Actions après vérification explicite des droits.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante côté serveur.");
  return createClient<Database>(SUPABASE_URL(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
