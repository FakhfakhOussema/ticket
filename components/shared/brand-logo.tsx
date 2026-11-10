import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo Pilotis (public/logo.svg, 493 × 362).
 * Les couleurs d'origine sont très sombres : en mode sombre, on le passe en blanc.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt="Pilotis"
      width={493}
      height={362}
      priority
      className={cn("h-11 w-auto shrink-0 dark:brightness-0 dark:invert", className)}
    />
  );
}
