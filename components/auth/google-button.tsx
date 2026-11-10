"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/actions/auth";

function GoogleLogo() {
  // Logo « G » officiel, quatre couleurs
  return (
    <svg viewBox="0 0 48 48" className="size-4.5" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/** Bouton « Continuer avec Google » (flux OAuth côté serveur). `next` = page où revenir après la connexion. */
export function GoogleButton({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 w-full gap-2.5 bg-background text-sm font-medium"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await signInWithGoogle(next);
          // En cas de succès, l'action redirige vers Google : on n'arrive ici qu'en cas d'erreur.
          if (result && !result.ok) toast.error(result.error);
        })
      }
    >
      <GoogleLogo />
      {pending ? "Redirection vers Google…" : "Continuer avec Google"}
    </Button>
  );
}

/** Séparateur « ou » entre le bouton Google et le formulaire email. */
export function OrDivider() {
  return (
    <div className="text-muted-foreground flex items-center gap-3 text-xs" role="separator" aria-label="ou">
      <span className="bg-border h-px flex-1" />
      ou
      <span className="bg-border h-px flex-1" />
    </div>
  );
}
