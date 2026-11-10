import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

/**
 * Abonnement Realtime authentifié.
 *
 * Le canal doit rejoindre avec le JWT de l'utilisateur : sinon la RLS filtre tous les événements
 * (le client utiliserait la clé publique, rôle `anon`). On attend donc la session avant de s'abonner.
 * Retourne la fonction de désabonnement, à renvoyer depuis un `useEffect`.
 */
export function subscribeAuthenticated(configure: (supabase: SupabaseClient<Database>) => RealtimeChannel): () => void {
  const supabase = createClient();
  let channel: RealtimeChannel | undefined;
  let cancelled = false;

  void supabase.auth.getSession().then(({ data }) => {
    if (cancelled) return;
    if (data.session) supabase.realtime.setAuth(data.session.access_token);
    channel = configure(supabase).subscribe();
  });

  return () => {
    cancelled = true;
    if (channel) void supabase.removeChannel(channel);
  };
}
