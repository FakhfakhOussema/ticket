import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Inscription" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : undefined;
  const next = rawNext ? safeNext(rawNext) : undefined;
  const loginHref = next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Créer un compte</CardTitle>
        <CardDescription>Quelques secondes pour démarrer.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <RegisterForm next={next} />
        <p className="text-muted-foreground text-center text-sm">
          Déjà inscrit ?{" "}
          <Link href={loginHref} className="text-foreground underline underline-offset-4">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
