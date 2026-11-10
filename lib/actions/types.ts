/** Résultat standard des Server Actions (une redirection réussie lève sa propre exception Next et ne retourne rien). */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string };
