"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { SITE_URL, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import type { ActionResult } from "@/lib/actions/types";

function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Email ou mot de passe incorrect.";
    case "email_not_confirmed":
      return "Votre email n'est pas encore confirmé. Vérifiez votre boîte de réception.";
    case "weak_password":
      return "Mot de passe trop faible. Choisissez-en un plus long ou plus complexe.";
    case "same_password":
      return "Le nouveau mot de passe doit être différent de l'ancien.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Trop de tentatives. Réessayez dans quelques minutes.";
    case "user_already_exists":
    case "email_exists":
      return "Un compte existe déjà avec cet email.";
    case "session_not_found":
    case "refresh_token_not_found":
      return "Votre session a expiré. Reconnectez-vous.";
    default:
      return "Une erreur est survenue. Réessayez.";
  }
}

export async function signIn(input: LoginInput, next?: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: authErrorMessage(error) };

  redirect(safeNext(next));
}

export async function signUp(input: RegisterInput, next?: string): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const { email, password, full_name } = parsed.data;
  const target = safeNext(next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
      emailRedirectTo: `${SITE_URL()}/auth/callback?next=${encodeURIComponent(target)}`,
    },
  });
  if (error) return { ok: false, error: authErrorMessage(error) };

  // Confirmation d'email activée : pas de session tant que le lien n'a pas été cliqué.
  if (!data.session) {
    return {
      ok: true,
      message: "Compte créé. Un email de confirmation vient de vous être envoyé : cliquez sur le lien pour activer votre compte.",
    };
  }

  redirect(target);
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Adresse email invalide." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL()}/auth/callback?next=${encodeURIComponent("/reinitialiser-mot-de-passe")}`,
  });

  // Erreurs de limite d'envoi signalées ; toute autre issue donne le même message
  // (on ne révèle pas si l'email possède un compte).
  if (error && (error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit")) {
    return { ok: false, error: authErrorMessage(error) };
  }

  return {
    ok: true,
    message: "Si un compte existe pour cette adresse, un email de réinitialisation vient d'être envoyé.",
  };
}

export async function updatePassword(input: ResetPasswordInput, next?: string): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Lien expiré ou invalide. Refaites une demande de réinitialisation." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: authErrorMessage(error) };

  redirect(safeNext(next));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}

/** Vrai si le fournisseur Google est activé dans Supabase (Authentication → Providers). */
async function isGoogleEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL()}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_ANON_KEY() },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const settings = (await res.json()) as { external?: { google?: boolean } };
    return settings.external?.google === true;
  } catch {
    return false;
  }
}

/**
 * « Continuer avec Google » : démarre le flux OAuth (PKCE). Supabase redirige vers Google, puis vers
 * /auth/callback qui échange le code contre une session et renvoie vers `next`.
 * Le compte (et son profil) est créé automatiquement à la première connexion.
 */
export async function signInWithGoogle(next?: string): Promise<ActionResult> {
  if (!(await isGoogleEnabled())) {
    return {
      ok: false,
      error: "La connexion avec Google n'est pas encore activée. Activez le fournisseur Google dans Supabase (voir le README).",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${SITE_URL()}/auth/callback?next=${encodeURIComponent(safeNext(next))}`,
      // Laisse l'utilisateur choisir son compte Google à chaque fois
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) return { ok: false, error: "Impossible de démarrer la connexion avec Google. Réessayez." };

  redirect(data.url);
}
