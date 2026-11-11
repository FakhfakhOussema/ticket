import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

function fail(origin: string, reason?: string) {
  const url = new URL("/connexion", origin);
  url.searchParams.set("error", "google");
  if (reason) url.searchParams.set("detail", reason.slice(0, 160));
  return NextResponse.redirect(url);
}

/**
 * Retour de Supabase au format PKCE (?code=…) : connexion Google, confirmation d'inscription,
 * réinitialisation de mot de passe. Échange le code contre une session puis redirige vers la page voulue.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Refus ou erreur côté fournisseur (ex. l'utilisateur annule sur la page Google)
  const providerError = searchParams.get("error_description") ?? searchParams.get("error");
  if (!code && providerError) return fail(origin, providerError);

  // Destination : paramètre `next` (emails) ou cookie posé avant le départ vers Google
  const cookieStore = await cookies();
  const cookieNext = cookieStore.get("pilotis_next")?.value;
  let decodedCookieNext = cookieNext;
  try {
    decodedCookieNext = cookieNext ? decodeURIComponent(cookieNext) : undefined;
  } catch {
    // valeur non encodée : on la garde telle quelle
  }
  const next = safeNext(searchParams.get("next") ?? decodedCookieNext);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.delete("pilotis_next");
      return response;
    }
    return fail(origin, error.message);
  }

  return NextResponse.redirect(`${origin}/connexion?error=lien_invalide`);
}
