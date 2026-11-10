import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

/**
 * Atteinte après le clic sur le lien de réinitialisation (ou d'invitation) : l'utilisateur a déjà
 * une session via /auth/callback ou /auth/confirm. Sans session, on renvoie vers la demande de lien.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : undefined;
  const next = rawNext ? safeNext(rawNext) : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/mot-de-passe-oublie");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Choisir un mot de passe</CardTitle>
        <CardDescription>Définissez le mot de passe de votre compte.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm next={next} />
      </CardContent>
    </Card>
  );
}
