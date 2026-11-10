"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center px-4 text-center">
      <span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
        <TriangleAlert className="size-8" aria-hidden />
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">Une erreur est survenue</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        Quelque chose s&apos;est mal passé de notre côté. Vous pouvez réessayer ou revenir à vos projets.
      </p>
      {error.digest ? <p className="text-muted-foreground mt-2 font-mono text-xs">Référence : {error.digest}</p> : null}
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Réessayer</Button>
        <Link href="/projets" className={buttonVariants({ variant: "outline" })}>
          Mes projets
        </Link>
      </div>
    </div>
  );
}
