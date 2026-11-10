import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { TicketStatus } from "@/types";

type Namable = { full_name?: string | null; email?: string | null };

/** Nom affiché : nom complet, sinon partie locale de l'email. */
export function displayName(user: Namable | null | undefined): string {
  if (!user) return "Non assigné";
  return user.full_name?.trim() || user.email?.split("@")[0] || "Utilisateur";
}

export function initials(user: Namable | null | undefined): string {
  const name = displayName(user);
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

/** Classes d'avatar « initiales colorées », stables pour un même identifiant. */
const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
];

export function avatarColorClass(seed: string | null | undefined): string {
  const s = seed ?? "";
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Accepte une date ISO complète ou une date seule (YYYY-MM-DD, interprétée en local). */
export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : parseISO(value);
}

export function formatDate(value: string | Date | null | undefined, pattern = "d MMM yyyy"): string {
  if (!value) return "—";
  const d = toDate(value);
  return isValid(d) ? format(d, pattern, { locale: fr }) : "—";
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, "d MMM yyyy 'à' HH:mm");
}

/** « il y a 2 heures » */
export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = toDate(value);
  return isValid(d) ? formatDistanceToNow(d, { locale: fr, addSuffix: true }) : "—";
}

/** Date du jour au format YYYY-MM-DD (fuseau local), pour comparer aux colonnes `date`. */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function isOverdue(dueDate: string | null | undefined, status: TicketStatus): boolean {
  return !!dueDate && status !== "done" && dueDate < todayISO();
}

export function toDateOnly(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n > 1 ? plural : singular}`;
}
