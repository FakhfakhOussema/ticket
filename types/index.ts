import type { Enums, Tables } from "./database";

export type Profile = Tables<"profiles">;
export type Project = Tables<"projects">;
export type ProjectMember = Tables<"project_members">;
export type ProjectInvitation = Tables<"project_invitations">;
export type Ticket = Tables<"tickets">;
export type TicketComment = Tables<"ticket_comments">;
export type ProjectNote = Tables<"project_notes">;
export type UserTodo = Tables<"user_todos">;

export type ProjectRole = Enums<"project_role">;
export type InvitationStatus = Enums<"invitation_status">;
export type TicketStatus = Enums<"ticket_status">;
export type TicketPriority = Enums<"ticket_priority">;

/** Profil réduit, tel qu'embarqué dans les jointures. */
export type ProfileSummary = Pick<Profile, "id" | "full_name" | "email" | "avatar_url">;

/** Ligne de la liste des membres (project_members + profil). */
export type MemberWithProfile = ProjectMember & { profile: ProfileSummary };

/** Ticket avec assigné et créateur. */
export type TicketWithPeople = Ticket & {
  assignee: ProfileSummary | null;
  creator: ProfileSummary | null;
};

/** Retour de la RPC get_project_dashboard. */
export type ProjectDashboard = {
  kpi: {
    total: number;
    todo: number;
    in_progress: number;
    in_review: number;
    done: number;
    overdue: number;
    unassigned: number;
  };
  by_assignee: Array<{
    user_id: string | null; // null = non assigné
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    total: number;
    todo: number;
    in_progress: number;
    in_review: number;
    done: number;
    percentage: number;
  }>;
};
