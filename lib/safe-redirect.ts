/**
 * Valide un chemin de redirection (paramètre `next`) pour éviter les redirections ouvertes :
 * uniquement un chemin relatif interne ("/projets"), jamais "//evil.com" ni "https://…".
 */
export function safeNext(next: string | null | undefined, fallback = "/projets"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}
