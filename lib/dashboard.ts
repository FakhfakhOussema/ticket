import { MEMBER_CHART_COLORS, OTHERS_COLOR, UNASSIGNED_COLOR } from "@/lib/ticket-ui";
import type { MemberWithProfile, ProjectDashboard } from "@/types";

export type ChartRow = {
  key: string;
  user_id: string | null;
  name: string;
  avatar: { id: string | null; full_name: string | null; email: string | null; avatar_url: string | null } | null;
  color: string;
  total: number;
  todo: number;
  in_progress: number;
  in_review: number;
  done: number;
  percentage: number;
};

/**
 * Lignes des graphiques. La couleur suit l'entité (ordre d'arrivée dans le projet), jamais son rang :
 * filtrer ou réordonner ne repeint pas les autres. Au-delà de 6 membres : regroupés dans « Autres ».
 */
export function buildChartRows(dashboard: ProjectDashboard, members: MemberWithProfile[]): ChartRow[] {
  const colorByUser = new Map<string, string>();
  members.forEach((m, i) => colorByUser.set(m.user_id, MEMBER_CHART_COLORS[i] ?? OTHERS_COLOR));

  const rows: ChartRow[] = dashboard.by_assignee.map((a) => ({
    key: a.user_id ?? "unassigned",
    user_id: a.user_id,
    name: a.user_id ? a.full_name?.trim() || a.email?.split("@")[0] || "Utilisateur" : "Non assigné",
    avatar: a.user_id ? { id: a.user_id, full_name: a.full_name, email: a.email, avatar_url: a.avatar_url } : null,
    color: a.user_id ? (colorByUser.get(a.user_id) ?? OTHERS_COLOR) : UNASSIGNED_COLOR,
    total: a.total,
    todo: a.todo,
    in_progress: a.in_progress,
    in_review: a.in_review,
    done: a.done,
    percentage: Number(a.percentage),
  }));

  // Regroupe les membres au-delà de la palette dans « Autres »
  const overflow = rows.filter((r) => r.user_id && r.color === OTHERS_COLOR);
  if (overflow.length <= 1) return rows;
  const kept = rows.filter((r) => !overflow.includes(r));
  const sum = (k: "total" | "todo" | "in_progress" | "in_review" | "done" | "percentage") =>
    overflow.reduce((acc, r) => acc + r[k], 0);
  kept.push({
    key: "others",
    user_id: null,
    name: `Autres (${overflow.length})`,
    avatar: null,
    color: OTHERS_COLOR,
    total: sum("total"),
    todo: sum("todo"),
    in_progress: sum("in_progress"),
    in_review: sum("in_review"),
    done: sum("done"),
    percentage: Math.round(sum("percentage") * 10) / 10,
  });
  return kept;
}
