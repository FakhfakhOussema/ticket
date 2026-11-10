import Image from "next/image";
import { projectLogoUrl } from "@/lib/project-logo";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

type Props = {
  project: Pick<Project, "id" | "name" | "color" | "icon" | "updated_at">;
  className?: string;
  /** Classes de taille du conteneur (ex. « size-10 »). */
  size?: string;
};

/** Logo du projet s'il existe, sinon l'initiale sur fond de la couleur du projet. */
export function ProjectAvatar({ project, className, size = "size-10" }: Props) {
  const logo = projectLogoUrl(project);
  if (logo) {
    return (
      <span className={cn("bg-card relative shrink-0 overflow-hidden rounded-xl border", size, className)}>
        <Image src={logo} alt={`Logo de ${project.name}`} fill sizes="64px" unoptimized className="object-cover" />
      </span>
    );
  }
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-xl font-semibold text-white", size, className)}
      style={{ backgroundColor: project.color }}
      aria-hidden
    >
      {project.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
