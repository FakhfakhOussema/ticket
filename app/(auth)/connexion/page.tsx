import type { Metadata } from "next";
import Link from "next/link";
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
  const linkError = params.error === "lien_invalide";
  const registerHref = next ? `/inscription?next=${encodeURIComponent(next)}` : "/inscription";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Connexion</CardTitle>
        <CardDescription>Accédez à vos projets et à vos tickets.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {linkError ? (
          <p role="alert" className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
            Ce lien est invalide ou a expiré. Reconnectez-vous ou refaites une demande.
          </p>
        ) : null}
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
