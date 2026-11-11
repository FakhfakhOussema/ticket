import type { Metadata } from "next";
import Link from "next/link";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : undefined;
  const next = rawNext ? safeNext(rawNext) : undefined;
  const errorCode = typeof params.error === "string" ? params.error : undefined;
  const errorMessage =
    errorCode === "google"
      ? "La connexion avec Google a échoué ou a été annulée. Réessayez."
      : errorCode === "lien_invalide"
        ? "Ce lien est invalide ou a expiré. Reconnectez-vous ou refaites une demande."
        : undefined;
  const detail = typeof params.detail === "string" ? params.detail.slice(0, 160) : undefined;
  const registerHref = next ? `/inscription?next=${encodeURIComponent(next)}` : "/inscription";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Connexion</CardTitle>
        <CardDescription>Accédez à vos projets et à vos tickets.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {errorMessage ? (
          <p role="alert" className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
            {errorMessage}
            {errorCode === "google" && detail ? <span className="mt-1 block text-xs opacity-80">Détail : {detail}</span> : null}
          </p>
        ) : null}
        <GoogleButton next={next} />
        <OrDivider />
        <LoginForm next={next} />
        <p className="text-muted-foreground text-center text-sm">
          Pas encore de compte ?{" "}
          <Link href={registerHref} className="text-foreground underline underline-offset-4">
            Créer un compte
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
