import type { Project } from "@/types";

/** Pastille de couleur + nom du projet, utilisé en tête de page. */
export function ProjectBadge({ project }: { project: Pick<Project, "name" | "color"> }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
        style={{ backgroundColor: project.color }}
        aria-hidden
      >
        {project.name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="truncate">{project.name}</span>
    </span>
  );
}
