import { AlertTriangle, ArrowDown, ArrowUp, Equal, type LucideIcon } from "lucide-react";
import type { TicketPriority, TicketStatus } from "@/types";

/** Statuts : À faire = gris, En cours = bleu, En revue = orange, Terminé = vert. */
export const STATUS_STYLES: Record<TicketStatus, { badge: string; dot: string; chart: string }> = {
  todo: {
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-400",
    chart: "#94a3b8",
  },
  in_progress: {
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    dot: "bg-blue-500",
    chart: "#3b82f6",
  },
  in_review: {
    badge: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    dot: "bg-orange-500",
    chart: "#f97316",
  },
  done: {
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    dot: "bg-emerald-500",
    chart: "#10b981",
  },
};

/** Priorités : Basse = gris, Moyenne = bleu, Haute = orange, Urgente = rouge. */
export const PRIORITY_STYLES: Record<TicketPriority, { badge: string; icon: LucideIcon; text: string }> = {
  low: {
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    icon: ArrowDown,
    text: "text-slate-500",
  },
  medium: {
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    icon: Equal,
    text: "text-blue-500",
  },
  high: {
    badge: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    icon: ArrowUp,
    text: "text-orange-500",
  },
  urgent: {
    badge: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    icon: AlertTriangle,
    text: "text-red-500",
  },
};

/** Ordre de tri des priorités (urgente d'abord). */
export const PRIORITY_RANK: Record<TicketPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
export const STATUS_RANK: Record<TicketStatus, number> = { todo: 0, in_progress: 1, in_review: 2, done: 3 };

/** Palette de couleurs de projet. */
export const PROJECT_COLORS = [
  "#4F46E5", // indigo
  "#0EA5E9", // sky
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#8B5CF6", // violet
  "#14B8A6", // teal
  "#64748B", // slate
] as const;

/**
 * Couleurs catégorielles des membres dans les graphiques (ordre fixe, jamais cyclé).
 * Palette validée avec le script de validation dataviz (séparation CVD, bande de luminosité, contraste).
 * Au-delà de 6 membres : regroupement dans « Autres ».
 */
export const MEMBER_CHART_COLORS = ["#6366F1", "#D97706", "#0A9CDA", "#059669", "#8B5CF6", "#EA580C"] as const;
export const UNASSIGNED_COLOR = "#94A3B8";
export const OTHERS_COLOR = "#64748B";
