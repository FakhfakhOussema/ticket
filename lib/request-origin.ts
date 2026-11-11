import "server-only";
import { headers } from "next/headers";
import { SITE_URL } from "@/lib/env";

/**
 * Origine (schéma + hôte + port) réellement utilisée par le navigateur pour cette requête.
 * Le retour OAuth doit revenir exactement sur la même origine que celle où le cookie de sécurité (PKCE)
 * a été posé ; on ne se fie donc pas uniquement à NEXT_PUBLIC_SITE_URL (qui peut différer : autre port, 127.0.0.1…).
 */
export async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return SITE_URL();
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
