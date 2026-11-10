import { DB_ERROR_MESSAGES } from "@/lib/constants";

type DbError = { message?: string; code?: string } | null | undefined;

/** Traduit une erreur Postgres / PostgREST en message français pour l'utilisateur. */
export function dbErrorMessage(error: DbError, fallback = "Une erreur est survenue. Réessayez."): string {
  if (!error) return fallback;
  const known = error.message ? DB_ERROR_MESSAGES[error.message] : undefined;
  if (known) return known;
  switch (error.code) {
    case "42501":
      return "Vous n'avez pas les droits nécessaires pour cette action.";
    case "23505":
      return "Cet élément existe déjà.";
    case "23503":
      return "Un élément lié est introuvable.";
    case "22P02":
      return "Identifiant invalide.";
    default:
      return fallback;
  }
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Vrai si l'erreur indique qu'une table n'existe pas encore (migration non appliquée). */
export function isMissingTable(error: { code?: string; message?: string } | null | undefined): boolean {
  return !!error && (error.code === "PGRST205" || error.code === "42P01" || /could not find the table/i.test(error.message ?? ""));
}
