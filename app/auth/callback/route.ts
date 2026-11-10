import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

/** Retour des emails Supabase au format PKCE (?code=…) : confirmation d'inscription, reset de mot de passe. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Refus ou erreur côté fournisseur (ex. l'utilisateur annule sur la page Google)
  if (!code && (searchParams.get("error") || searchParams.get("error_description"))) {
    return NextResponse.redirect(`${origin}/connexion?error=google`);
  }
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/connexion?error=lien_invalide`);
}
