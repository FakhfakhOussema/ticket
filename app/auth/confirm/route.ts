import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: readonly EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/** Accepte un chemin relatif, ou une URL absolue de MÊME origine (ex. {{ .RedirectTo }} d'un template Supabase). */
function resolveNext(raw: string | null, origin: string): string {
  if (raw && /^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (url.origin === origin) return safeNext(url.pathname + url.search);
    } catch {
      // URL invalide : repli ci-dessous
    }
    return safeNext(null);
  }
  return safeNext(raw);
}

/**
 * Retour des emails Supabase au format « token_hash » (templates personnalisés) :
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next={{ .RedirectTo }}
 * Nécessaire pour les invitations (inviteUserByEmail), dont le lien ne peut pas utiliser PKCE.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = resolveNext(searchParams.get("next"), origin);

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/connexion?error=lien_invalide`);
}
