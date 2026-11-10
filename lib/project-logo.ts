import { SUPABASE_URL } from "@/lib/env";
import type { Project } from "@/types";

export const PROJECT_LOGO_BUCKET = "project-logos";
export const PROJECT_LOGO_MARKER = "logo";

type LogoProject = Pick<Project, "id" | "icon" | "updated_at">;

/**
 * Le logo d'un projet est stocké dans le bucket public « project-logos » (<id>/logo.png).
 * La colonne `icon` du projet vaut « logo » lorsqu'un logo existe (aucune migration nécessaire).
 * Le paramètre `v` (date de mise à jour) invalide le cache après un changement de logo.
 */
export function projectLogoUrl(project: LogoProject): string | null {
  if (project.icon !== PROJECT_LOGO_MARKER) return null;
  return `${SUPABASE_URL()}/storage/v1/object/public/${PROJECT_LOGO_BUCKET}/${project.id}/logo.png?v=${Date.parse(project.updated_at) || 0}`;
}
