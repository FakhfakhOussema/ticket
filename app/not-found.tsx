import { Compass } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center px-4 text-center">
      <span className="bg-primary/10 text-primary mb-5 flex size-16 items-center justify-center rounded-2xl">
        <Compass className="size-8" aria-hidden />
      </span>
      <p className="text-primary text-sm font-semibold">Erreur 404</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Page introuvable</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        Cette page n&apos;existe pas, ou vous n&apos;avez pas accès à ce projet ou à ce ticket.
      </p>
      <Link href="/projets" className={buttonVariants({ className: "mt-6" })}>
        Retour à mes projets
      </Link>
    </div>
  );
}
