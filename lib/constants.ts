import type { InvitationStatus, ProjectRole, TicketPriority, TicketStatus } from "@/types";

export const TICKET_STATUSES = ["todo", "in_progress", "in_review", "done"] as const satisfies readonly TicketStatus[];
export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const satisfies readonly TicketPriority[];
export const PROJECT_ROLES = ["owner", "admin", "member"] as const satisfies readonly ProjectRole[];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  in_review: "En revue",
  done: "Terminé",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};

export const ROLE_LABELS: Record<ProjectRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
};

export const INVITATION_STATUS_LABELS: Record<InvitationStatus, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  declined: "Refusée",
  revoked: "Annulée",
  expired: "Expirée",
};

/** Codes d'erreur levés par les fonctions SQL → messages français. */
export const DB_ERROR_MESSAGES: Record<string, string> = {
  forbidden: "Vous n'avez pas accès à ce projet.",
  not_authenticated: "Vous devez être connecté.",
  invitation_not_found: "Invitation introuvable.",
  invitation_not_pending: "Cette invitation n'est plus valide.",
  invitation_expired: "Cette invitation a expiré.",
  invitation_email_mismatch:
    "Cette invitation est destinée à une autre adresse email. Connectez-vous avec le bon compte.",
  assignee_not_member: "La personne assignée doit être membre du projet.",
};

export const NOTE_COLORS = ["yellow", "blue", "green", "pink", "purple", "gray"] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

export const NOTE_COLOR_LABELS: Record<NoteColor, string> = {
  yellow: "Jaune",
  blue: "Bleu",
  green: "Vert",
  pink: "Rose",
  purple: "Violet",
  gray: "Gris",
};

/** Styles « post-it » : fond de la carte, pastille de sélection. */
export const NOTE_COLOR_STYLES: Record<NoteColor, { card: string; swatch: string }> = {
  yellow: { card: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30", swatch: "bg-amber-300" },
  blue: { card: "bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/30", swatch: "bg-sky-400" },
  green: { card: "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30", swatch: "bg-emerald-400" },
  pink: { card: "bg-pink-50 border-pink-200 dark:bg-pink-500/10 dark:border-pink-500/30", swatch: "bg-pink-400" },
  purple: { card: "bg-violet-50 border-violet-200 dark:bg-violet-500/10 dark:border-violet-500/30", swatch: "bg-violet-400" },
  gray: { card: "bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:border-slate-500/30", swatch: "bg-slate-400" },
};
